import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PreciseAnalysisResult {
  overallScore: number;
  communicationScore: number;
  engagementScore: number;
  instructionScore: number;
  feedback: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  keyInfo: {
    totalWords: number;
    uniqueWords: number;
    playerNamesIdentified: string[];
    questionsAsked: number;
    positiveLanguageCount: number;
    instructionalCommands: number;
    averageSentenceLength: number;
    speakingRate: number;
  };
  questioning: {
    totalQuestions: number;
    questionTypes: string[];
    clarifyingQuestions: number;
    engagementQuestions: number;
  };
  language: {
    positiveLanguage: number;
    instructionalClarity: number;
    vocabularyComplexity: number;
    communicationStyle: string;
  };
  coachBehaviours: {
    encouragement: number;
    correction: number;
    instruction: number;
    demonstration: number;
    feedback: number;
  };
  playerEngagement: {
    individualAttention: number;
    groupManagement: number;
    responseElicitation: number;
    nameUsage: number;
  };
  intendedOutcomes: {
    skillDevelopment: number;
    tacticalUnderstanding: number;
    playerConfidence: number;
    sessionFlow: number;
  };
}

/**
 * Perform precise linguistic and coaching analysis on transcribed content
 */
export async function performPreciseAnalysis(transcript: string): Promise<PreciseAnalysisResult> {
  // Clean and prepare transcript
  const cleanTranscript = transcript.replace(/\s+/g, ' ').trim();
  
  // Basic linguistic analysis
  const words = cleanTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const sentences = cleanTranscript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const uniqueWords = Array.from(new Set(words));
  
  // Advanced pattern recognition
  const playerNames = extractPlayerNames(cleanTranscript);
  const questions = analyzeQuestions(cleanTranscript);
  const positiveLanguage = countPositiveLanguage(words);
  const instructionalCommands = countInstructionalCommands(words);
  const coachingBehaviors = analyzeBehaviors(cleanTranscript);
  
  // Calculate speaking metrics
  const averageSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
  const speakingRate = estimateSpeakingRate(words.length);
  
  // Generate comprehensive analysis using AI
  const aiAnalysis = await generateDetailedAnalysis(cleanTranscript, {
    wordCount: words.length,
    playerNames,
    questions: questions.total,
    positiveCount: positiveLanguage.count,
    instructionalCount: instructionalCommands.count
  });
  
  // Calculate precise scores
  const scores = calculatePreciseScores({
    words,
    uniqueWords,
    playerNames,
    questions,
    positiveLanguage,
    instructionalCommands,
    coachingBehaviors,
    averageSentenceLength
  });
  
  return {
    overallScore: scores.overall,
    communicationScore: scores.communication,
    engagementScore: scores.engagement,
    instructionScore: scores.instruction,
    feedback: aiAnalysis.feedback,
    summary: aiAnalysis.summary,
    strengths: aiAnalysis.strengths,
    improvements: aiAnalysis.improvements,
    keyInfo: {
      totalWords: words.length,
      uniqueWords: uniqueWords.length,
      playerNamesIdentified: playerNames,
      questionsAsked: questions.total,
      positiveLanguageCount: positiveLanguage.count,
      instructionalCommands: instructionalCommands.count,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
      speakingRate
    },
    questioning: {
      totalQuestions: questions.total,
      questionTypes: questions.types,
      clarifyingQuestions: questions.clarifying,
      engagementQuestions: questions.engagement
    },
    language: {
      positiveLanguage: scores.positiveLanguageScore,
      instructionalClarity: scores.instructionalClarity,
      vocabularyComplexity: scores.vocabularyComplexity,
      communicationStyle: determineCommunicationStyle(words, sentences)
    },
    coachBehaviours: {
      encouragement: scores.encouragement,
      correction: scores.correction,
      instruction: scores.instruction,
      demonstration: scores.demonstration,
      feedback: scores.feedbackGiving
    },
    playerEngagement: {
      individualAttention: scores.individualAttention,
      groupManagement: scores.groupManagement,
      responseElicitation: scores.responseElicitation,
      nameUsage: scores.nameUsage
    },
    intendedOutcomes: {
      skillDevelopment: scores.skillDevelopment,
      tacticalUnderstanding: scores.tacticalUnderstanding,
      playerConfidence: scores.playerConfidence,
      sessionFlow: scores.sessionFlow
    }
  };
}

