import { S3Service } from './s3-service';
import { db } from './db';
import { videos, feedbacks } from '../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { transcribeAudioToText } from './openai';

const execAsync = promisify(exec);
const s3Service = new S3Service();

interface ChunkInfo {
  start: number;
  duration: number;
  index: number;
  path: string;
}

/**
 * Process large video files by downloading and processing in chunks
 * This avoids the platform limitation of downloading files > 2GB
 */
export async function processLargeVideoInChunks(
  videoId: number,
  progressCallback?: (progress: number, message: string) => Promise<void>
): Promise<{ success: boolean; transcript?: string; error?: string }> {
  
  const tempDir = path.join(process.cwd(), 'uploads', 'temp', `video_${videoId}_chunks`);
  
  try {
    // Get video info
    const [video] = await db.select().from(videos).where(eq(videos.id, videoId));
    if (!video || !video.s3Key) {
      throw new Error('Video not found or missing S3 key');
    }
    
    console.log(`[CHUNKED] Processing large video: ${video.title}`);
    console.log(`[CHUNKED] S3 Key: ${video.s3Key}`);
    
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Get video metadata from S3
    const metadata = await s3Service.getObjectMetadata(video.s3Key);
    const totalSize = metadata.ContentLength || 0;
    const totalSizeMB = totalSize / (1024 * 1024);
    
    console.log(`[CHUNKED] Total file size: ${totalSizeMB.toFixed(2)} MB`);
    
    if (progressCallback) {
      await progressCallback(5, `Preparing to process ${totalSizeMB.toFixed(0)}MB video file...`);
    }
    
    // Download video in chunks (100MB chunks)
    const chunkSize = 100 * 1024 * 1024; // 100MB
    const numChunks = Math.ceil(totalSize / chunkSize);
    const videoChunks: string[] = [];
    
    console.log(`[CHUNKED] Downloading in ${numChunks} chunks...`);
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize - 1, totalSize - 1);
      const chunkPath = path.join(tempDir, `chunk_${i}.part`);
      
      if (progressCallback) {
        const downloadProgress = 5 + (i / numChunks) * 20;
        await progressCallback(downloadProgress, `Downloading chunk ${i + 1}/${numChunks}...`);
      }
      
      console.log(`[CHUNKED] Downloading chunk ${i + 1}/${numChunks} (${start}-${end})`);
      
      // Download chunk with range request
      const chunkData = await s3Service.downloadFileRange(video.s3Key, start, end);
      fs.writeFileSync(chunkPath, chunkData);
      videoChunks.push(chunkPath);
    }
    
    // Combine chunks into complete video
    const completeVideoPath = path.join(tempDir, 'complete_video.mov');
    console.log(`[CHUNKED] Combining ${numChunks} chunks...`);
    
    if (progressCallback) {
      await progressCallback(25, 'Assembling video file...');
    }
    
    // Combine using binary concatenation
    const writeStream = fs.createWriteStream(completeVideoPath);
    for (const chunkPath of videoChunks) {
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
      fs.unlinkSync(chunkPath); // Clean up chunk after writing
    }
    writeStream.end();
    
    // Wait for write to complete
    await new Promise((resolve) => writeStream.on('finish', resolve));
    
    // Verify video file
    const stats = fs.statSync(completeVideoPath);
    console.log(`[CHUNKED] Complete video size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Extract audio from video
    if (progressCallback) {
      await progressCallback(30, 'Extracting audio from video...');
    }
    
    const audioPath = path.join(tempDir, 'audio.mp3');
    const extractCommand = `ffmpeg -i "${completeVideoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -ab 64k "${audioPath}" -y`;
    
    console.log('[CHUNKED] Extracting audio...');
    await execAsync(extractCommand);
    
    // Get audio duration
    const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`;
    const durationResult = await execAsync(durationCommand);
    const totalDuration = parseFloat(durationResult.stdout.trim());
    
    console.log(`[CHUNKED] Audio duration: ${totalDuration} seconds`);
    
    // Split audio into smaller chunks for transcription (5 minutes each)
    const chunkDuration = 300; // 5 minutes
    const audioChunks: ChunkInfo[] = [];
    
    for (let i = 0; i * chunkDuration < totalDuration; i++) {
      const start = i * chunkDuration;
      const duration = Math.min(chunkDuration, totalDuration - start);
      const chunkPath = path.join(tempDir, `audio_chunk_${i}.mp3`);
      
      audioChunks.push({
        start,
        duration,
        index: i,
        path: chunkPath
      });
    }
    
    console.log(`[CHUNKED] Splitting audio into ${audioChunks.length} chunks for transcription...`);
    
    // Process each audio chunk
    let fullTranscript = '';
    
    for (const chunk of audioChunks) {
      if (progressCallback) {
        const transcriptProgress = 35 + (chunk.index / audioChunks.length) * 60;
        await progressCallback(
          transcriptProgress, 
          `Transcribing chunk ${chunk.index + 1}/${audioChunks.length}...`
        );
      }
      
      // Extract audio chunk
      const extractChunkCommand = `ffmpeg -i "${audioPath}" -ss ${chunk.start} -t ${chunk.duration} -acodec copy "${chunk.path}" -y`;
      await execAsync(extractChunkCommand);
      
      // Transcribe chunk
      console.log(`[CHUNKED] Transcribing chunk ${chunk.index + 1}/${audioChunks.length}...`);
      
      try {
        const chunkTranscript = await transcribeAudioToText(chunk.path);
        
        // Validate transcript
        if (chunkTranscript && !chunkTranscript.match(/^(you\s*)+$/i)) {
          fullTranscript += (fullTranscript ? ' ' : '') + chunkTranscript;
          console.log(`[CHUNKED] Chunk ${chunk.index + 1} transcribed: ${chunkTranscript.substring(0, 100)}...`);
        } else {
          console.warn(`[CHUNKED] Chunk ${chunk.index + 1} produced invalid transcript`);
        }
        
      } catch (error) {
        console.error(`[CHUNKED] Failed to transcribe chunk ${chunk.index + 1}:`, error);
      }
      
      // Clean up chunk
      if (fs.existsSync(chunk.path)) {
        fs.unlinkSync(chunk.path);
      }
    }
    
    // Clean up files
    if (fs.existsSync(completeVideoPath)) {
      fs.unlinkSync(completeVideoPath);
    }
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    // Validate final transcript
    if (fullTranscript.length < 100) {
      throw new Error('Transcript too short - processing may have failed');
    }
    
    const wordCount = fullTranscript.split(/\s+/).filter(w => w.length > 0).length;
    const wordsPerMinute = Math.round(wordCount / (totalDuration / 60));
    
    console.log(`[CHUNKED] Transcription complete:`);
    console.log(`[CHUNKED] - Total characters: ${fullTranscript.length}`);
    console.log(`[CHUNKED] - Total words: ${wordCount}`);
    console.log(`[CHUNKED] - Words per minute: ${wordsPerMinute}`);
    
    if (progressCallback) {
      await progressCallback(95, 'Transcription complete!');
    }
    
    return {
      success: true,
      transcript: fullTranscript
    };
    
  } catch (error: any) {
    console.error('[CHUNKED] Processing error:', error);
    
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('[CHUNKED] Cleanup error:', cleanupError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Process a specific video ID using chunked approach
 */
export async function processVideoWithChunking(videoId: number): Promise<void> {
  console.log(`[CHUNKED] Starting chunked processing for video ${videoId}`);
  
  try {
    // Update video status
    await db.update(videos)
      .set({ 
        status: 'processing',
        processingProgress: 0
      })
      .where(eq(videos.id, videoId));
    
    // Progress callback
    const updateProgress = async (progress: number, message: string) => {
      console.log(`[CHUNKED] Progress: ${progress}% - ${message}`);
      await db.update(videos)
        .set({ processingProgress: progress })
        .where(eq(videos.id, videoId));
    };
    
    // Process video in chunks
    const result = await processLargeVideoInChunks(videoId, updateProgress);
    
    if (result.success && result.transcript) {
      // Save transcript to feedbacks
      const [video] = await db.select().from(videos).where(eq(videos.id, videoId));
      
      // Delete any existing feedback
      await db.delete(feedbacks).where(eq(feedbacks.videoId, videoId));
      
      // Create new feedback with transcript
      await db.insert(feedbacks).values({
        videoId,
        userId: video.userId,
        transcription: result.transcript,
        overallScore: 0,
        communicationScore: 0,
        engagementScore: 0,
        instructionScore: 0,
        strengths: ['Transcript generated successfully'],
        areasForImprovement: ['Awaiting AI analysis'],
        summary: 'Transcript ready for analysis',
        detailedFeedback: JSON.stringify({ 
          message: 'Transcript generated via chunked processing',
          wordCount: result.transcript.split(/\s+/).length 
        })
      });
      
      // Update video status
      await db.update(videos)
        .set({ 
          status: 'transcribed',
          processingProgress: 100
        })
        .where(eq(videos.id, videoId));
      
      console.log('[CHUNKED] Video transcribed successfully, ready for AI analysis');
      
    } else {
      throw new Error(result.error || 'Transcription failed');
    }
    
  } catch (error: any) {
    console.error('[CHUNKED] Processing failed:', error);
    
    // Update video status to failed
    await db.update(videos)
      .set({ 
        status: 'failed',
        processingProgress: 0
      })
      .where(eq(videos.id, videoId));
    
    throw error;
  }
}