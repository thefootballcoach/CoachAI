import fs from 'fs';
import path from 'path';
import { storage } from './storage';

// Configuration for cleanup
const CONFIG = {
  // Cleanup temporary files older than 1 hour (in milliseconds)
  TEMP_FILES_MAX_AGE: 60 * 60 * 1000,
  
  // Cleanup processed videos older than 30 days (if enabled)
  PROCESSED_VIDEOS_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
  
  // Whether to delete processed video files from disk after 30 days
  DELETE_OLD_VIDEOS: false,
  
  // Maximum size of temp directory in bytes (50GB for large video processing)
  MAX_TEMP_DIR_SIZE: 50 * 1024 * 1024 * 1024,
  
  // Run cleanup every 30 minutes
  CLEANUP_INTERVAL_MS: 30 * 60 * 1000
};

/**
 * Clean up temporary files that are older than the configured age
 */
export async function cleanupTempFiles(): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Ensure the directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      return;
    }
    
    console.log('Starting temporary files cleanup...');
    
    // Get all files in the temp directory
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let totalCleaned = 0;
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        // If file is older than max age, delete it
        if (now - stats.mtimeMs > CONFIG.TEMP_FILES_MAX_AGE) {
          const fileSize = stats.size;
          fs.unlinkSync(filePath);
          totalCleaned++;
          totalSize += fileSize;
          console.log(`Cleaned up old temp file: ${file} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (err) {
        console.error(`Error processing temp file ${file}:`, err);
      }
    }
    
    console.log(`Temporary files cleanup completed. Removed ${totalCleaned} files, freed ${(totalSize / 1024 / 1024).toFixed(2)} MB.`);
  } catch (error) {
    console.error('Error in cleanupTempFiles:', error);
  }
}

/**
 * Clean up old processed audio files
 */
export async function cleanupProcessedVideos(): Promise<void> {
  // Skip if deletion of old audio files is disabled
  if (!CONFIG.DELETE_OLD_VIDEOS) {
    return;
  }
  
  try {
    const audiosDir = path.join(process.cwd(), 'uploads', 'audios');
    
    // Ensure the directory exists
    if (!fs.existsSync(audiosDir)) {
      fs.mkdirSync(audiosDir, { recursive: true });
      return;
    }
    
    console.log('Starting old audio files cleanup...');
    
    // Get all videos from the database
    const videos = await storage.getAllVideos();
    const now = Date.now();
    let totalCleaned = 0;
    let totalSize = 0;
    
    for (const video of videos) {
      // Only process completed videos
      if (video.status !== 'completed') continue;
      
      // Skip if no createdAt or video is too new
      if (!video.createdAt) continue;
      
      const createdTime = new Date(video.createdAt).getTime();
      if (now - createdTime < CONFIG.PROCESSED_VIDEOS_MAX_AGE) continue;
      
      // Check if the file exists
      const filePath = path.join(audiosDir, video.filename);
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;
        
        // Delete the file
        fs.unlinkSync(filePath);
        totalCleaned++;
        totalSize += fileSize;
        
        // Update the video status to "archived" (video is still in DB, but file is removed)
        await storage.updateVideo(video.id, { status: 'archived' });
        
        console.log(`Archived old audio: ${video.title} (ID: ${video.id}) - ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        console.error(`Error processing audio file ${video.filename}:`, err);
      }
    }
    
    console.log(`Audio cleanup completed. Archived ${totalCleaned} audio files, freed ${(totalSize / 1024 / 1024).toFixed(2)} MB.`);
  } catch (error) {
    console.error('Error in cleanupProcessedVideos:', error);
  }
}

/**
 * Enforce maximum size for temp directory
 * If the temp directory exceeds the max size, delete the oldest files first
 */
export async function enforceMaxTempSize(): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Ensure the directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      return;
    }
    
    // Get all files in the temp directory with their stats
    const files = fs.readdirSync(tempDir).map(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        size: stats.size,
        mtime: stats.mtimeMs
      };
    });
    
    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // If we're under the limit, no action needed
    if (totalSize <= CONFIG.MAX_TEMP_DIR_SIZE) {
      return;
    }
    
    console.log(`Temp directory size (${(totalSize / 1024 / 1024).toFixed(2)} MB) exceeds limit (${(CONFIG.MAX_TEMP_DIR_SIZE / 1024 / 1024).toFixed(2)} MB). Cleaning up...`);
    
    // Sort files by modification time (oldest first)
    files.sort((a, b) => a.mtime - b.mtime);
    
    let deletedSize = 0;
    let deletedCount = 0;
    let currentSize = totalSize;
    
    // Delete oldest files until we're under the limit
    for (const file of files) {
      if (currentSize <= CONFIG.MAX_TEMP_DIR_SIZE) {
        break;
      }
      
      try {
        fs.unlinkSync(file.path);
        currentSize -= file.size;
        deletedSize += file.size;
        deletedCount++;
        console.log(`Removed temp file due to size limit: ${path.basename(file.path)} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      } catch (err) {
        console.error(`Error deleting temp file ${file.path}:`, err);
      }
    }
    
    console.log(`Size-based cleanup completed. Removed ${deletedCount} files, freed ${(deletedSize / 1024 / 1024).toFixed(2)} MB.`);
  } catch (error) {
    console.error('Error in enforceMaxTempSize:', error);
  }
}

/**
 * Run all cleanup tasks
 */
export async function runCleanup(): Promise<void> {
  console.log('Starting cleanup tasks...');
  
  try {
    // Clean up temporary files
    await cleanupTempFiles();
    
    // Enforce maximum temp directory size
    await enforceMaxTempSize();
    
    // Clean up old processed videos
    await cleanupProcessedVideos();
    
    console.log('All cleanup tasks completed successfully.');
  } catch (error) {
    console.error('Error during cleanup tasks:', error);
  }
}

/**
 * Create upload directories if they don't exist
 */
export function ensureUploadDirectories(): void {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'audios'),
    path.join(process.cwd(), 'uploads', 'temp')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

// Set up periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupSchedule(): void {
  // Ensure upload directories exist
  ensureUploadDirectories();
  
  // Run immediate cleanup
  runCleanup();
  
  // Schedule periodic cleanup
  if (!cleanupInterval) {
    cleanupInterval = setInterval(runCleanup, CONFIG.CLEANUP_INTERVAL_MS);
    console.log(`Scheduled automatic cleanup to run every ${CONFIG.CLEANUP_INTERVAL_MS / 60000} minutes.`);
  }
}

export function stopCleanupSchedule(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Automatic cleanup schedule stopped.');
  }
}