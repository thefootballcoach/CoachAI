import { performMultiAIAnalysis } from "./multi-ai-processor";

async function testMultiAI() {
  try {
    console.log("Testing multi-AI analysis system...");
    
    const testTranscript = "Good morning everyone. Today we're going to work on passing and receiving. Remember to use the inside of your foot for short passes. Keep your head up to see your teammates. Well done, Jake! That's exactly what I was looking for.";
    
    const testReflectionData = {
      coachName: "Test Coach",
      ageGroup: "U12",
      sessionType: "Technical Training",
      objectives: "Improve passing accuracy"
    };
    
    console.log("Running comprehensive multi-AI analysis...");
    const result = await performMultiAIAnalysis(testTranscript, testReflectionData, false);
    
    console.log("Multi-AI Analysis Result:");
    console.log("- OpenAI Analysis:", result.openaiAnalysis ? "✓ Success" : "✗ Failed");
    console.log("- Claude Analysis:", result.claudeAnalysis ? "✓ Success" : "✗ Failed");
    console.log("- Perplexity Analysis:", result.perplexityAnalysis ? "✓ Success" : "✗ Failed");
    console.log("- Visual Analysis:", result.visualAnalysis ? "✓ Success" : "N/A (audio only)");
    console.log("- Synthesized Insights:", result.synthesizedInsights ? "✓ Success" : "✗ Failed");
    
    if (result.synthesizedInsights) {
      console.log("\nSynthesized Insights Summary:");
      console.log("- Key Strengths:", result.synthesizedInsights.keyStrengths?.length || 0);
      console.log("- Improvement Areas:", result.synthesizedInsights.improvementAreas?.length || 0);
      console.log("- Overall Assessment:", result.synthesizedInsights.overallAssessment ? "Present" : "Missing");
    }
    
    console.log("\nMulti-AI analysis test completed successfully!");
    
  } catch (error) {
    console.error("Multi-AI analysis test failed:", error);
  }
}

testMultiAI();