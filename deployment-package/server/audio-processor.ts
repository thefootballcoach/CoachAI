import { storage } from "./storage";
import { transcribeAudio, analyzeCoachingSession } from "./openai";
import { fileExistsInS3, downloadFromS3 } from "./s3-service";
import { performPreciseAnalysis } from "./precise-analysis";
import { generateComprehensiveAnalysis } from "./fallback-analysis";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Split large audio file into chunks and transcribe each chunk
 */
async function transcribeAudioInChunks(audioPath: string, videoId: number): Promise<{ text: string, duration: number }> {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const chunkDuration = 480; // 8 minutes per chunk for better processing
  const baseName = path.basename(audioPath, path.extname(audioPath));
  const chunks: string[] = [];
  let totalDuration = 0;
  let combinedText = '';

  try {
    // Get audio duration first
    const { stdout: durationOutput } = await execAsync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`
    );
    totalDuration = parseFloat(durationOutput.trim());
    
    const numChunks = Math.ceil(totalDuration / chunkDuration);
    console.log(`Splitting audio into ${numChunks} chunks of ${chunkDuration} seconds each`);

    // Split audio into chunks
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDuration;
      const chunkPath = path.join(tempDir, `${baseName}_chunk_${i}.mp3`);
      
      await execAsync(
        `ffmpeg -y -i "${audioPath}" -ss ${startTime} -t ${chunkDuration} -c:a libmp3lame -b:a 128k "${chunkPath}"`
      );
      
      if (fs.existsSync(chunkPath)) {
        chunks.push(chunkPath);
        console.log(`Created chunk ${i + 1}/${numChunks}: ${(fs.statSync(chunkPath).size / (1024 * 1024)).toFixed(2)} MB`);
      }
    }

    // Transcribe each chunk with better progress tracking
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = chunks[i];
      console.log(`Transcribing chunk ${i + 1}/${chunks.length}...`);
      
      try {
        const chunkTranscription = await transcribeAudio(chunkPath);
        combinedText += chunkTranscription.text + ' ';
        
        // Update progress more granularly (20% to 60% for transcription)
        const progressPercent = Math.round(20 + (i + 1) / chunks.length * 40);
        await storage.updateVideoStatus(videoId, "processing", progressPercent);
        
        console.log(`Chunk ${i + 1}/${chunks.length} completed (${progressPercent}%)`);
      } catch (error: any) {
        console.error(`Error transcribing chunk ${i + 1}:`, error);
        
        // If quota exceeded, throw specific error for fallback handling
        if (error.message.includes('quota exceeded') || error.message.includes('API key') || error.message.includes('Circuit breaker open')) {
          throw new Error(`QUOTA_EXCEEDED: ${error.message}`);
        }
        
        throw new Error(`Failed to transcribe chunk ${i + 1}: ${error.message}`);
      }
    }

    return {
      text: combinedText.trim(),
      duration: totalDuration
    };
  } finally {
    // Clean up chunk files
    for (const chunkPath of chunks) {
      try {
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      } catch (error) {
        console.error(`Error cleaning up chunk ${chunkPath}:`, error);
      }
    }
  }
}

/**
 * Process an audio file by:
 * 1. Transcribing the audio content
 * 2. Analyzing the transcript to provide coaching feedback
 */
export async function processAudio(videoId: number): Promise<void> {
  try {
    // Get the audio record from the database
    const video = await storage.getVideo(videoId);
    if (!video) {
      throw new Error(`Audio with ID ${videoId} not found`);
    }
    
    console.log(`Starting to process audio ${videoId}: ${video.title}`);
    
    // Check if audio is already being processed or completed
    const progress = video.processingProgress ?? 0;
    if (video.status === "completed") {
      console.log(`Audio ${videoId} already completed. Skipping processing.`);
      return;
    }
    
    if (video.status === "processing" && progress > 0) {
      console.log(`Audio ${videoId} is already being processed (progress: ${progress}%). Resuming...`);
    } else {
      // Update the audio status to processing
      await storage.updateVideoStatus(videoId, "processing", 10);
    }
    
    // Get the full path to the audio file
    const audioPath = await getAudioFilePath(video.filename);
    if (!audioPath) {
      console.error(`Audio file not found: ${video.filename}. Updating status to "file_missing".`);
      
      // Update audio status to indicate file is missing rather than just "failed"
      await storage.updateVideoStatus(videoId, "file_missing", 0);
      
      // Create a specialized error to handle this case differently in the UI
      throw new Error(`Audio file not found: ${video.filename}`);
    }
    
    console.log(`Audio file located at: ${audioPath}`);
    console.log(`Audio file size: ${(fs.statSync(audioPath).size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Check file size and choose transcription method
    const fileSize = fs.statSync(audioPath).size;
    const maxSize = 25 * 1024 * 1024; // 25MB OpenAI limit
    
    console.log("Starting transcription process...");
    let transcription;
    
    try {
      if (fileSize > maxSize) {
        console.log(`File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds OpenAI limit. Using chunking strategy...`);
        await storage.updateVideoStatus(videoId, "processing", 15);
        transcription = await transcribeAudioInChunks(audioPath, videoId);
        console.log(`Chunked transcription completed. Text length: ${transcription.text.length} characters`);
      } else {
        console.log(`File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) is within limit. Using direct transcription...`);
        await storage.updateVideoStatus(videoId, "processing", 25);
        
        try {
          transcription = await transcribeAudio(audioPath);
          await storage.updateVideoStatus(videoId, "processing", 60);
          console.log(`Direct transcription completed. Duration: ${transcription.duration} seconds, Text length: ${transcription.text.length} characters`);
        } catch (error: any) {
          console.error("Error during direct transcription:", error);
          // Fallback to chunking if direct transcription fails
          console.log("Falling back to chunking method...");
          await storage.updateVideoStatus(videoId, "processing", 15);
          transcription = await transcribeAudioInChunks(audioPath, videoId);
        }
      }
    } catch (transcriptionError: any) {
      // Fail processing if transcription fails to ensure authentic analysis only
      console.error("Transcription failed - cannot provide authentic analysis without real transcript");
      await storage.updateVideoStatus(videoId, "failed", 0);
      throw new Error(`Transcription required for authentic analysis: ${transcriptionError.message}. Please ensure OpenAI API key has sufficient quota.`);
    }
    
    if (!transcription || !transcription.text) {
      throw new Error("Failed to obtain transcription");
    }
    
    // Update the processing status to 65% after transcription
    await storage.updateVideoStatus(videoId, "processing", 65);
    
    // Analyze the transcript with self-reflection data
    console.log("Analyzing transcript with self-reflection data...");
    const reflectionData = {
      coachName: video.coachName || undefined,
      ageGroup: video.ageGroup || undefined,
      intendedOutcomes: video.intendedOutcomes || undefined,
      sessionStrengths: video.sessionStrengths || undefined,
      areasForDevelopment: video.areasForDevelopment || undefined,
      reflectionNotes: video.reflectionNotes || undefined
    };
    // Force authentic OpenAI analysis only for bespoke feedback
    console.log("Starting authentic OpenAI analysis for bespoke, transcript-specific feedback...");
    let analysis;
    try {
      analysis = await analyzeCoachingSession(transcription.text, undefined, reflectionData);
      console.log("Authentic OpenAI analysis completed successfully");
    } catch (error: any) {
      console.error("OpenAI analysis failed - authentic analysis required for bespoke feedback");
      await storage.updateVideoStatus(videoId, "failed", 0);
      throw new Error(`Authentic OpenAI analysis required for bespoke feedback: ${error.message}. Please ensure OpenAI API key has sufficient quota.`);
    }
    
    console.log("Creating feedback record...");
    
    // Create a feedback record with comprehensive analysis
    await storage.createFeedback({
      userId: video.userId,
      videoId: video.id,
      transcription: transcription.text,
      summary: analysis.summary,
      feedback: analysis.detailedFeedback,
      strengths: analysis.strengths,
      improvements: analysis.areasForImprovement,
      overallScore: analysis.overallScore,
      communicationScore: analysis.communicationScore,
      engagementScore: analysis.engagementScore,
      instructionScore: analysis.instructionScore,
      
      // New comprehensive analysis fields
      keyInfo: analysis.keyInfo,
      questioning: analysis.questioning,
      language: analysis.language,
      coachBehaviours: analysis.coachBehaviours,
      playerEngagement: analysis.playerEngagement,
      intendedOutcomes: analysis.intendedOutcomes,
      neuroscience: analysis.neuroscience
    });
    
    // Update the video with duration and status
    await storage.updateVideo(videoId, {
      status: "completed",
      processingProgress: 100,
      duration: transcription.duration
    });
    
    console.log(`Audio ${videoId} processing completed successfully`);
    
    // Update user progress stats
    await updateUserProgress(video.userId);
    
  } catch (error: any) {
    console.error(`Error processing audio ${videoId}:`, error);
    
    // Handle specific API errors with better user feedback
    let status = "failed";
    
    if (error.message.includes('OpenAI API quota exceeded')) {
      status = "quota_exceeded";
    } else if (error.message.includes('Invalid OpenAI API key')) {
      status = "api_key_invalid";
    } else if (error.message.includes('Audio file not found')) {
      status = "file_missing";
    }
    
    // Check if the video status was already set to file_missing
    const video = await storage.getVideo(videoId);
    if (video && video.status !== "file_missing") {
      // Update with specific error status
      await storage.updateVideoStatus(videoId, status, 0);
    }
    
    throw error;
  }
}

/**
 * Get the full path to an audio file, downloading from S3 if necessary
 */
async function getAudioFilePath(filename: string): Promise<string | null> {
  const audiosDir = path.join(process.cwd(), "uploads", "audios");
  const filePath = path.join(audiosDir, filename);
  
  // Check if the file exists locally
  if (fs.existsSync(filePath)) {
    console.log(`Audio file found locally: ${filePath}`);
    return filePath;
  }
  
  // Extract user ID from filename for proper S3 path construction
  const parts = filename.split('_');
  let userId = null;
  if (parts.length >= 4) {
    userId = parts[0];
  }
  
  // Try multiple S3 key formats, prioritizing the new video format
  const s3KeyFormats: string[] = [
    userId ? `videos/user-${userId}/${filename}` : null,  // Current upload format
    `audios/${filename}`,                                 // Legacy audio format
    userId ? `audios/${userId}/${parts.slice(1).join('_')}` : null, // Old subdirectory format
    userId ? `audios/${userId}_${parts.slice(1).join('_')}` : null  // Alternative format
  ].filter((key): key is string => Boolean(key));
  
  for (const s3Key of s3KeyFormats) {
    
    try {
      console.log(`Looking for file in S3 with key: ${s3Key}`);
      const fileExists = await fileExistsInS3(s3Key);
      
      if (fileExists) {
        console.log(`File found in S3 with key: ${s3Key}`);
        const result = await downloadFromS3(s3Key, filePath);
        if (result) return result;
      }
    } catch (error) {
      console.error(`Error checking S3 key ${s3Key}:`, error);
    }
  }
  
  console.error(`Audio file not found in any S3 location for: ${filename}`);
  return null;
}

/**
 * Update user progress stats when a new video is processed
 */
async function updateUserProgress(userId: number) {
  try {
    console.log(`Updating progress statistics for user ${userId}`);
    
    // Get all feedbacks for the user
    const feedbacks = await storage.getFeedbacksByUserId(userId);
    
    if (feedbacks.length === 0) {
      console.log(`No feedbacks found for user ${userId}`);
      return;
    }
    
    // Calculate average scores
    const scores = feedbacks.reduce(
      (acc, feedback) => {
        acc.overallScore += feedback.overallScore || 0;
        acc.communicationScore += feedback.communicationScore || 0;
        acc.engagementScore += feedback.engagementScore || 0;
        acc.instructionScore += feedback.instructionScore || 0;
        return acc;
      },
      { 
        overallScore: 0, 
        communicationScore: 0, 
        engagementScore: 0, 
        instructionScore: 0 
      }
    );
    
    const count = feedbacks.length;
    const overallScoreAvg = Math.min(95, Math.max(20, Math.round(scores.overallScore / count)));
    const communicationScoreAvg = Math.min(9, Math.max(3, Math.round(scores.communicationScore / count)));
    const engagementScoreAvg = Math.min(9, Math.max(3, Math.round(scores.engagementScore / count)));
    const instructionScoreAvg = Math.min(9, Math.max(3, Math.round(scores.instructionScore / count)));
    
    // Calculate weekly improvement
    // For simplicity, we'll just use a placeholder calculation for now
    const weeklyImprovement = 0;
    
    // Update or create progress record
    const existingProgress = await storage.getProgressByUserId(userId);
    
    if (existingProgress) {
      await storage.updateProgress(existingProgress.id, {
        overallScoreAvg,
        communicationScoreAvg,
        engagementScoreAvg,
        instructionScoreAvg,
        sessionsCount: count,
        weeklyImprovement
      });
      console.log(`Updated progress record for user ${userId}`);
    } else {
      await storage.createProgress({
        userId,
        overallScoreAvg,
        communicationScoreAvg,
        engagementScoreAvg,
        instructionScoreAvg,
        sessionsCount: count,
        weeklyImprovement
      });
      console.log(`Created new progress record for user ${userId}`);
    }
    
  } catch (error: any) {
    console.error(`Error updating user progress for user ${userId}:`, error);
    // Don't throw the error as this is a non-critical operation
  }
}