/**
 * Processing Monitor Service
 * Monitors video processing progress and automatically handles stuck videos
 */

import { db } from './db';
import { videos } from '../shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { storage } from './storage';

interface StuckVideo {
  id: number;
  title: string;
  status: string;
  processingProgress: number;
  stuckDuration: number;
  userId: number;
}

class ProcessingMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly STUCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes

  start() {
    if (this.monitoringInterval) {
      return;
    }

    console.log('🔍 Starting processing monitor...');
    this.monitoringInterval = setInterval(async () => {
      await this.checkForStuckVideos();
    }, this.CHECK_INTERVAL);

    // Run initial check
    this.checkForStuckVideos();
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Processing monitor stopped');
    }
  }

  async checkForStuckVideos() {
    try {
      const now = new Date();
      const thresholdTime = new Date(now.getTime() - this.STUCK_THRESHOLD);

      // Find videos that have been processing for too long
      const stuckVideos = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.status, 'processing'),
            lt(videos.updatedAt, thresholdTime)
          )
        );

      if (stuckVideos.length === 0) {
        return;
      }

      console.log(`🚨 Found ${stuckVideos.length} stuck videos`);

      for (const video of stuckVideos) {
        const stuckDuration = now.getTime() - video.updatedAt.getTime();
        const stuckMinutes = Math.floor(stuckDuration / (1000 * 60));

        console.log(`📹 Video ${video.id} "${video.title}" stuck at ${video.processingProgress}% for ${stuckMinutes} minutes`);

        await this.handleStuckVideo({
          id: video.id,
          title: video.title,
          status: video.status,
          processingProgress: video.processingProgress,
          userId: video.userId,
          stuckDuration
        });
      }
    } catch (error) {
      console.error('❌ Error checking for stuck videos:', error);
    }
  }

  private async handleStuckVideo(video: StuckVideo) {
    try {
      const stuckMinutes = Math.floor(video.stuckDuration / (1000 * 60));
      
      // Reset video to uploaded status for retry
      await db
        .update(videos)
        .set({
          status: 'uploaded',
          processingProgress: 0,
          updatedAt: new Date()
        })
        .where(eq(videos.id, video.id));

      console.log(`🔄 Reset video ${video.id} after being stuck for ${stuckMinutes} minutes`);

      // Log the stuck video incident
      await this.logStuckIncident(video, stuckMinutes);

    } catch (error) {
      console.error(`❌ Error handling stuck video ${video.id}:`, error);
    }
  }

  private async logStuckIncident(video: StuckVideo, stuckMinutes: number) {
    try {
      // Log to error tracking if available
      const errorMessage = `Video ${video.id} got stuck at ${video.processingProgress}% for ${stuckMinutes} minutes`;
      
      // You could enhance this to log to your error tracking system
      console.log(`📝 Logged stuck incident: ${errorMessage}`);
      
    } catch (error) {
      console.error('❌ Error logging stuck incident:', error);
    }
  }

  async getStuckVideoStats() {
    try {
      const now = new Date();
      const thresholdTime = new Date(now.getTime() - this.STUCK_THRESHOLD);

      const stuckVideos = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.status, 'processing'),
            lt(videos.updatedAt, thresholdTime)
          )
        );

      return {
        total: stuckVideos.length,
        byProgress: stuckVideos.reduce((acc, video) => {
          const progress = video.processingProgress;
          acc[progress] = (acc[progress] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        videos: stuckVideos.map(video => ({
          id: video.id,
          title: video.title,
          progress: video.processingProgress,
          stuckMinutes: Math.floor((now.getTime() - video.updatedAt.getTime()) / (1000 * 60))
        }))
      };
    } catch (error) {
      console.error('❌ Error getting stuck video stats:', error);
      return { total: 0, byProgress: {}, videos: [] };
    }
  }
}

export const processingMonitor = new ProcessingMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  processingMonitor.start();
}