function extractPlayerNames(transcript: string): string[] {
  // Look for capitalized names that appear in coaching context
  const namePattern = /\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z-]+)*\b/g;
  const possibleNames = transcript.match(namePattern) || [];
  
  // Comprehensive filter for non-name words
  const commonWords = [
    'Good', 'Yes', 'Come', 'Go', 'Well', 'Nice', 'Play', 'Ball', 'Time', 'Now', 'Right', 'Left', 'Back', 'Forward',
    'One', 'Two', 'Three', 'Four', 'Five', 'And', 'The', 'But', 'So', 'Here', 'There', 'Where', 'When', 'What',
    'Yep', 'Yeah', 'Okay', 'Alright', 'Brilliant', 'Excellent', 'Perfect', 'Great', 'Amazing', 'Fantastic',
    'Bounce', 'Thread', 'Set', 'Goes', 'Going', 'Coming', 'Start', 'Stop', 'End', 'Begin', 'Finish',
    'Everyone', 'Someone', 'Anyone', 'Nobody', 'Everything', 'Something', 'Nothing', 'Anything',
    'Did', 'Does', 'Will', 'Would', 'Could', 'Should', 'Must', 'Can', 'Cannot', 'Won', 'Lost',
    'First', 'Second', 'Third', 'Last', 'Next', 'Previous', 'Final', 'Initial'
  ];
  
  const names = possibleNames.filter(name => {
    // Remove common words
    if (commonWords.includes(name)) return false;
    
    // Must be reasonable name length
    if (name.length < 3 || name.length > 25) return false;
    
    // Should not be all caps or contain numbers
    if (name === name.toUpperCase() || /\d/.test(name)) return false;
    
    // Common football terms to exclude
    const footballTerms = ['Ball', 'Goal', 'Pass', 'Shot', 'Team', 'Game', 'Match', 'Field', 'Pitch'];
    if (footballTerms.includes(name)) return false;
    
    return true;
  });
  
  return Array.from(new Set(names));
}

function analyzeQuestions(transcript: string): {
  total: number;
  types: string[];
  clarifying: number;
  engagement: number;
} {
  const questionMarks = (transcript.match(/\?/g) || []).length;
  const questions = transcript.split('?').filter(q => q.trim().length > 0);
  
  let clarifying = 0;
  let engagement = 0;
  const types: string[] = [];
  
  questions.forEach(q => {
    const lower = q.toLowerCase();
    if (lower.includes('make sense') || lower.includes('understand') || lower.includes('get it')) {
      clarifying++;
      types.push('Clarifying');
    } else if (lower.includes('want') || lower.includes('think') || lower.includes('feel')) {
      engagement++;
      types.push('Engagement');
    } else {
      types.push('Instructional');
    }
  });
  
  return {
    total: questionMarks,
    types: Array.from(new Set(types)),
    clarifying,
    engagement
  };
}

function countPositiveLanguage(words: string[]): { count: number; examples: string[] } {
  const positiveWords = [
    'good', 'great', 'excellent', 'brilliant', 'fantastic', 'perfect', 'well', 'nice', 
    'lovely', 'beautiful', 'superb', 'outstanding', 'awesome', 'amazing', 'wonderful',
    'yes', 'yeah', 'correct', 'right', 'exactly', 'spot', 'bang', 'quality',
    'love', 'like', 'prefer', 'better', 'best', 'top', 'class', 'tidy'
  ];
  
  const found = words.filter(word => positiveWords.includes(word.toLowerCase()));
  return {
    count: found.length,
    examples: [...new Set(found)].slice(0, 10)
  };
}

function countInstructionalCommands(words: string[]): { count: number; examples: string[] } {
  const instructionalWords = [
    'go', 'come', 'run', 'walk', 'move', 'pass', 'shoot', 'kick', 'throw', 'catch',
    'try', 'practice', 'focus', 'concentrate', 'remember', 'think', 'look', 'watch',
    'listen', 'feel', 'touch', 'control', 'keep', 'hold', 'maintain', 'stay',
    'start', 'stop', 'continue', 'again', 'repeat', 'change', 'switch', 'turn',
    'drop', 'lift', 'raise', 'lower', 'step', 'jump', 'sprint', 'jog'
  ];
  
  const found = words.filter(word => instructionalWords.includes(word.toLowerCase()));
  return {
    count: found.length,
    examples: [...new Set(found)].slice(0, 10)
  };
}

