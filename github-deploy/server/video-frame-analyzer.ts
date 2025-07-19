import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FrameAnalysis {
  timestamp: number;
  description: string;
  coachingElements: {
    bodyLanguage: string;
    positioning: string;
    demonstrations: string;
    playerFormation: string;
  };
}

interface VideoAnalysisResult {
  visualSummary: string;
  keyMoments: FrameAnalysis[];
  coachingVisualScore: number;
  recommendations: string[];
}

/**
 * Extract key frames from video for visual analysis
 * We'll extract 1 frame every 30 seconds to manage costs
 */
export async function extractKeyFrames(
  videoPath: string, 
  outputDir: string,
  intervalSeconds: number = 30
): Promise<string[]> {
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get video duration
  const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
  const durationResult = await execAsync(durationCmd);
  const duration = parseFloat(durationResult.stdout.trim());
  
  console.log(`[VIDEO-ANALYZER] Video duration: ${duration} seconds`);
  
  // Extract frames at intervals
  const framePaths: string[] = [];
  const frameCount = Math.floor(duration / intervalSeconds);
  
  for (let i = 0; i <= frameCount; i++) {
    const timestamp = i * intervalSeconds;
    const framePath = path.join(outputDir, `frame_${i}_${timestamp}s.jpg`);
    
    // Extract frame at specific timestamp
    const extractCmd = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}" -y`;
    
    try {
      await execAsync(extractCmd);
      framePaths.push(framePath);
      console.log(`[VIDEO-ANALYZER] Extracted frame at ${timestamp}s`);
    } catch (error) {
      console.warn(`[VIDEO-ANALYZER] Failed to extract frame at ${timestamp}s:`, error);
    }
  }
  
  return framePaths;
}

/**
 * Analyze a single frame for coaching elements
 */
