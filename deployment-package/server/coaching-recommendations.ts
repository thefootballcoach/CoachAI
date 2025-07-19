import { Feedback } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface CoachingRecommendation {
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  recommendation: string;
  implementationSteps: string[];
  timeframe: string;
  expectedOutcome: string;
  researchBacking: string;
}

interface PersonalizedPlan {
  overallAssessment: string;
  strengthsToMaintain: string[];
  priorityAreas: string[];
  recommendations: CoachingRecommendation[];
  practiceExercises: string[];
  progressTracking: string[];
  nextStepsTimeline: string;
}

/**
 * Generate personalized coaching improvement plans based on comprehensive analysis
 */
export async function generateCoachingRecommendations(
  feedback: Feedback,
  isVideoAnalysis: boolean = false
): Promise<PersonalizedPlan> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const analysisType = isVideoAnalysis ? "multimodal (audio + visual)" : "audio-only";
    
    const prompt = `You are an elite coaching development specialist creating personalized improvement plans for football coaches. Based on the comprehensive ${analysisType} analysis provided, generate a detailed coaching development plan with specific, actionable recommendations.

ANALYSIS DATA:
${JSON.stringify(feedback, null, 2)}

REQUIREMENTS:
1. Generate 5-7 specific coaching improvement recommendations ranked by priority
2. Provide concrete implementation steps for each recommendation
3. Include practice exercises and drills to develop identified skills
4. Reference specific coaching research and methodologies
5. Create a realistic timeline for skill development
6. Establish measurable progress tracking methods

${isVideoAnalysis ? `
VISUAL ANALYSIS INTEGRATION:
- Incorporate visual coaching insights into recommendations
- Address body language and positioning improvements
- Include environmental management suggestions
- Factor in observed player engagement patterns
` : ''}

Focus on evidence-based coaching development that will produce measurable improvements in coaching effectiveness. Provide specific, actionable guidance that coaches can immediately implement.

Respond with comprehensive JSON analysis for personalized coaching development.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert coaching development specialist creating personalized improvement plans based on comprehensive analysis. Generate detailed, actionable recommendations with research backing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    if (response.choices[0].message.content) {
      const recommendations = JSON.parse(response.choices[0].message.content);
      
      // Enforce authentic OpenAI analysis only - no synthetic fallbacks
      if (!recommendations.overallAssessment) {
        throw new Error("OpenAI API failed to provide authentic overall assessment");
      }
      if (!recommendations.strengthsToMaintain || !Array.isArray(recommendations.strengthsToMaintain)) {
        throw new Error("OpenAI API failed to provide authentic strengths analysis");
      }
      if (!recommendations.priorityAreas || !Array.isArray(recommendations.priorityAreas)) {
        throw new Error("OpenAI API failed to provide authentic priority areas");
      }
      if (!recommendations.recommendations || !Array.isArray(recommendations.recommendations)) {
        throw new Error("OpenAI API failed to provide authentic recommendations");
      }
      
      return {
        overallAssessment: recommendations.overallAssessment,
        strengthsToMaintain: recommendations.strengthsToMaintain,
        priorityAreas: recommendations.priorityAreas,
        recommendations: recommendations.recommendations,
        practiceExercises: recommendations.practiceExercises,
        progressTracking: recommendations.progressTracking,
        nextStepsTimeline: recommendations.nextStepsTimeline
      };
    }
    
    // This should never be reached - OpenAI API must provide authentic recommendations
    throw new Error("OpenAI API failed to provide coaching recommendations");
    
  } catch (error: any) {
    console.error("Error generating coaching recommendations:", error);
    
    // Check if it's an API key or quota issue
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded')) {
      throw new Error('OpenAI API quota exceeded. Please check your plan and billing details, or provide a valid API key with available credits.');
    }
    
    if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('api key')) {
      throw new Error('Invalid OpenAI API key. Please provide a valid API key.');
    }
    
    // Force API resolution instead of using fallback to ensure bespoke recommendations
    throw new Error(`OpenAI recommendations are required for authentic coaching development plans. API Error: ${error.message}. Please ensure OpenAI API key is valid and has sufficient quota.`);
  }
  
  // This should never be reached - OpenAI API must provide authentic recommendations
  throw new Error("OpenAI API failed to provide coaching recommendations");
}

// Removed fallback recommendation function - enforcing authentic OpenAI analysis only

/**
 * Generate targeted practice exercises based on specific coaching weaknesses
 */
export function generatePracticeExercises(
  weakAreas: string[],
  isVideoAnalysis: boolean = false
): string[] {
  const exercises: string[] = [];
  
  weakAreas.forEach(area => {
    const lowerArea = area.toLowerCase();
    
    if (lowerArea.includes('communication') || lowerArea.includes('language')) {
      exercises.push(
        "Practice delivering instructions in 10-15 word segments",
        "Record yourself giving feedback and assess clarity",
        "Use the 'pause and check' method after each instruction"
      );
    }
    
    if (lowerArea.includes('engagement') || lowerArea.includes('player')) {
      exercises.push(
        "Practice using each player's name 3+ times per session",
        "Implement 'positive sandwich' feedback technique",
        "Create small group interactions for personal attention"
      );
    }
    
    if (lowerArea.includes('questioning')) {
      exercises.push(
        "Practice asking open-ended questions about decision-making",
        "Use 'what if' scenarios during training",
        "Implement guided discovery questioning techniques"
      );
    }
    
    if (isVideoAnalysis && (lowerArea.includes('positioning') || lowerArea.includes('demonstration'))) {
      exercises.push(
        "Practice demonstration positioning for optimal player viewing",
        "Work on deliberate gesture use during instruction",
        "Film demonstration angles to assess visibility"
      );
    }
  });
  
  return exercises.length > 0 ? exercises : [
    "Focus on session planning and preparation",
    "Practice clear communication delivery",
    "Develop player interaction skills"
  ];
}