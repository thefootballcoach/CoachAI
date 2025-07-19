import { storage } from "./storage";
import { transcribeAudio, analyzeCoachingSession } from "./openai";
import { fileExistsInS3, downloadFromS3 } from "./s3-service";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

/**
 * Create feedback when the original file cannot be accessed
 */
async function createFileMissingFeedback(video: any): Promise<void> {
  try {
    console.log(`Creating file-missing feedback for video: ${video.title}`);
    
    await storage.updateVideoStatus(video.id, "processing", 50);
    
    const feedback = await storage.createFeedback({
      videoId: video.id,
      userId: video.userId,
      overallScore: null,
      feedback: `**File Access Issue**

The original video file for "${video.title}" could not be accessed for AI analysis. This may be due to:

• File storage connectivity issues
• File corruption during upload
• Temporary system maintenance

**What this means:**
• No AI analysis could be performed on the actual content
• No specific coaching insights are available for this session

**Recommended actions:**
• Re-upload this coaching session for detailed AI analysis
• Ensure stable internet connection during upload
• Contact support if the issue persists

**For your next sessions:**
• Verify successful upload completion before ending
• Keep local backup of important sessions
• Upload during off-peak hours for better reliability

To get the full AI coaching analysis you're looking for, please re-upload this session.`,
      communicationScore: null,
      engagementScore: null,
      instructionScore: null
    });
    
    console.log(`Created file-missing feedback with ID: ${feedback.id}`);
    await storage.updateVideoStatus(video.id, "file_missing", 100);
    console.log(`Marked video ${video.id} as file_missing`);
    
  } catch (error) {
    console.error(`Error creating file-missing feedback for video ${video.id}:`, error);
    await storage.updateVideoStatus(video.id, "failed", 0);
  }
}

/**
 * Process a media file (audio or video) by:
 * 1. Extracting audio from video files if needed
 * 2. Transcribing the audio content
 * 3. Analyzing the transcript to provide coaching feedback
 */
