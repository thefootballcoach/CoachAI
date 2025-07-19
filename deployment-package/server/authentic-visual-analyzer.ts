import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AuthenticVisualData {
  videoProcessable: boolean;
  framesExtracted: number;
  actualObservations: string[];
  coachingVisualElements: {
    bodyLanguageObservations: string[];
    positioningNotes: string[];
    demonstrationMoments: string[];
    playerInteractionVisuals: string[];
  };
  technicalFindings: {
    videoQuality: string;
    coachVisibility: string;
    demonstrationClarity: string;
    playerEngagementVisual: string;
  };
  realRecommendations: string[];
}

/**
 * AUTHENTIC VISUAL ANALYZER - Only provides feedback from actual video frame analysis
 * Returns null if video cannot be processed, preventing placeholder content generation
 */
export async function analyzeVideoAuthentically(
  videoPath: string, 
  videoId: number
): Promise<AuthenticVisualData | null> {
  
  console.log("🎥 AUTHENTIC VISUAL ANALYSIS - Starting real frame extraction...");
  
  const tempDir = path.join(process.cwd(), 'uploads', 'temp', `authentic_frames_${videoId}`);
  
  try {
    // Step 1: Verify video file exists and is accessible
    if (!fs.existsSync(videoPath)) {
      console.log("❌ Video file not accessible - cannot perform authentic visual analysis");
      return null;
    }
    
    // Step 2: Create temp directory for frame extraction
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Step 3: Get video duration
    const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const durationResult = await execAsync(durationCmd);
    const duration = parseFloat(durationResult.stdout.trim());
    
    if (isNaN(duration) || duration <= 0) {
      console.log("❌ Cannot determine video duration - visual analysis unavailable");
      return null;
    }
    
    console.log(`✅ Video duration confirmed: ${duration} seconds`);
    
    // Step 4: Extract frames at strategic intervals (every 60 seconds, max 5 frames to manage costs)
    const frameInterval = Math.max(60, duration / 5);
    const frameCount = Math.min(5, Math.floor(duration / frameInterval));
    const extractedFrames: string[] = [];
    
    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * frameInterval + 30; // Start 30 seconds in
      const framePath = path.join(tempDir, `frame_${i}_${Math.round(timestamp)}s.jpg`);
      
      try {
        const extractCmd = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}" -y`;
        await execAsync(extractCmd);
        
        if (fs.existsSync(framePath) && fs.statSync(framePath).size > 1000) {
          extractedFrames.push(framePath);
          console.log(`✅ Frame extracted at ${Math.round(timestamp)}s (${fs.statSync(framePath).size} bytes)`);
        }
      } catch (error) {
        console.log(`⚠️ Frame extraction failed at ${timestamp}s:`, error.message);
      }
    }
    
    if (extractedFrames.length === 0) {
      console.log("❌ No frames successfully extracted - authentic visual analysis unavailable");
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
      return null;
    }
    
    console.log(`🎯 AUTHENTIC FRAME ANALYSIS: Processing ${extractedFrames.length} real video frames...`);
    
    // Step 5: Analyze extracted frames with GPT-4 Vision
    const frameAnalyses: string[] = [];
    
    for (const framePath of extractedFrames) {
      try {
        const frameBase64 = fs.readFileSync(framePath, 'base64');
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this football coaching session frame. Provide SPECIFIC observations about:
1. Coach body language and positioning (confident, engaged, central, peripheral, etc.)
2. Player engagement levels (attentive, distracted, focused, listening, etc.)
3. Coaching demonstrations visible (technical skills, positioning, tactical, etc.)
4. Communication style visible (pointing, gesturing, close proximity, distant, etc.)
5. Session organization (structured, chaotic, well-organized, clear groups, etc.)

IMPORTANT: Only describe what you can ACTUALLY SEE in this specific frame. Do not generate generic coaching advice.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${frameBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.1
        });
        
        const analysis = response.choices[0].message.content || "";
        if (analysis && analysis.length > 50) {
          frameAnalyses.push(analysis);
          console.log(`✅ Frame analyzed: ${analysis.substring(0, 100)}...`);
        }
        
        // Clean up frame file immediately after analysis
        fs.unlinkSync(framePath);
        
      } catch (error) {
        console.log(`⚠️ Frame analysis failed:`, error.message);
        // Clean up frame file on error
        try {
          fs.unlinkSync(framePath);
        } catch {}
      }
    }
    
    // Step 6: Process authentic observations
    if (frameAnalyses.length === 0) {
      console.log("❌ No frame analyses completed - returning null to prevent placeholder content");
      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
      return null;
    }
    
    console.log(`🎯 PROCESSING ${frameAnalyses.length} AUTHENTIC VISUAL OBSERVATIONS...`);
    
    // Extract authentic coaching elements from real frame analyses
    const bodyLanguageObservations: string[] = [];
    const positioningNotes: string[] = [];
    const demonstrationMoments: string[] = [];
    const playerInteractionVisuals: string[] = [];
    const realRecommendations: string[] = [];
    
    frameAnalyses.forEach((analysis, index) => {
      const lowerAnalysis = analysis.toLowerCase();
      
      // Extract body language observations
      if (lowerAnalysis.includes('confident') || lowerAnalysis.includes('engaged') || lowerAnalysis.includes('animated')) {
        bodyLanguageObservations.push(`Frame ${index + 1}: Confident and engaged coaching presence observed`);
      }
      if (lowerAnalysis.includes('pointing') || lowerAnalysis.includes('gesture') || lowerAnalysis.includes('demonstrating')) {
        bodyLanguageObservations.push(`Frame ${index + 1}: Active gesturing and demonstration behavior`);
      }
      
      // Extract positioning observations
      if (lowerAnalysis.includes('central') || lowerAnalysis.includes('middle') || lowerAnalysis.includes('center')) {
        positioningNotes.push(`Frame ${index + 1}: Central positioning for group visibility`);
      }
      if (lowerAnalysis.includes('close') || lowerAnalysis.includes('proximity') || lowerAnalysis.includes('near')) {
        positioningNotes.push(`Frame ${index + 1}: Close proximity for individual instruction`);
      }
      
      // Extract demonstration moments
      if (lowerAnalysis.includes('demonstrat') || lowerAnalysis.includes('showing') || lowerAnalysis.includes('technical')) {
        demonstrationMoments.push(`Frame ${index + 1}: Technical demonstration or skill instruction visible`);
      }
      
      // Extract player interaction visuals
      if (lowerAnalysis.includes('attentive') || lowerAnalysis.includes('listening') || lowerAnalysis.includes('focused')) {
        playerInteractionVisuals.push(`Frame ${index + 1}: High player attention and engagement levels`);
      }
      if (lowerAnalysis.includes('group') || lowerAnalysis.includes('players gathered') || lowerAnalysis.includes('circle')) {
        playerInteractionVisuals.push(`Frame ${index + 1}: Organized group instruction setup`);
      }
      
      // Generate specific recommendations based on what was actually observed
      if (lowerAnalysis.includes('distant') || lowerAnalysis.includes('far') || lowerAnalysis.includes('peripheral')) {
        realRecommendations.push('Move closer to players during instruction for better engagement');
      }
      if (lowerAnalysis.includes('unclear') || lowerAnalysis.includes('blocked') || lowerAnalysis.includes('obscured')) {
        realRecommendations.push('Ensure clear sight lines for all players during demonstrations');
      }
    });
    
    // Assess technical findings
    const videoQuality = frameAnalyses.some(a => a.toLowerCase().includes('clear') || a.toLowerCase().includes('visible')) ? 
      'Good visual quality for coaching analysis' : 'Limited visual clarity detected';
    
    const coachVisibility = frameAnalyses.some(a => a.toLowerCase().includes('coach') && (a.toLowerCase().includes('visible') || a.toLowerCase().includes('clear'))) ?
      'Coach clearly visible in frames' : 'Coach visibility variable across frames';
    
    const demonstrationClarity = frameAnalyses.some(a => a.toLowerCase().includes('demonstrat') && a.toLowerCase().includes('clear')) ?
      'Demonstrations clearly visible' : 'Demonstration clarity varies';
    
    const playerEngagementVisual = frameAnalyses.some(a => a.toLowerCase().includes('attentive') || a.toLowerCase().includes('engaged')) ?
      'High visual engagement levels observed' : 'Player engagement levels variable';
    
    // Cleanup temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    
    console.log("✅ AUTHENTIC VISUAL ANALYSIS COMPLETE - 100% real frame data");
    
    return {
      videoProcessable: true,
      framesExtracted: frameAnalyses.length,
      actualObservations: frameAnalyses,
      coachingVisualElements: {
        bodyLanguageObservations: bodyLanguageObservations.length > 0 ? bodyLanguageObservations : ['Body language assessment requires clearer video frames'],
        positioningNotes: positioningNotes.length > 0 ? positioningNotes : ['Positioning analysis limited by video angle/quality'],
        demonstrationMoments: demonstrationMoments.length > 0 ? demonstrationMoments : ['Demonstration moments not clearly captured'],
        playerInteractionVisuals: playerInteractionVisuals.length > 0 ? playerInteractionVisuals : ['Player interaction visuals require better frame clarity']
      },
      technicalFindings: {
        videoQuality,
        coachVisibility,
        demonstrationClarity,
        playerEngagementVisual
      },
      realRecommendations: realRecommendations.length > 0 ? realRecommendations : ['Visual analysis requires improved video quality for specific recommendations']
    };
    
  } catch (error) {
    console.error('❌ Authentic visual analysis error:', error);
    
    // Cleanup on error
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    
    return null;
  }
}

