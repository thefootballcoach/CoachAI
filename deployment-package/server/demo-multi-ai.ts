import { performMultiAIAnalysis } from "./multi-ai-processor";

async function demoMultiAI() {
  console.log("🚀 Starting multi-AI analysis demonstration...");
  
  // Sample coaching transcript for demonstration
  const sampleTranscript = `
Right, good. Just listen up, get in your fours. So, see those three mannequins? 
Two of the defenders are going to pick to either defend off the central and the right one 
or the central and the left one. They can choose, all right? 

H just come and stand here. Yeah, Jed just come and stand here. Pretend we're, 
you're standing on those two. The practice will start with the coach and I might start 
with a pass from in front of him, from the side of him, from behind him, it might be in 
the air, it might be around his chops. All different types of pass, all right? 

So, I'm going to pass him to Pewey. The only constraint you've got now is he must play 
into Cam. After that, you do what you want to do. What might be the obvious thing to do here? 
Rhys, you get on your bike now. Once he gets in the box pass zone, what's his first thought? 
He's got to be shooting it. If he's nowhere near, he's got to shoot.

Good decision, Puyi. Love that. Remember, the only constraint is you have to play to the 
centre forward. Yes, yes, yes. Good. Right decision or wrong decision? We're here. 
Wrong because if he's on the move like he should be, that's a much higher chance of scoring.

Come on, defenders. Quicker, quicker. Good. How many goals you had so far? One. 
Milo, quicker please. Good, good. Finish. Finish, Puyi. Really good, Puyi.
`;

  const reflectionData = {
    coachName: "Coach Demo",
    ageGroup: "Youth U16",
    sessionType: "Tactical Training",
    objectives: "Attacking patterns and decision making"
  };

  try {
    console.log("📊 Running multi-AI analysis on sample coaching session...");
    const result = await performMultiAIAnalysis(sampleTranscript, reflectionData, false);
    
    console.log("\n🎯 Multi-AI Analysis Results:");
    console.log("============================");
    
    if (result.openaiAnalysis) {
      console.log("✅ OpenAI GPT-4 Analysis: Complete");
      console.log(`   Overall Score: ${result.openaiAnalysis.overallScore}/100`);
    }
    
    if (result.claudeAnalysis) {
      console.log("✅ Anthropic Claude Analysis: Complete");
      console.log(`   Pedagogical insights provided`);
    }
    
    if (result.perplexityAnalysis) {
      console.log("✅ Perplexity Research Analysis: Complete");
      console.log(`   Research-backed recommendations included`);
    }
    
    if (result.synthesizedInsights) {
      console.log("✅ Synthesized Multi-AI Insights: Complete");
      console.log(`   Combined analysis from all AI sources`);
    }
    
    console.log("\n📈 Analysis Summary:");
    console.log(`- Total analysis size: ${JSON.stringify(result).length} characters`);
    console.log(`- AI providers used: ${[result.openaiAnalysis, result.claudeAnalysis, result.perplexityAnalysis].filter(Boolean).length}/3`);
    
    if (result.synthesizedInsights?.keyRecommendations) {
      console.log("\n🔑 Key Recommendations:");
      result.synthesizedInsights.keyRecommendations.slice(0, 3).forEach((rec: string, i: number) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    console.log("\n🎉 Multi-AI analysis demonstration completed successfully!");
    
  } catch (error) {
    console.error("❌ Multi-AI analysis failed:", error);
  }
}

demoMultiAI();