function analyzeBehaviors(transcript: string): {
  encouragement: number;
  correction: number;
  instruction: number;
  demonstration: number;
} {
  const lower = transcript.toLowerCase();
  
  const encouragementPhrases = ['well done', 'good job', 'keep going', 'that\'s it', 'brilliant', 'excellent'];
  const correctionPhrases = ['no', 'not like that', 'try again', 'different', 'change', 'adjust'];
  const instructionPhrases = ['now', 'next', 'then', 'after', 'before', 'when'];
  const demonstrationPhrases = ['like this', 'watch me', 'see this', 'look at', 'this way'];
  
  return {
    encouragement: encouragementPhrases.reduce((count, phrase) => 
      count + (lower.split(phrase).length - 1), 0),
    correction: correctionPhrases.reduce((count, phrase) => 
      count + (lower.split(phrase).length - 1), 0),
    instruction: instructionPhrases.reduce((count, phrase) => 
      count + (lower.split(phrase).length - 1), 0),
    demonstration: demonstrationPhrases.reduce((count, phrase) => 
      count + (lower.split(phrase).length - 1), 0)
  };
}

function estimateSpeakingRate(wordCount: number): number {
  // Realistic coaching session speaking rate estimation
  // Average coaching session has varied pacing with instructions, pauses, and demonstrations
  // Typical range: 120-180 words per minute for instructional content
  
  // Base rate calculation assuming sample represents normal coaching pace
  let estimatedWPM = 150; // Default coaching speaking rate
  
  // Adjust based on word density in sample
  if (wordCount > 200) {
    estimatedWPM = 160; // Higher density suggests faster pace
  } else if (wordCount < 100) {
    estimatedWPM = 140; // Lower density suggests more pauses/demonstrations
  }
  
  return estimatedWPM;
}

function determineCommunicationStyle(words: string[], sentences: string[]): string {
  const avgWordsPerSentence = words.length / sentences.length;
  const questionRatio = sentences.filter(s => s.includes('?')).length / sentences.length;
  
  if (avgWordsPerSentence < 6 && questionRatio > 0.2) return "Interactive & Concise";
  if (avgWordsPerSentence > 12) return "Detailed & Explanatory";
  if (questionRatio > 0.15) return "Questioning & Engaging";
  return "Direct & Instructional";
}

function calculatePreciseScores(data: any): any {
  const {
    words,
    uniqueWords,
    playerNames,
    questions,
    positiveLanguage,
    instructionalCommands,
    coachingBehaviors,
    averageSentenceLength
  } = data;
  
  // Communication Score (0-100)
  const vocabularyRichness = Math.min(20, (uniqueWords.length / words.length) * 100);
  const positiveLanguageScore = Math.min(30, positiveLanguage.count * 3);
  const clarityScore = Math.min(25, 25 - Math.abs(averageSentenceLength - 8) * 2);
  const questioningScore = Math.min(25, questions.total * 5);
  const communication = Math.round(vocabularyRichness + positiveLanguageScore + clarityScore + questioningScore);
  
  // Engagement Score (0-100)
  const nameUsageScore = Math.min(40, playerNames.length * 8);
  const questionEngagementScore = Math.min(30, questions.engagement * 10);
  const interactionScore = Math.min(30, coachingBehaviors.encouragement * 5);
  const engagement = Math.round(nameUsageScore + questionEngagementScore + interactionScore);
  
  // Instruction Score (0-100)
  const commandClarityScore = Math.min(40, instructionalCommands.count * 2);
  const structureScore = Math.min(30, coachingBehaviors.instruction * 3);
  const demonstrationScore = Math.min(30, coachingBehaviors.demonstration * 5);
  const instruction = Math.round(commandClarityScore + structureScore + demonstrationScore);
  
  const overall = Math.round((communication + engagement + instruction) / 3);
  
  return {
    overall: Math.min(100, overall),
    communication: Math.min(100, communication),
    engagement: Math.min(100, engagement),
    instruction: Math.min(100, instruction),
    positiveLanguageScore: Math.min(100, positiveLanguage.count * 5),
    instructionalClarity: Math.min(100, 60 + instructionalCommands.count),
    vocabularyComplexity: Math.min(100, vocabularyRichness * 5),
    encouragement: Math.min(100, 50 + coachingBehaviors.encouragement * 10),
    correction: Math.min(100, 50 + coachingBehaviors.correction * 8),
    instructionClarity: Math.min(100, 60 + coachingBehaviors.instruction * 5),
    demonstration: Math.min(100, 40 + coachingBehaviors.demonstration * 15),
    feedbackGiving: Math.min(100, 55 + positiveLanguage.count * 3),
    individualAttention: Math.min(100, 30 + playerNames.length * 15),
    groupManagement: Math.min(100, 70 + Math.min(20, words.length / 50)),
    responseElicitation: Math.min(100, 40 + questions.total * 12),
    nameUsage: nameUsageScore,
    skillDevelopment: Math.min(100, 65 + instructionalCommands.count),
    tacticalUnderstanding: Math.min(100, 60 + coachingBehaviors.instruction * 4),
    playerConfidence: Math.min(100, 50 + positiveLanguage.count * 4),
    sessionFlow: Math.min(100, 70 + Math.min(25, averageSentenceLength * 2))
  };
}

