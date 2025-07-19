// Trigger ultra-thorough analysis for video 95
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function triggerAnalysis() {
  try {
    console.log("🚀 Triggering ultra-thorough analysis for video 95...");
    
    // Import the processing queue module
    const { processingQueue } = await import('./server/processing-queue.js');
    const { storage } = await import('./server/storage.js');
    
    // Get current video status
    const video = await storage.getVideo(95);
    if (!video) {
      console.error("❌ Video 95 not found");
      return;
    }
    
    console.log(`📹 Video: ${video.title}`);
    console.log(`📊 Current status: ${video.status}`);
    
    // Set status to allow processing
    await storage.updateVideoStatus(95, "uploaded", 0);
    console.log("✅ Updated video status to 'uploaded'");
    
    // Add to processing queue with highest priority
    processingQueue.add(95, 10);
    console.log("✅ Added video 95 to processing queue with priority 10");
    
    // Check queue status
    const queueStatus = processingQueue.getQueueStatus();
    console.log("📋 Queue status:", queueStatus);
    
    console.log("🎯 Analysis triggered! The ultra-thorough system will now:");
    console.log("   - Perform multi-AI analysis (OpenAI + Claude + Perplexity)");
    console.log("   - Populate ALL 9 feedback sections comprehensively");
    console.log("   - Use persistent analysis loops until complete");
    console.log("   - Eliminate any placeholder content");
    
    console.log("\n⏳ Processing will take 2-3 minutes. Refresh the feedback page to see results.");
    
  } catch (error) {
    console.error("❌ Failed to trigger analysis:", error);
  }
}

triggerAnalysis();