import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Use the newest OpenAI model "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-development",
});

// Track temporary files for cleanup
const tempFiles: string[] = [];

function cleanupTempFiles() {
  tempFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Cleaned up temp file: ${file}`);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${file}:`, error);
    }
  });
  tempFiles.length = 0;
}

// Cleanup on process exit
process.on('exit', cleanupTempFiles);
process.on('SIGINT', () => {
  cleanupTempFiles();
  process.exit(0);
});

/**
 * Retry a function with exponential backoff
 * Enhanced with more resilient error handling and longer delays
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  jitter: boolean = true
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // More detailed error logging with proper type checking
      const errorDetails = error && typeof error === 'object' 
        ? ((error as any).cause?.code || (error as any).code || "unknown")
        : "unknown";
      console.error(`Attempt ${attempt}/${maxRetries} failed with error code ${errorDetails}:`, error);
      
      if (attempt < maxRetries) {
        // Calculate base delay with exponential backoff
        let delay = initialDelay * Math.pow(2, attempt - 1);
        
        // Add random jitter to prevent synchronized retries (±20%)
        if (jitter) {
          const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
          delay = Math.floor(delay * jitterFactor);
        }
        
        // Cap the maximum delay at 30 seconds
        delay = Math.min(delay, 30000);
        
        console.log(`Retrying in ${delay}ms... (attempt ${attempt} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Transcribe audio with improved error handling and cleanup
 */
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
  tempFiles.push(audioPath); // Track for cleanup
  
  try {
    // Create temp directory if needed
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    console.log(`Temp directory for audio extraction: ${tempDir}`);
    
    // Ensure audio file exists and is readable
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file does not exist: ${audioFilePath}`);
    }
    
    const sourceAudioStats = fs.statSync(audioFilePath);
    console.log(`Audio file size: ${(sourceAudioStats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Copy audio to temporary location with improved error handling
    console.log(`Copying audio from ${audioFilePath} to ${audioPath}`);
    
    try {
      // Copy audio file to temp directory, optimizing for transcription if needed
      await execAsync(`ffmpeg -y -i "${audioFilePath}" -ar 44100 -ac 1 "${audioPath}" -hide_banner -loglevel warning`);
    } catch (error: any) {
      console.error("Error during audio processing:", error);
      
      // If ffmpeg fails, try direct copy
      console.log("FFmpeg failed, attempting direct copy...");
      fs.copyFileSync(audioFilePath, audioPath);
    }
    
    // Verify that the copied audio file exists and has content
    if (!fs.existsSync(audioPath)) {
      throw new Error("Failed to create temporary audio file");
    }
    
    const audioStats = fs.statSync(audioPath);
    if (audioStats.size === 0) {
      throw new Error("Temporary audio file is empty");
    }
    
    console.log(`Audio file prepared for transcription: ${audioPath} (${(audioStats.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Get duration using ffprobe
    let duration = 0;
    try {
      const durationOutput = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`);
      duration = parseFloat(durationOutput.stdout.trim()) || 0;
      console.log(`Audio duration: ${duration} seconds`);
    } catch (durationError) {
      console.warn("Could not determine audio duration, defaulting to 0:", durationError);
    }
    
    return await withRetry(async () => {
      console.log("Starting OpenAI Whisper transcription...");
      
      // Read the audio file to ensure it's accessible
      const audioBuffer = fs.readFileSync(audioPath);
      const tempAudioPath = path.join(tempDir, `audio-temp-${Date.now()}.mp3`);
      fs.writeFileSync(tempAudioPath, audioBuffer);
      tempFiles.push(tempAudioPath); // Track for cleanup
      
      const transcriptionFile = fs.createReadStream(tempAudioPath);
      
      // Updated to use readStream from the copied file
      // Note: OpenAI API doesn't support custom timeout parameter, 
      // but the Node.js client will handle timeouts internally
      const transcription = await openai.audio.transcriptions.create({
        file: transcriptionFile,
        model: "whisper-1",
      });
      
      console.log(`Transcription complete. Text length: ${transcription.text.length} characters`);
      
      return {
        text: transcription.text,
        duration: duration,
      };
    }, 5, 3000, true); // Use our enhanced retry with 5 retries, 3s initial delay and jitter
  } catch (error: any) {
    console.error("Error in transcribeAudio:", error);
    const errorMessage = error?.message || 'Unknown error during audio transcription';
    throw new Error(`Failed to transcribe audio: ${errorMessage}`);
  }
}

/**
 * Analyze coaching session and provide feedback with improved error handling
 * Includes enhanced coaching behavior analysis
 */
