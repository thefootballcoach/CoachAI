import { processAudio } from "./video-processor";
import { bulletproofProcessVideo } from "./bulletproof-processor";
import { storage } from "./storage";

interface QueueItem {
  videoId: number;
  priority: number;
  addedAt: Date;
}

class ProcessingQueue {
  private queue: QueueItem[] = [];
  private processing = new Set<number>();
  private maxConcurrent = 3; // Process max 3 audios simultaneously
  private retryCount = new Map<number, number>();
  
  add(videoId: number, priority = 1) {
    // Check if already in queue or processing
    if (this.processing.has(videoId) || this.queue.some(item => item.videoId === videoId)) {
      console.log(`Audio ${videoId} already in queue or processing`);
      return;
    }
    
    this.queue.push({
      videoId,
      priority,
      addedAt: new Date()
    });
    
    // Sort by priority (higher first), then by time added
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.addedAt.getTime() - b.addedAt.getTime();
    });
    
    console.log(`Added audio ${videoId} to processing queue (position: ${this.queue.findIndex(item => item.videoId === videoId) + 1})`);
    this.processNext();
  }
  
  private async processNext() {
    if (this.processing.size >= this.maxConcurrent) {
      console.log(`Max concurrent processing limit reached (${this.maxConcurrent})`);
      return;
    }
    
    if (this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift()!;
    this.processing.add(item.videoId);
    
    console.log(`Starting processing for audio ${item.videoId} (${this.processing.size}/${this.maxConcurrent} slots used)`);
    
    try {
      // Use bulletproof processor for maximum reliability
      const result = await bulletproofProcessVideo(item.videoId);
      
      if (result.success) {
        console.log(`Completed processing for audio ${item.videoId}`);
        this.retryCount.delete(item.videoId);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error: any) {
      console.error(`Error processing audio ${item.videoId}:`, error);
      
      // Retry logic for transient failures
      const retries = this.retryCount.get(item.videoId) || 0;
      if (retries < 2 && this.shouldRetry(error)) {
        this.retryCount.set(item.videoId, retries + 1);
        
        // For circuit breaker errors, implement delayed retry
        if (error.message.includes('Circuit breaker open')) {
          const retryDelay = error.message.includes('retry in') ? 
            parseInt(error.message.match(/retry in (\d+) seconds/)?.[1] || '300') * 1000 : 300000;
          
          console.log(`Scheduling delayed retry for audio ${item.videoId} in ${retryDelay/1000} seconds (attempt ${retries + 2}/3)`);
          
          setTimeout(() => {
            this.queue.unshift({
              videoId: item.videoId,
              priority: item.priority + 1,
              addedAt: new Date()
            });
            this.processNext();
          }, retryDelay);
        } else {
          console.log(`Retrying audio ${item.videoId} immediately (attempt ${retries + 2}/3)`);
          // Add back to queue with higher priority for immediate retry
          this.queue.unshift({
            videoId: item.videoId,
            priority: item.priority + 1,
            addedAt: new Date()
          });
        }
      } else {
        await storage.updateVideoStatus(item.videoId, "failed", 0);
        this.retryCount.delete(item.videoId);
      }
    } finally {
      this.processing.delete(item.videoId);
      console.log(`Released processing slot for audio ${item.videoId} (${this.processing.size}/${this.maxConcurrent} slots used)`);
      
      // Process next item in queue with shorter delay
      setTimeout(() => this.processNext(), 500);
    }
  }
  
  private shouldRetry(error: any): boolean {
    // Don't retry for API key or quota issues
    if (error.message.includes('API key') || 
        error.message.includes('quota') || 
        error.message.includes('unauthorized')) {
      return false;
    }
    
    const retryableErrors = [
      'timeout',
      'network',
      'ECONNRESET',
      'ETIMEDOUT',
      'rate limit',
      'server error',
      'circuit breaker open',
      'temporarily unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(keyword => errorMessage.includes(keyword)) ||
           error.status >= 500 ||
           error.status === 429;
  }
  
  getQueueStatus() {
    return {
      queue: this.queue.length,
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      processingIds: Array.from(this.processing)
    };
  }
  
  remove(videoId: number) {
    this.queue = this.queue.filter(item => item.videoId !== videoId);
    this.processing.delete(videoId);
  }
}

export const processingQueue = new ProcessingQueue();