export async function processAudio(videoId: number): Promise<void> {
  try {
    // Get the audio record from the database
    const video = await storage.getVideo(videoId);
    if (!video) {
      throw new Error(`Audio with ID ${videoId} not found`);
    }
    
    console.log(`Starting to process audio ${videoId}: ${video.title}`);
    
    // Check if audio is already being processed
    const progress = video.processingProgress ?? 0;
    if (video.status === "processing" && progress > 0) {
      console.log(`Audio ${videoId} is already being processed (progress: ${progress}%). Resuming...`);
    } else {
      // Update the audio status to processing
      await storage.updateVideoStatus(videoId, "processing", 10);
    }
    
    // Get the full path to the media file and extract audio if needed
    const audioPath = await getAudioFilePath(video.filename);
    if (!audioPath) {
      console.error(`Media file not found: ${video.filename}. Creating file-missing feedback.`);
      
      // Create helpful feedback indicating the file issue
      await createFileMissingFeedback(video);
      return;
    }
    
    console.log(`Audio file located at: ${audioPath}`);
    console.log(`Audio file size: ${(fs.statSync(audioPath).size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Transcribe the audio file
    console.log("Transcribing audio...");
    let transcription;
    try {
      transcription = await transcribeAudio(audioPath);
      console.log(`Transcription completed. Duration: ${transcription.duration} seconds, Text length: ${transcription.text.length}`);
    } catch (error) {
      const transcriptionError = error as Error;
      console.error("Error during transcription:", transcriptionError);
      
      // For large audio files, try with reduced quality
      if (fs.statSync(audioPath).size > 100 * 1024 * 1024) { // 100MB
        console.log("File is large. Attempting to transcribe with reduced quality...");
        const tempDir = path.join(process.cwd(), 'uploads', 'temp');
        const reducedAudioPath = path.join(tempDir, `reduced-${Date.now()}-${path.basename(audioPath)}`);
        
        try {
          // Create a reduced quality version of the audio
          await new Promise<void>((resolve, reject) => {
            const command = `ffmpeg -y -i "${audioPath}" -ar 16000 -ac 1 -c:a aac -b:a 64k "${reducedAudioPath}"`;
            console.log(`Running: ${command}`);
            exec(command, (error: any) => {
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
          });
          
          if (fs.existsSync(reducedAudioPath)) {
            console.log(`Created reduced quality audio: ${(fs.statSync(reducedAudioPath).size / (1024 * 1024)).toFixed(2)} MB`);
            transcription = await transcribeAudio(reducedAudioPath);
            
            // Clean up reduced audio file
            try { fs.unlinkSync(reducedAudioPath); } catch (e) { console.error("Error cleaning up reduced audio:", e); }
          }
        } catch (reducedError) {
          console.error("Error creating or processing reduced quality audio:", reducedError);
          throw new Error(`Failed to transcribe even with reduced quality: ${transcriptionError.message || 'Unknown error'}`);
        }
      } else {
        throw transcriptionError;
      }
    }
    
    if (!transcription || !transcription.text) {
      throw new Error("Failed to obtain transcription");
    }
    
    // Update the processing status
    await storage.updateVideoStatus(videoId, "processing", 50);
    
    // Analyze the transcript with visual analysis if it's a video file
    const isVideoFile = ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
      video.filename.toLowerCase().endsWith(ext)
    );
    
    if (isVideoFile) {
      console.log("Starting multimodal analysis (audio + visual)...");
      await storage.updateVideoStatus(videoId, "processing", 60);
    } else {
      console.log("Starting audio analysis...");
    }
    
    const videoPathForAnalysis = isVideoFile ? audioPath : undefined;
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
    
    const analysis = await analyzeCoachingSession(transcription.text, videoPathForAnalysis, reflectionData);
    
    if (isVideoFile) {
      console.log("Multimodal analysis completed");
      await storage.updateVideoStatus(videoId, "processing", 85);
    } else {
      console.log("Audio analysis completed");
      await storage.updateVideoStatus(videoId, "processing", 85);
    }
    
    console.log("Creating feedback record...");
    
    // Calculate accurate words per minute based on actual duration
    const totalWords = transcription.text.split(' ').length;
    const durationInMinutes = transcription.duration / 60;
    const accurateWordsPerMinute = Math.round(totalWords / durationInMinutes);
    
    // Update keyInfo with correct calculation
    if (analysis.keyInfo) {
      analysis.keyInfo.totalWords = totalWords;
      analysis.keyInfo.wordsPerMinute = accurateWordsPerMinute;
    } else {
      analysis.keyInfo = {
        totalWords: totalWords,
        wordsPerMinute: accurateWordsPerMinute,
        playersmentioned: []
      };
    }

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
      
      // New comprehensive analysis fields with corrected calculations
      keyInfo: analysis.keyInfo,
      questioning: analysis.questioning || null,
      language: analysis.language || null,
      coachBehaviours: analysis.coachBehaviours || null,
      playerEngagement: analysis.playerEngagement || null,
      intendedOutcomes: analysis.intendedOutcomes || null
    });
    
    // Update the video with duration and status
    await storage.updateVideo(videoId, {
      status: "completed",
      processingProgress: 100,
      duration: transcription.duration
    });
    
    console.log(`Video ${videoId} processing completed successfully`);
    
    // Update user progress stats
    await updateUserProgress(video.userId);
    
  } catch (error: any) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Check if the video status was already set to file_missing
    const video = await storage.getVideo(videoId);
    if (video && video.status !== "file_missing") {
      // Only update to failed if it wasn't already set to file_missing
      await storage.updateVideoStatus(videoId, "failed", 0);
    }
    
    throw error;
  }
}

/**
 * Extract audio from video file using FFmpeg
 */
async function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ab 128k -ar 44100 -y "${outputPath}"`;
    
    console.log(`Extracting audio from video: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`FFmpeg error: ${error}`);
        reject(new Error(`Failed to extract audio from video: ${error.message}`));
        return;
      }
      
      if (stderr) {
        console.log(`FFmpeg stderr: ${stderr}`);
      }
      
      console.log(`Audio extraction successful: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

/**
 * Check if file is a video format that needs audio extraction
 */
function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.3gp', '.flv', '.mpeg'];
  const ext = path.extname(filename).toLowerCase();
  return videoExtensions.includes(ext);
}

/**
 * Get the full path to a media file, downloading from S3 if necessary and extracting audio from video if needed
 */
async function getAudioFilePath(filename: string): Promise<string | null> {
  const audiosDir = path.join(process.cwd(), "uploads", "audios");
  const filePath = path.join(audiosDir, filename);
  
  // Check if the file exists locally
  if (fs.existsSync(filePath)) {
    console.log(`Media file found locally: ${filePath}`);
    
    // If it's a video file, extract audio
    if (isVideoFile(filename)) {
      const audioFilename = filename.replace(path.extname(filename), '.mp3');
      const audioPath = path.join(audiosDir, audioFilename);
      
      // Check if audio already extracted
      if (fs.existsSync(audioPath)) {
        console.log(`Audio already extracted: ${audioPath}`);
        return audioPath;
      }
      
      // Extract audio from video
      console.log(`Extracting audio from video file: ${filePath}`);
      await extractAudioFromVideo(filePath, audioPath);
      return audioPath;
    }
    
    return filePath;
  }
  
  // Try multiple S3 key formats to find the file
  const parts = filename.split('_');
  const userId = parts.length >= 4 ? parts[0] : null;
  
  // List all possible S3 key formats in order of priority
  const s3KeyFormats: string[] = [
    userId ? `videos/user-${userId}/${filename}` : null,  // Current upload format
    `audios/${filename}`,                                 // Legacy direct format
    userId ? `audios/${userId}/${parts.slice(1).join('_')}` : null, // Old subdirectory format
    userId ? `audios/${userId}_${parts.slice(1).join('_')}` : null  // Alternative format
  ].filter((key): key is string => Boolean(key));
  
  for (const s3Key of s3KeyFormats) {
    try {
      console.log(`Looking for file in S3 with key: ${s3Key}`);
      const fileExists = await fileExistsInS3(s3Key);
      
      if (fileExists) {
        console.log(`File found in S3 with key: ${s3Key}`);
        const downloadedPath = await downloadFromS3(s3Key, filePath);
        
        if (downloadedPath && isVideoFile(filename)) {
          // If it's a video file, extract audio
          const audioFilename = filename.replace(path.extname(filename), '.mp3');
          const audioPath = path.join(audiosDir, audioFilename);
          
          console.log(`Extracting audio from downloaded video file: ${downloadedPath}`);
          await extractAudioFromVideo(downloadedPath, audioPath);
          return audioPath;
        }
        
        return downloadedPath;
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