async function generateDetailedAnalysis(transcript: string, metrics: any): Promise<{
  feedback: string;
  summary: string;
  strengths: string[];
  improvements: string[];
}> {
  try {
    const prompt = `Analyze this coaching session transcript and provide detailed feedback:

TRANSCRIPT: "${transcript.substring(0, 1500)}..."

METRICS:
- Total words: ${metrics.wordCount}
- Player names used: ${metrics.playerNames.join(', ')}
- Questions asked: ${metrics.questions}
- Positive language instances: ${metrics.positiveCount}
- Instructional commands: ${metrics.instructionalCount}

Provide specific, actionable feedback in this JSON format:
{
  "feedback": "Detailed analysis of communication patterns, player engagement, and instructional effectiveness",
  "summary": "Brief overview of coaching performance", 
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        // Fallback if JSON parsing fails
        return generateFallbackAnalysis(transcript, metrics);
      }
    }
    
    return generateFallbackAnalysis(transcript, metrics);
  } catch (error) {
    console.error("AI analysis failed:", error);
    return generateFallbackAnalysis(transcript, metrics);
  }
}

function generateFallbackAnalysis(transcript: string, metrics: any): {
  feedback: string;
  summary: string;
  strengths: string[];
  improvements: string[];
} {
  console.log("⚠️ FALLBACK ANALYSIS - Using authentic data extraction only");
  
  // Only provide feedback based on actual extracted data
  const actualPlayerNames = metrics.playerNames || [];
  const actualQuestions = metrics.questions || 0;
  const actualWordCount = metrics.wordCount || 0;
  const actualPositive = metrics.positiveCount || 0;
  const actualInstructions = metrics.instructionalCount || 0;
  
  return {
    feedback: `Authentic analysis of ${actualWordCount} spoken words. ` +
             `${actualPlayerNames.length > 0 ? `Individual players mentioned: ${actualPlayerNames.join(', ')}. ` : 'No individual player names identified in audio. '}` +
             `${actualQuestions > 0 ? `${actualQuestions} questions asked for engagement. ` : 'Limited questioning technique observed. '}` +
             `${actualInstructions > 0 ? `${actualInstructions} instructional commands delivered. ` : 'Minimal instructional direction identified. '}` +
             `${actualPositive > 0 ? `${actualPositive} positive reinforcement words used.` : 'Limited positive language detected.'}`,
    
    summary: actualWordCount > 0 ? 
      `Analysis based on ${actualWordCount} words of actual coaching dialogue` : 
      'Limited analysis available - transcript data insufficient',
    
    strengths: [
      // Only include strengths that have actual evidence
      ...(actualPlayerNames.length > 0 ? [`Personalized approach: Named ${actualPlayerNames.length} individual players (${actualPlayerNames.slice(0, 3).join(', ')}${actualPlayerNames.length > 3 ? '...' : ''})`] : []),
      ...(actualQuestions > 2 ? [`Active questioning: ${actualQuestions} engagement questions identified`] : []),
      ...(actualPositive > 5 ? [`Positive communication: ${actualPositive} encouraging expressions used`] : []),
      ...(actualInstructions > 10 ? [`Clear instruction: ${actualInstructions} specific coaching commands delivered`] : []),
      ...(actualWordCount > 500 ? [`Comprehensive session: ${actualWordCount} words of coaching dialogue`] : [])
    ].slice(0, 4), // Limit to actual strengths found
    
    improvements: [
      // Only suggest improvements based on what's actually missing
      ...(actualQuestions < 3 ? [`Increase questioning: Only ${actualQuestions} questions identified - consider more player engagement`] : []),
      ...(actualPlayerNames.length < 3 ? [`Individual attention: ${actualPlayerNames.length} players named - consider more personalized interaction`] : []),
      ...(actualPositive < 5 ? [`Positive reinforcement: ${actualPositive} encouraging words - increase motivational language`] : []),
      ...(actualInstructions < 10 ? [`Instructional clarity: ${actualInstructions} commands identified - provide more specific guidance`] : [])
    ].slice(0, 3) // Limit to actual areas needing improvement
  };
}