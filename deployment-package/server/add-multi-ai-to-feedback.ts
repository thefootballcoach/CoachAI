import { db } from "./db";
import { feedbacks } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { performMultiAIAnalysis } from "./multi-ai-processor";

async function addMultiAIToFeedback() {
  try {
    console.log("Adding multi-AI analysis to existing feedback...");
    
    // Get feedback ID 81 (Luke Session.mp4) directly from database
    const feedbackId = 81;
    const [feedback] = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.id, feedbackId));
    
    if (!feedback) {
      console.error("Feedback not found");
      return;
    }
    
    console.log(`Processing feedback ${feedbackId}: ${feedback.transcription?.substring(0, 100)}...`);
    
    // Simulate reflection data
    const reflectionData = {
      coachName: "Luke",
      ageGroup: "Youth",
      sessionType: "Football Training",
      objectives: "Attacking patterns and finishing"
    };
    
    console.log("Running multi-AI analysis...");
    const multiAiResult = await performMultiAIAnalysis(
      feedback.transcription || '', 
      reflectionData, 
      false // audio only
    );
    
    console.log("Multi-AI analysis completed successfully!");
    console.log("- OpenAI Analysis:", multiAiResult.openaiAnalysis ? "✓" : "✗");
    console.log("- Claude Analysis:", multiAiResult.claudeAnalysis ? "✓" : "✗");
    console.log("- Perplexity Analysis:", multiAiResult.perplexityAnalysis ? "✓" : "✗");
    console.log("- Synthesized Insights:", multiAiResult.synthesizedInsights ? "✓" : "✗");
    
    // Update the feedback with multi-AI analysis
    await storage.updateFeedback(feedbackId, {
      multiAiAnalysis: multiAiResult
    });
    
    console.log(`Successfully updated feedback ${feedbackId} with multi-AI analysis!`);
    
    // Verify the update
    const updatedFeedback = await storage.getFeedback(feedbackId);
    console.log("Verification:", updatedFeedback?.multiAiAnalysis ? "Multi-AI data saved ✓" : "Failed to save ✗");
    
  } catch (error) {
    console.error("Failed to add multi-AI analysis:", error);
  }
}

addMultiAIToFeedback();