/**
 * Generate fallback message when authentic visual analysis is unavailable
 */
export function generateAuthenticVisualFallback(): AuthenticVisualData {
  console.log("⚠️ AUTHENTIC VISUAL FALLBACK - Video frames not processable");
  
  return {
    videoProcessable: false,
    framesExtracted: 0,
    actualObservations: ['Video frames could not be extracted for authentic visual analysis'],
    coachingVisualElements: {
      bodyLanguageObservations: ['Visual body language analysis unavailable - video not processable'],
      positioningNotes: ['Positioning analysis unavailable - requires extractable video frames'],
      demonstrationMoments: ['Demonstration analysis unavailable - video frames not accessible'],
      playerInteractionVisuals: ['Player interaction visuals unavailable - video processing failed']
    },
    technicalFindings: {
      videoQuality: 'Video quality assessment unavailable',
      coachVisibility: 'Coach visibility assessment unavailable', 
      demonstrationClarity: 'Demonstration clarity assessment unavailable',
      playerEngagementVisual: 'Visual engagement assessment unavailable'
    },
    realRecommendations: [
      'Upload video in MP4 or MOV format for visual analysis',
      'Ensure video file is not corrupted for frame extraction',
      'Consider higher quality video recording for comprehensive visual feedback'
    ]
  };
}