export async function analyzeCoachingSession(transcript: string): Promise<{
  summary: string;
  detailedFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  overallScore: number;
  communicationScore: number;
  engagementScore: number;
  instructionScore: number;
  
  // New comprehensive analysis structure
  keyInfo: {
    totalWords: number;
    wordsPerMinute: number;
    talkingToSilenceRatio: string;
    playersmentioned: { name: string; count: number }[];
  };
  questioning: {
    totalQuestions: number;
    questionTypes: { type: string; count: number; impact: string }[];
    researchInsights: string;
    developmentAreas: string[];
  };
  language: {
    clarity: number;
    specificity: number;
    ageAppropriate: number;
    researchAlignment: string;
    feedback: string;
  };
  coachBehaviours: {
    interpersonalSkills: {
      communicationStyle: string;
      relationshipBuilding: number;
      feedback: string;
    };
    professionalSkills: {
      philosophy: string;
      progression: number;
      collaboration: number;
      feedback: string;
    };
    technicalSkills: {
      planning: number;
      reviewing: number;
      tacticalKnowledge: number;
      clarity: number;
      feedback: string;
    };
    communicationType: string;
    academicReferences: string[];
  };
  playerEngagement: {
    playerInteractions: { name: string; count: number }[];
    coachingStyles: { style: string; percentage: number }[];
    coachingTypes: { type: string; impact: number }[];
    contentAnalysis: {
      technical: number;
      tactical: number;
      physical: number;
      psychological: number;
    };
    toneAnalysis: {
      dominant: string;
      variations: string[];
      effectiveness: number;
    };
    personalization: number;
    nameUsage: number;
  };
  intendedOutcomes: {
    outcomesIdentified: string[];
    outcomeAlignment: number;
    effectiveness: number;
    researchSupport: string;
  };
  coachingFramework: {
    why: string; // Why are we coaching 'Interventions'
    what: string; // What are we coaching Topics/Objectives
    how: string; // How are we coaching 'Style of Coaching'
    who: string; // Who are we coaching
  };
}> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Cannot analyze empty transcript");
  }
  
  // Truncate very long transcripts to avoid token limits
  const maxLength = 16000;
  let processedTranscript = transcript;
  if (transcript.length > maxLength) {
    processedTranscript = transcript.substring(0, maxLength) + 
      "\n\n[Note: Transcript truncated due to length constraints. The above represents the first part of the coaching session.]";
    console.log(`Transcript truncated from ${transcript.length} to ${processedTranscript.length} characters`);
  }
  
  try {
    // Check if we have a valid API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No OpenAI API key provided");
    }
    
    return await withRetry(async () => {
      console.log(`Analyzing coaching session with OpenAI (${processedTranscript.length} characters)...`);
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an elite football coaching analyst. Analyze the coaching session transcript and return detailed, specific analysis in this exact JSON structure:

{
  "summary": "detailed session overview",
  "overallScore": 75,
  "strengths": ["specific strength based on transcript", "another specific strength"],
  "areasForImprovement": ["specific improvement area", "another area"],
  "keyInfo": {
    "totalWords": actual_word_count_from_transcript,
    "wordsPerMinute": calculated_rate,
    "talkingToSilenceRatio": "analysis based on content",
    "playersmentioned": [{"name": "ActualPlayerName", "count": frequency}]
  },
  "questioning": {
    "totalQuestions": actual_question_count,
    "questionTypes": [{"type": "Open-ended", "count": 3, "impact": "High"}],
    "researchInsights": "evidence-based questioning analysis",
    "developmentAreas": ["specific questioning improvements"]
  },
  "language": {
    "clarity": 8,
    "specificity": 7,
    "ageAppropriate": 9,
    "researchAlignment": "methodology connection",
    "feedback": "specific language assessment"
  },
  "coachBehaviours": {
    "interpersonalSkills": {"communicationStyle": "Supportive", "relationshipBuilding": 8, "feedback": "builds rapport effectively"},
    "professionalSkills": {"philosophy": "identified approach", "progression": 7, "collaboration": 8, "feedback": "shows planning"},
    "technicalSkills": {"planning": 8, "reviewing": 6, "tacticalKnowledge": 9, "clarity": 8, "feedback": "demonstrates expertise"},
    "communicationType": "collaborative and instructional",
    "academicReferences": ["relevant coaching research"]
  },
  "playerEngagement": {
    "playerInteractions": [{"name": "PlayerName", "count": 5, "quality": "High"}],
    "coachingStyles": [{"style": "Democratic", "percentage": 60}],
    "coachingTypes": [{"type": "Technical", "impact": 8}],
    "contentAnalysis": {"technical": 8, "tactical": 7, "physical": 6, "psychological": 7},
    "toneAnalysis": {"dominant": "encouraging", "variations": ["instructional", "corrective"], "effectiveness": 8},
    "personalization": 7,
    "nameUsage": 8
  },
  "intendedOutcomes": {
    "coachingFramework": {"why": "skill development", "what": "passing accuracy", "how": "progressive drills", "who": "youth players"},
    "outcomeAlignment": 8,
    "effectiveness": 7,
    "outcomesIdentified": ["improve technique", "build confidence"],
    "researchSupport": "aligns with motor learning principles"
  }
}

Provide comprehensive analysis based on the actual transcript content.`
          },
          {
            role: "user",
            content: `Analyze this football coaching session transcript. Extract real data and provide specific coaching insights:

TRANSCRIPT:
${processedTranscript}

Return JSON analysis with actual player names mentioned, real question counts, specific coaching observations, and evidence-based feedback for all six categories.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      
      console.log(`Received analysis response: ${response.choices[0].message.content?.length} characters`);
      
      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: analysis.summary || "Comprehensive coaching analysis completed using advanced AI frameworks.",
        detailedFeedback: JSON.stringify(analysis, null, 2),
        strengths: analysis.strengths || [],
        areasForImprovement: analysis.areasForImprovement || [],
        overallScore: analysis.overallScore || 0,
        communicationScore: analysis.communicationScore || 0,
        engagementScore: analysis.engagementScore || 0,
        instructionScore: analysis.instructionScore || 0,
        
        // New comprehensive analysis fields
        keyInfo: {
          totalWords: analysis.keyInfo?.totalWords || 0,
          wordsPerMinute: analysis.keyInfo?.wordsPerMinute || 0,
          talkingToSilenceRatio: analysis.keyInfo?.talkingToSilenceRatio || "Not calculated",
          playersmentioned: analysis.keyInfo?.playersmentioned || []
        },
        questioning: {
          totalQuestions: analysis.questioning?.totalQuestions || 0,
          questionTypes: analysis.questioning?.questionTypes || [],
          researchInsights: analysis.questioning?.researchInsights || "",
          developmentAreas: analysis.questioning?.developmentAreas || []
        },
        language: {
          clarity: analysis.language?.clarity || 0,
          specificity: analysis.language?.specificity || 0,
          ageAppropriate: analysis.language?.ageAppropriate || 0,
          researchAlignment: analysis.language?.researchAlignment || "",
          feedback: analysis.language?.feedback || ""
        },
        coachBehaviours: {
          interpersonalSkills: {
            communicationStyle: analysis.coachBehaviours?.interpersonalSkills?.communicationStyle || "",
            relationshipBuilding: analysis.coachBehaviours?.interpersonalSkills?.relationshipBuilding || 0,
            feedback: analysis.coachBehaviours?.interpersonalSkills?.feedback || ""
          },
          professionalSkills: {
            philosophy: analysis.coachBehaviours?.professionalSkills?.philosophy || "",
            progression: analysis.coachBehaviours?.professionalSkills?.progression || 0,
            collaboration: analysis.coachBehaviours?.professionalSkills?.collaboration || 0,
            feedback: analysis.coachBehaviours?.professionalSkills?.feedback || ""
          },
          technicalSkills: {
            planning: analysis.coachBehaviours?.technicalSkills?.planning || 0,
            reviewing: analysis.coachBehaviours?.technicalSkills?.reviewing || 0,
            tacticalKnowledge: analysis.coachBehaviours?.technicalSkills?.tacticalKnowledge || 0,
            clarity: analysis.coachBehaviours?.technicalSkills?.clarity || 0,
            feedback: analysis.coachBehaviours?.technicalSkills?.feedback || ""
          },
          communicationType: analysis.coachBehaviours?.communicationType || "",
          academicReferences: analysis.coachBehaviours?.academicReferences || []
        },
        playerEngagement: {
          playerInteractions: analysis.playerEngagement?.playerInteractions || [],
          coachingStyles: analysis.playerEngagement?.coachingStyles || [],
          coachingTypes: analysis.playerEngagement?.coachingTypes || [],
          contentAnalysis: {
            technical: analysis.playerEngagement?.contentAnalysis?.technical || 0,
            tactical: analysis.playerEngagement?.contentAnalysis?.tactical || 0,
            physical: analysis.playerEngagement?.contentAnalysis?.physical || 0,
            psychological: analysis.playerEngagement?.contentAnalysis?.psychological || 0
          },
          toneAnalysis: {
            dominant: analysis.playerEngagement?.toneAnalysis?.dominant || "",
            variations: analysis.playerEngagement?.toneAnalysis?.variations || [],
            effectiveness: analysis.playerEngagement?.toneAnalysis?.effectiveness || 0
          },
          personalization: analysis.playerEngagement?.personalization || 0,
          nameUsage: analysis.playerEngagement?.nameUsage || 0
        },
        intendedOutcomes: {
          outcomesIdentified: analysis.intendedOutcomes?.outcomesIdentified || [],
          outcomeAlignment: analysis.intendedOutcomes?.outcomeAlignment || 0,
          effectiveness: analysis.intendedOutcomes?.effectiveness || 0,
          researchSupport: analysis.intendedOutcomes?.researchSupport || ""
        },
        coachingFramework: {
          why: analysis.coachingFramework?.why || "",
          what: analysis.coachingFramework?.what || "",
          how: analysis.coachingFramework?.how || "",
          who: analysis.coachingFramework?.who || ""
        }
      };
    }, 5, 3000, true); // Enhanced retry with 5 retries and longer delays
    
  } catch (error: any) {
    console.error("OpenAI API error in analyzeCoachingSession:", error);
    
    // Only authentic OpenAI analysis is supported - no synthetic fallback
    if (error instanceof Error) {
      throw new Error(`OpenAI analysis failed: ${error.message}. Only authentic AI analysis is supported.`);
    }
    
    throw new Error(`Failed to analyze coaching session: ${error?.message || 'Unknown error'}`);
  }
}