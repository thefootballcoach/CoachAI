import { processingQueue } from "./processing-queue";
import { loadavg } from "os";

interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  loadAverage: number[];
  queueStatus: any;
}

class SystemMonitor {
  private metrics: SystemMetrics | null = null;
  private monitoring = false;
  
  start() {
    if (this.monitoring) return;
    
    this.monitoring = true;
    console.log("Starting system monitoring...");
    
    // Monitor every 30 seconds
    setInterval(() => {
      this.updateMetrics();
      this.checkSystemHealth();
    }, 30000);
    
    // Initial metrics
    this.updateMetrics();
  }
  
  private updateMetrics() {
    this.metrics = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      loadAverage: loadavg(),
      queueStatus: processingQueue.getQueueStatus()
    };
  }
  
  private checkSystemHealth() {
    if (!this.metrics) return;
    
    const { memoryUsage, queueStatus } = this.metrics;
    const memoryUsedMB = memoryUsage.rss / 1024 / 1024;
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    // Log system status
    console.log(`System Status - Memory: ${memoryUsedMB.toFixed(1)}MB, Heap: ${heapUsedMB.toFixed(1)}MB, Queue: ${queueStatus.processing}/${queueStatus.maxConcurrent}, Pending: ${queueStatus.queue}`);
    
    // Force garbage collection if memory usage is high
    if (heapUsedMB > 200 && global.gc) {
      console.log("High memory usage detected, running garbage collection...");
      global.gc();
      
      // Update metrics after GC
      setTimeout(() => this.updateMetrics(), 1000);
    }
    
    // Warn if queue is backing up
    if (queueStatus.queue > 10) {
      console.warn(`High queue backlog detected: ${queueStatus.queue} items pending`);
    }
  }
  
  getMetrics(): SystemMetrics | null {
    return this.metrics;
  }
  
  stop() {
    this.monitoring = false;
    console.log("System monitoring stopped");
  }
}

export const systemMonitor = new SystemMonitor();