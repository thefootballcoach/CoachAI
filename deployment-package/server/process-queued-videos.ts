import { db } from "./db";
import { videos } from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { processingQueue } from "./processing-queue";

async function processQueuedVideos() {
  try {
    console.log("Checking for queued videos...");
    
    // Get all videos with "queued" status
    const queuedVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "queued"))
      .orderBy(asc(videos.createdAt))
      .limit(10);
    
    if (queuedVideos.length === 0) {
      console.log("No queued videos found.");
      return;
    }
    
    console.log(`Found ${queuedVideos.length} queued videos to process:`);
    
    for (const video of queuedVideos) {
      console.log(`- Adding video ${video.id}: "${video.title}" to processing queue`);
      processingQueue.add(video.id, 1);
    }
    
    console.log("All queued videos have been added to the processing queue.");
    
    // Get queue status
    const status = processingQueue.getQueueStatus();
    console.log(`Queue status: ${status.queue} items in queue, ${status.processing} currently processing`);
    
  } catch (error) {
    console.error("Error processing queued videos:", error);
  }
}

// Run the function
processQueuedVideos();

// Export for potential reuse
export { processQueuedVideos };