/**
 * Enhanced transcription system for large video/audio files
 * Fixes the "you you you" transcription bug by properly handling video files
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import { apiHealthMonitor } from './api-health-monitor';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_CHUNK_SIZE_MB = 24; // Just under Whisper API limit of 25MB
const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk for efficiency
// Use absolute path that works from any working directory
const TEMP_DIR = path.resolve(__dirname, '..', 'uploads', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract audio from video file
 */
async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const audioPath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);
  
  console.log(`[ENHANCED] Extracting audio from video: ${videoPath}`);
  
  try {
    // Extract audio with optimized settings for speech and faster processing for large files
    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 -threads 4 -preset ultrafast -y "${audioPath}"`;
    
    console.log(`[ENHANCED] Running command: ${command}`);
    const { stderr } = await execAsync(command, { timeout: 600000 }); // 10 minute timeout
    console.log(`[ENHANCED] Audio extraction complete: ${audioPath}`);
    
    // Verify the audio file was created and has content
    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio extraction failed - no output file');
    }
    
    const audioSize = fs.statSync(audioPath).size;
    if (audioSize < 1000) {
      throw new Error('Audio extraction failed - file too small');
    }
    
    console.log(`[ENHANCED] Audio file size: ${(audioSize / (1024 * 1024)).toFixed(2)} MB`);
    return audioPath;
    
  } catch (error: any) {
    console.error('[ENHANCED] Audio extraction error:', error);
    throw new Error(`Failed to extract audio: ${error.message}`);
  }
}

/**
 * Get audio/video duration
 */
async function getMediaDuration(filePath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('[ENHANCED] Failed to get duration:', error);
    return 0;
  }
}

/**
 * Split audio into chunks
 */
async function splitAudioIntoChunks(audioPath: string): Promise<Array<{path: string, start: number, duration: number}>> {
  const chunks: Array<{path: string, start: number, duration: number}> = [];
  
  try {
    const totalDuration = await getMediaDuration(audioPath);
    const audioSize = fs.statSync(audioPath).size / (1024 * 1024); // MB
    
    console.log(`[ENHANCED] Total duration: ${totalDuration}s, Size: ${audioSize.toFixed(2)}MB`);
    
    // Calculate optimal chunk duration based on file size
    let chunkDuration = CHUNK_DURATION_SECONDS;
    if (audioSize > 100) {
      // For very large files, use smaller chunks for faster processing
      const targetChunkSize = 20; // MB (conservative size for faster processing)
      const estimatedChunkDuration = Math.floor((targetChunkSize / audioSize) * totalDuration);
      chunkDuration = Math.max(120, Math.min(300, estimatedChunkDuration)); // 2-5 minute chunks for large files
      console.log(`[ENHANCED] Large file detected, using ${chunkDuration}s chunks`);
    }
    
    const numChunks = Math.ceil(totalDuration / chunkDuration);
    console.log(`[ENHANCED] Creating ${numChunks} chunks of ~${chunkDuration}s each`);
    
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDuration;
      const actualDuration = Math.min(chunkDuration, totalDuration - startTime);
      const chunkPath = path.join(TEMP_DIR, `chunk_${Date.now()}_${i}.mp3`);
      
      // Extract chunk with proper audio settings for Whisper and faster processing
      const command = `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${actualDuration} -acodec libmp3lame -ab 64k -ar 16000 -ac 1 -threads 2 -preset ultrafast -y "${chunkPath}"`;
      
      console.log(`[ENHANCED] Creating chunk ${i + 1}/${numChunks}: ${startTime}s-${startTime + actualDuration}s`);
      await execAsync(command, { timeout: 120000 }); // 2 minute timeout per chunk
      
      // Verify chunk was created
      if (fs.existsSync(chunkPath) && fs.statSync(chunkPath).size > 1000) {
        chunks.push({
          path: chunkPath,
          start: startTime,
          duration: actualDuration
        });
        
        const chunkSize = fs.statSync(chunkPath).size / (1024 * 1024);
        console.log(`[ENHANCED] Chunk ${i + 1}: ${chunkSize.toFixed(2)}MB, ${actualDuration}s`);
      }
    }
    
    return chunks;
    
  } catch (error: any) {
    console.error('[ENHANCED] Chunking error:', error);
    throw new Error(`Failed to split audio: ${error.message}`);
  }
}

/**
 * Transcribe a single chunk with retry
 */
async function transcribeChunk(chunkPath: string, chunkIndex: number): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ENHANCED] Transcribing chunk ${chunkIndex}, attempt ${attempt}`);
      
      // Ensure we have the absolute path
      const absolutePath = path.isAbsolute(chunkPath) ? chunkPath : path.resolve(TEMP_DIR, chunkPath);
      
      // Verify file exists
      if (!fs.existsSync(absolutePath)) {
        // Try looking in the temp directory if not found
        const tempPath = path.join(TEMP_DIR, path.basename(chunkPath));
        if (fs.existsSync(tempPath)) {
          console.log(`[ENHANCED] Found chunk in temp directory: ${tempPath}`);
          return await transcribeChunk(tempPath, chunkIndex);
        }
        throw new Error(`Chunk file not found: ${absolutePath}`);
      }
      
      // Read file to buffer and create File object for OpenAI
      const fileBuffer = fs.readFileSync(absolutePath);
      const blob = new Blob([fileBuffer], { type: 'audio/mp3' });
      const file = new File([blob], path.basename(absolutePath), { type: 'audio/mp3' });
      
      const response = await openai.audio.transcriptions.create({
        file: file as any,
        model: "whisper-1",
        response_format: "text",
        temperature: 0.2,
        language: "en"
      }, {
        timeout: 120000, // 2 minutes
        maxRetries: 0
      });
      
      const text = response || "";
      console.log(`[ENHANCED] Chunk ${chunkIndex} transcribed: ${text.substring(0, 100)}...`);
      
      // Validate transcription
      if (text.length < 10 || text.match(/^(you\s*)+$/i)) {
        throw new Error('Invalid transcription - repeated text detected');
      }
      
      return text;
      
    } catch (error: any) {
      lastError = error;
      console.error(`[ENHANCED] Chunk ${chunkIndex} attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('Transcription failed');
}

/**
 * Enhanced transcription function that properly handles large video files
 */
export async function enhancedTranscribeVideo(videoPath: string, videoId: number, updateProgress?: (progress: number) => Promise<void>): Promise<{ text: string, duration: number }> {
  let audioPath: string | null = null;
  const chunks: Array<{path: string, start: number, duration: number}> = [];
  
  try {
    // Check if it's a video file
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mkv'];
    const isVideo = videoExtensions.some(ext => videoPath.toLowerCase().endsWith(ext));
    
    if (isVideo) {
      // Extract audio from video
      audioPath = await extractAudioFromVideo(videoPath);
    } else {
      audioPath = videoPath;
    }
    
    // Split into chunks
    const audioChunks = await splitAudioIntoChunks(audioPath);
    chunks.push(...audioChunks);
    
    // Transcribe each chunk
    let fullTranscript = '';
    let totalDuration = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      if (updateProgress) {
        const progress = 30 + Math.floor((i / chunks.length) * 60);
        await updateProgress(progress);
      }
      
      const chunkText = await transcribeChunk(chunks[i].path, i + 1);
      
      // Add space between chunks
      if (fullTranscript && chunkText) {
        fullTranscript += ' ';
      }
      fullTranscript += chunkText;
      totalDuration += chunks[i].duration;
      
      // Log progress
      console.log(`[ENHANCED] Progress: ${i + 1}/${chunks.length} chunks, ${fullTranscript.length} total characters`);
    }
    
    // Validate final transcript
    if (fullTranscript.length < 100) {
      throw new Error('Transcription too short - possible processing error');
    }
    
    console.log(`[ENHANCED] Transcription complete: ${fullTranscript.length} characters, ${totalDuration}s`);
    
    return {
      text: fullTranscript,
      duration: totalDuration
    };
    
  } catch (error: any) {
    console.error('[ENHANCED] Transcription failed:', error);
    throw error;
    
  } finally {
    // Cleanup
    try {
      // Delete chunks
      for (const chunk of chunks) {
        if (fs.existsSync(chunk.path)) {
          fs.unlinkSync(chunk.path);
        }
      }
      
      // Delete extracted audio if it was created
      if (audioPath && audioPath !== videoPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (cleanupError) {
      console.warn('[ENHANCED] Cleanup error:', cleanupError);
    }
  }
}

/**
 * Test if a file is likely to have speech content
 */
export async function testAudioContent(audioPath: string): Promise<boolean> {
  try {
    // Extract a 10-second sample from the middle of the file
    const duration = await getMediaDuration(audioPath);
    const sampleStart = Math.max(0, duration / 2 - 5);
    const samplePath = path.join(TEMP_DIR, `sample_${Date.now()}.mp3`);
    
    const command = `ffmpeg -i "${audioPath}" -ss ${sampleStart} -t 10 -acodec libmp3lame -ab 64k -ar 16000 -ac 1 -y "${samplePath}"`;
    await execAsync(command);
    
    // Quick transcription test
    const text = await transcribeChunk(samplePath, 0);
    
    // Cleanup
    if (fs.existsSync(samplePath)) {
      fs.unlinkSync(samplePath);
    }
    
    return text.length > 20 && !text.match(/^(you\s*)+$/i);
    
  } catch (error) {
    console.error('[ENHANCED] Audio content test failed:', error);
    return false;
  }
}