async function analyzeFrame(framePath: string, timestamp: number): Promise<FrameAnalysis | null> {
  try {
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(framePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // More cost-effective for frame analysis
      messages: [
        {
          role: "system",
          content: `You are analyzing a football coaching session video frame. Focus on:
          1. Coach's body language and positioning
          2. Player formations and positioning
          3. Quality of demonstrations
          4. Visual coaching effectiveness
          Provide specific observations, not generic descriptions.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this coaching session frame at timestamp ${timestamp} seconds. Describe:
              1. Coach's body language and positioning
              2. Player formation/arrangement
              3. Any demonstrations being shown
              4. Overall visual coaching effectiveness`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low" // Use low detail to reduce costs
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    
    const content = response.choices[0].message.content || "";
    
    // Parse the response into structured format
    const lines = content.split('\n');
    
    return {
      timestamp,
      description: content,
      coachingElements: {
        bodyLanguage: extractSection(lines, "body language") || "Not visible",
        positioning: extractSection(lines, "positioning") || "Not visible",
        demonstrations: extractSection(lines, "demonstration") || "No demonstrations visible",
        playerFormation: extractSection(lines, "formation") || "Players not clearly visible"
      }
    };
    
  } catch (error) {
    console.error(`[VIDEO-ANALYZER] Failed to analyze frame at ${timestamp}s:`, error);
    return null;
  }
}

/**
 * Extract specific section from analysis text
 */
function extractSection(lines: string[], keyword: string): string {
  const line = lines.find(l => l.toLowerCase().includes(keyword));
  return line ? line.replace(/^\d+\.\s*/, '').trim() : "";
}

/**
 * Analyze video frames and provide visual coaching feedback
 */
export async function analyzeVideoFrames(
  videoPath: string,
  videoId: number
): Promise<VideoAnalysisResult> {
  
  const tempDir = path.join(process.cwd(), 'uploads', 'temp', `video_${videoId}_frames`);
  
  try {
    console.log(`[VIDEO-ANALYZER] Starting visual analysis for video ${videoId}`);
    
    // Extract key frames (every 30 seconds)
    const framePaths = await extractKeyFrames(videoPath, tempDir, 30);
    
    console.log(`[VIDEO-ANALYZER] Extracted ${framePaths.length} frames for analysis`);
    
    // Analyze each frame
    const frameAnalyses: FrameAnalysis[] = [];
    
    for (let i = 0; i < framePaths.length; i++) {
      const timestamp = i * 30;
      const analysis = await analyzeFrame(framePaths[i], timestamp);
      
      if (analysis) {
        frameAnalyses.push(analysis);
      }
      
      // Clean up frame file after analysis
      try {
        fs.unlinkSync(framePaths[i]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Generate overall visual analysis summary
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a football coaching expert analyzing visual coaching effectiveness."
        },
        {
          role: "user",
          content: `Based on these frame analyses from a coaching session, provide:
          1. Overall visual coaching effectiveness summary
          2. Key visual coaching strengths observed
          3. Areas for visual improvement
          4. Specific recommendations for better visual coaching
          
          Frame analyses:
          ${frameAnalyses.map(f => `At ${f.timestamp}s: ${f.description}`).join('\n\n')}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });
    
    const summaryContent = summaryResponse.choices[0].message.content || "";
    
    // Calculate visual coaching score based on observations
    const visualScore = calculateVisualScore(frameAnalyses);
    
    // Extract recommendations
    const recommendations = extractRecommendations(summaryContent);
    
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    return {
      visualSummary: summaryContent,
      keyMoments: frameAnalyses,
      coachingVisualScore: visualScore,
      recommendations
    };
    
  } catch (error) {
    console.error('[VIDEO-ANALYZER] Video analysis failed:', error);
    
    // Clean up on error
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    throw error;
  }
}

/**
 * Calculate visual coaching score based on frame analyses
 */
function calculateVisualScore(analyses: FrameAnalysis[]): number {
  if (analyses.length === 0) return 5;
  
  let totalScore = 0;
  let validFrames = 0;
  
  for (const analysis of analyses) {
    let frameScore = 5; // Base score
    
    // Check for positive indicators
    if (analysis.coachingElements.bodyLanguage.toLowerCase().includes('engaged') ||
        analysis.coachingElements.bodyLanguage.toLowerCase().includes('positive')) {
      frameScore += 1;
    }
    
    if (analysis.coachingElements.positioning.toLowerCase().includes('good') ||
        analysis.coachingElements.positioning.toLowerCase().includes('optimal') ||
        analysis.coachingElements.positioning.toLowerCase().includes('visible')) {
      frameScore += 1;
    }
    
    if (analysis.coachingElements.demonstrations.toLowerCase().includes('clear') ||
        analysis.coachingElements.demonstrations.toLowerCase().includes('effective')) {
      frameScore += 1.5;
    }
    
    if (analysis.coachingElements.playerFormation.toLowerCase().includes('organized') ||
        analysis.coachingElements.playerFormation.toLowerCase().includes('structured')) {
      frameScore += 1.5;
    }
    
    totalScore += Math.min(frameScore, 10);
    validFrames++;
  }
  
  return validFrames > 0 ? Math.round(totalScore / validFrames) : 5;
}

/**
 * Extract recommendations from summary
 */
function extractRecommendations(summary: string): string[] {
  const recommendations: string[] = [];
  const lines = summary.split('\n');
  
  let inRecommendations = false;
  
  for (const line of lines) {
    if (line.toLowerCase().includes('recommendation') || 
        line.toLowerCase().includes('improvement')) {
      inRecommendations = true;
      continue;
    }
    
    if (inRecommendations && line.trim()) {
      if (line.match(/^\d+\.|^-|^•/)) {
        recommendations.push(line.replace(/^[\d\.\-•]\s*/, '').trim());
      } else if (line.match(/^[A-Z]/)) {
        // New section started
        inRecommendations = false;
      }
    }
  }
  
  return recommendations.slice(0, 5); // Limit to 5 recommendations
}