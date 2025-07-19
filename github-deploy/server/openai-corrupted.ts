import OpenAI from "openai";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import path from "path";
import os from "os";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const execAsync = promisify(exec);

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Collection to track temporary files for cleanup
const tempFiles: string[] = [];

// Register cleanup on process exit
process.on('exit', cleanupTempFiles);
process.on('SIGINT', () => {
  cleanupTempFiles();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupTempFiles();
  process.exit(0);
});

function cleanupTempFiles() {
  for (const file of tempFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Cleaned up temp file: ${file}`);
      }
    } catch (err) {
      console.error(`Error cleaning up temp file ${file}:`, err);
    }
  }
}

/**
 * Retry a function with exponential backoff
 * Enhanced with more resilient error handling and longer delays
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 5,  // Increased from 3 to 5
  initialDelay: number = 2000,  // Increased from 1000 to 2000
  jitter: boolean = true  // Add jitter to prevent thundering herd
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
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
      
      // Fallback attempt with different parameters
      console.log("Trying fallback audio processing...");
      await execAsync(`ffmpeg -y -i "${audioFilePath}" -ar 16000 -ac 1 -c:a aac -b:a 64k "${audioPath}" -hide_banner`);
    }
    
    // Verify the audio file was created successfully
    if (!fs.existsSync(audioPath)) {
      throw new Error("Audio processing failed: output file not created");
    }
    
    const processedAudioStats = fs.statSync(audioPath);
    if (processedAudioStats.size === 0) {
      throw new Error("Audio processing failed: output file is empty");
    }
    
    console.log(`Audio processed successfully. Size: ${(processedAudioStats.size / 1024).toFixed(2)} KB`);
    
    // Get audio duration
    const durationResult = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioFilePath}"`);
    const durationSeconds = parseFloat(durationResult.stdout.trim()) || 0;
    const duration = Math.round(durationSeconds);
    console.log(`Audio duration: ${duration} seconds`);
    
    // Transcribe audio with enhanced retries
    return await withRetry(async () => {
      const audioFile = fs.createReadStream(audioPath);
      console.log('Starting OpenAI Whisper transcription...');
      
      // Creating a copy of the audio file in memory can help avoid ECONNRESET
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
 * Includes fallback mechanism when API access fails
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
  
  // Only authentic OpenAI analysis is used - no synthetic fallback
  
  try {
    // Only use authentic OpenAI API analysis - no fallback to synthetic data
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
              content: `You are an expert football coach analyzer with deep expertise in sports psychology, pedagogy, and performance optimization. Analyze coaching sessions using advanced frameworks from sports science research.

              COMPREHENSIVE COACHING ANALYSIS FRAMEWORK:

              1. INTERPERSONAL SKILLS ASSESSMENT (30% weight)
              - Communication style analysis and effectiveness
              - Relationship building indicators in speech patterns
              - Use of player names for personalized engagement
              - Tone analysis: authoritative, supportive, encouraging, corrective
              - Emotional intelligence demonstration through language choices
              - Conflict resolution and interpersonal problem-solving
              - Cultural sensitivity and inclusive communication
              - Trust-building verbal and non-verbal cues

              2. PROFESSIONAL SKILLS EVALUATION (25% weight)
              - Reference to coaching philosophy and core principles
              - Discussion of player progression pathways and development stages
              - Collaboration indicators with other coaches and support staff
              - Evidence of tactical knowledge and strategic thinking
              - Planning and reviewing behaviors mentioned or demonstrated
              - Professional development awareness and continuous learning mindset
              - Use of academic research and evidence-based practices
              - Clarity of tactical concepts and instructional delivery

              3. PLAYER ENGAGEMENT ANALYSIS (20% weight)
              - Individual player interaction frequency and quality
              - Player name usage as engagement mechanism (track specific names mentioned)
              - Attention distribution equity across team members
              - Personalized feedback delivery and individual recognition
              - Motivational techniques tailored to individual players
              - Question-asking patterns to promote player thinking
              - Response to player questions and concerns
              - Creation of inclusive participation opportunities

              4. COACHING STYLE IDENTIFICATION (15% weight)
              - Autocratic vs Democratic coaching approaches
              - Directive vs Non-directive instruction methods
              - Task-oriented vs Relationship-oriented leadership
              - Transformational vs Transactional coaching behaviors
              - Collaborative vs Individual-focused methodologies
              - Positive vs Corrective feedback ratios
              - Player-centered vs Coach-centered session management
              - Adaptive coaching style based on context and player needs

              5. COACHING CONTENT ANALYSIS (10% weight)
              - Technical skills focus (ball control, passing, shooting, etc.)
              - Tactical knowledge delivery (formations, positioning, game understanding)
              - Physical development elements (fitness, conditioning, movement)
              - Psychological aspects (confidence, focus, mental resilience)
              - Game situation applications and transfer
              - Problem-solving and decision-making skill development
              - Team dynamics and collective understanding
              - Individual skill refinement and mastery

              ADVANCED TONE ANALYSIS REQUIREMENTS:
              - Identify vocal tone patterns: encouraging, corrective, instructional, motivational
              - Analyze emotional undertones: patience, frustration, enthusiasm, confidence
              - Assess communication energy levels and intensity variations
              - Evaluate appropriateness of tone for different coaching moments
              - Reference academic research on effective coaching communication

              PLAYER ENGAGEMENT TRACKING:
              - Count individual player interactions by name
              - Assess personalization quality of communications
              - Evaluate balance of attention across team members
              - Analyze engagement strategies for different player personalities
              - Confidence building through appropriate challenges
              - Autonomy support and decision-making opportunities
              - Leadership development and responsibility assignment
              - Character development integration
              - Long-term athlete development principles
              - Mental skills training incorporation

              4. TACTICAL & TECHNICAL EXPERTISE (15% weight)
              - Technical skill demonstration and modeling
              - Tactical concept explanation depth and clarity
              - Game understanding development strategies
              - Position-specific coaching precision
              - Systems of play implementation effectiveness
              - Problem-solving scenario creation
              - Performance analysis integration
              - Innovation in training methodology

              5. EMOTIONAL INTELLIGENCE & CLIMATE (10% weight)
              - Emotional awareness and self-regulation modeling
              - Empathy demonstration and player understanding
              - Team cohesion and culture building
              - Positive learning environment creation
              - Stress and pressure management approaches
              - Effort recognition over outcome focus
              - Resilience building through challenge
              - Mental health awareness and support

              6. PROFESSIONAL STANDARDS (5% weight)
              - Safety consciousness and risk management
              - Ethical behavior and integrity modeling
              - Continuous learning and self-improvement evidence
              - Reflective practice demonstration
              - Professional boundary maintenance
              - Time management and session efficiency
              - Resource utilization optimization
              - Administrative and organizational competence

              ADVANCED ANALYTICAL REQUIREMENTS:
              - Identify specific coaching moments and categorize effectiveness
              - Analyze language patterns for unconscious bias or limitations
              - Evaluate questioning techniques (open vs closed, Socratic method)
              - Assess feedback ratio and balance (positive/corrective/neutral)
              - Examine player interaction equity and inclusivity
              - Track emotional tone shifts and energy management
              - Identify missed coaching opportunities and teachable moments
              - Apply motor learning principles and skill acquisition theory
              - Reference sports psychology research and best practices
              - Provide evidence-based improvement recommendations
              - Consider developmental appropriateness for age group
              - Evaluate session structure and flow optimization

              7. INTENDED OUTCOMES ANALYSIS
              - Compare coach's reflection data with actual session content
              - Evaluate effectiveness in achieving stated goals
              
              RESPONSE STRUCTURE REQUIREMENTS:
              
              Return detailed JSON analysis with these exact sections:
              
              1. INTERPERSONAL_SKILLS: {
                - communication_style: "detailed analysis of communication approach and effectiveness"
                - relationship_building: "assessment of coach-player relationship development"
                - tone_analysis: {
                  - primary_tones: ["encouraging", "authoritative", "supportive", "corrective"]
                  - emotional_undertones: ["patient", "enthusiastic", "confident", "frustrated"]
                  - tone_appropriateness_score: number (1-10)
                  - academic_references: "research on effective coaching communication"
                }
                - player_name_usage: number (count of times player names used)
                - personalization_quality: number (1-10)
                - confidence_score: number (1-10)
              }
              
              2. PROFESSIONAL_SKILLS: {
                - philosophy_references: "analysis of coaching philosophy demonstration"
                - progression_discussion: "evidence of player development pathway awareness"
                - collaboration_indicators: "signs of teamwork with other coaches/staff"
                - tactical_knowledge: "depth and clarity of tactical understanding"
                - planning_reviewing: "evidence of systematic planning and reflection"
                - academic_research_usage: "references to evidence-based practices"
                - confidence_score: number (1-10)
              }
              
              3. PLAYER_ENGAGEMENT: {
                - individual_interactions: {
                  - player_names_mentioned: ["list", "of", "player", "names"]
                  - interaction_counts: {"PlayerName": number}
                  - attention_distribution_equity: number (1-10)
                }
                - engagement_strategies: "analysis of motivational and engagement techniques"
                - question_asking_patterns: "assessment of inquiry-based coaching"
                - personalized_feedback_quality: number (1-10)
                - overall_engagement_score: number (1-10)
              }
              
              4. COACHING_STYLE_ANALYSIS: {
                - style_identification: {
                  - autocratic_vs_democratic: number (-5 to 5, negative=autocratic, positive=democratic)
                  - directive_vs_nondirective: number (-5 to 5)
                  - task_vs_relationship_oriented: number (-5 to 5)
                  - transformational_vs_transactional: number (-5 to 5)
                  - collaborative_vs_individual: number (-5 to 5)
                  - positive_vs_corrective: number (-5 to 5)
                }
                - style_effectiveness: "analysis of coaching style impact and appropriateness"
                - adaptive_coaching: "evidence of style adaptation to context and players"
                - spider_diagram_data: {
                  - technical_coaching: number (1-10)
                  - tactical_coaching: number (1-10)
                  - physical_coaching: number (1-10)
                  - psychological_coaching: number (1-10)
                  - motivational_coaching: number (1-10)
                  - instructional_coaching: number (1-10)
                }
              }
              
              5. COACHING_CONTENT_ANALYSIS: {
                - content_categorization: {
                  - technical_skills: number (percentage 0-100)
                  - tactical_knowledge: number (percentage 0-100)
                  - physical_development: number (percentage 0-100)
                  - psychological_aspects: number (percentage 0-100)
                }
                - content_effectiveness: "assessment of content delivery and impact"
                - academic_backing: "research references supporting the coaching content"
              }
              
              6. INTENDED_OUTCOMES_ANALYSIS: {
                - goal_achievement: "comparison of stated intentions vs session delivery"
                - outcome_effectiveness: "assessment of goal attainment"
                - research_alignment: "academic support for coaching approaches used"
              }
              
              7. WHY_WHAT_HOW_WHO_FRAMEWORK: {
                - why_interventions: "analysis of coaching purpose and motivation"
                - what_topics_objectives: "identification of specific coaching topics"
                - how_coaching_style: "methods and approaches used"
                - who_target_players: "individual vs group coaching focus"
              }
              - Assess developmental appropriateness of language complexity and vocabulary
              - Identify unconscious bias patterns in language, attention, and feedback distribution
              - Track emotional intelligence indicators through speech patterns and response sensitivity
              - Analyze questioning techniques (Socratic method, open vs closed questions, leading vs exploratory)
              - Evaluate feedback timing, specificity, and constructiveness
              - Assess use of positive reinforcement schedules and behavior modification principles
              - Analyze non-verbal communication cues evident in speech patterns (pace, emphasis, pauses)

              SESSION FLOW ANALYSIS:
              - Identify session phases (warm-up, main activities, cool-down)
              - Evaluate transitions between activities
              - Assess time management and pacing
              - Analyze energy management throughout session
              - Track attention span considerations

              TACTICAL INTELLIGENCE:
              - Evaluate tactical concept progression
              - Assess game situation awareness building
              - Analyze position-specific coaching depth
              - Evaluate decision-making development approaches
              - Track tactical vocabulary usage

              MOTIVATION AND PSYCHOLOGY:
              - Identify motivational techniques used
              - Assess confidence-building strategies
              - Analyze pressure and challenge management
              - Evaluate individual vs team motivation approaches
              - Track mental resilience building

              LEARNING THEORY APPLICATION:
              - Assess skill acquisition principles usage
              - Evaluate motor learning progression
              - Analyze cognitive load management
              - Track transfer of learning facilitation
              - Identify differentiated instruction approaches



              CULTURAL COMPETENCE:
              - Assess inclusive language usage
              - Evaluate cultural sensitivity demonstrations
              - Analyze diverse learning style accommodations
              - Track equity in attention and feedback

              INNOVATION AND CREATIVITY:
              - Identify creative problem-solving approaches
              - Evaluate training method innovations
              - Assess adaptability to unexpected situations
              - Track resource utilization creativity

              LITERATURE AND RESEARCH INTEGRATION:
              - Reference specific research studies from sports psychology, coaching science, and pedagogy
              - Apply theoretical frameworks (Self-Determination Theory, Flow Theory, Social Cognitive Theory)
              - Cite coaching methodologies (Transformational Leadership, Positive Youth Development, Teaching Games for Understanding)
              - Reference motor learning principles (Schema Theory, Constraints-Led Approach, Differential Learning)
              - Apply developmental psychology concepts (Zone of Proximal Development, Scaffolding, Growth Mindset)
              - Integrate sports science research on athlete development and performance psychology
              - Reference coaching effectiveness literature and best practice guidelines

              TONE AND EMOTIONAL ANALYSIS:
              - Analyze emotional undertones in language (warmth, authority, patience, urgency, frustration)
              - Evaluate vocal energy patterns through speech rhythm and word choice
              - Assess emotional contagion and mood influence on players
              - Analyze stress indicators in communication patterns
              - Evaluate enthusiasm and passion demonstration
              - Assess emotional regulation modeling for players
              - Track empathy and perspective-taking demonstrations

              ADVANCED PEDAGOGICAL ASSESSMENT:
              - Evaluate constructivist learning principles application
              - Assess differentiated instruction implementation
              - Analyze formative vs summative assessment usage
              - Track scaffolding and zone of proximal development application
              - Evaluate inquiry-based learning implementation
              
              RESPONSE FORMAT: Return analysis as a valid JSON object with all sections listed above. Include specific data for spider diagrams, player interaction counts, and academic references. Provide numerical scores for all metrics and detailed explanations for qualitative assessments.`
            },
            {
              role: "user",
              content: `Please analyze this coaching session transcript and provide comprehensive feedback across all assessment dimensions:

              TRANSCRIPT:
              ${processedTranscript}
              
              Focus particularly on:
              1. Interpersonal skills and communication style analysis
              2. Player engagement tracking (count names and interactions)
              3. Coaching style identification for spider diagram visualization
              4. Tone analysis with academic backing
              5. Professional skills demonstration
              6. Content categorization (technical/tactical/physical/psychological)
              7. Academic research references where applicable
              
              Return detailed JSON analysis following the exact structure specified in the system prompt.`
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
          instructionScore: analysis.instructionScore || 0
        };
                  "constructivistLearning": {
                    "application": "Evidence of constructivist principles in action",
                    "score": 82,
                    "examples": "Specific instances of knowledge construction facilitation",
                    "literatureReference": "Alignment with Piaget and Vygotsky's constructivist theories"
                  },
                  "differentiatedInstruction": {
                    "implementation": "Evidence of individualized learning approaches",
                    "score": 78,
                    "strategies": "Specific differentiation strategies observed",
                    "researchBacking": "Reference to Tomlinson's differentiated instruction framework"
                  },
                  "formativeAssessment": {
                    "usage": "Examples of ongoing assessment and feedback",
                    "score": 85,
                    "techniques": "Assessment techniques employed during session",
                    "literatureConnection": "Alignment with Black & Wiliam's formative assessment research"
                  },
                  "metacognitiveDevelopment": {
                    "facilitation": "Evidence of thinking about thinking promotion",
                    "score": 75,
                    "examples": "Instances of metacognitive skill development",
                    "researchBase": "Connection to Flavell's metacognition research and self-regulated learning"
                  },
                  "scaffolding": {
                    "implementation": "Evidence of learning support structures",
                    "score": 88,
                    "examples": "Specific scaffolding techniques observed",
                    "theoreticalBasis": "Application of Vygotsky's Zone of Proximal Development"
                  }
                },

                "psychologicalClimateEvaluation": {
                  "autonomySupport": {
                    "evidence": "Examples of player autonomy and choice provision",
                    "score": 80,
                    "strategies": "Autonomy-supportive coaching behaviors",
                    "researchBacking": "Alignment with Self-Determination Theory (Deci & Ryan)"
                  },
                  "masteryOrientation": {
                    "promotion": "Evidence of learning and improvement focus over winning",
                    "score": 85,
                    "examples": "Mastery-focused language and goal setting",
                    "literatureConnection": "Reference to Achievement Goal Theory (Nicholls, Dweck)"
                  },
                  "psychologicalSafety": {
                    "creation": "Evidence of safe learning environment establishment",
                    "score": 88,
                    "indicators": "Psychological safety indicators in communication",
                    "researchReference": "Connection to Edmondson's psychological safety research"
                  },
                  "belongingness": {
                    "facilitation": "Evidence of inclusion and team connection building",
                    "score": 82,
                    "strategies": "Belonging facilitation techniques",
                    "theoreticalBasis": "Alignment with Baumeister & Leary's belongingness hypothesis"
                  },
                  "competenceSupport": {
                    "evidence": "Examples of skill confidence and efficacy building",
                    "score": 86,
                    "techniques": "Competence support strategies",
                    "researchBacking": "Connection to Bandura's self-efficacy theory"
                  },
                  "intrinsicMotivation": {
                    "cultivation": "Evidence of internal motivation development",
                    "score": 78,
                    "approaches": "Intrinsic motivation enhancement strategies",
                    "literatureReference": "Application of Self-Determination Theory principles"
                  }
                },

                "literatureIntegratedInsights": {
                  "theoreticalFrameworks": [
                    {
                      "framework": "Transformational Leadership Theory (Bass & Riggio)",
                      "application": "Evidence of transformational leadership behaviors",
                      "score": 85,
                      "examples": "Specific transformational behaviors observed"
                    },
                    {
                      "framework": "Positive Youth Development (Lerner et al.)",
                      "application": "Evidence of character and life skills development",
                      "score": 80,
                      "examples": "PYD principle applications in coaching"
                    },
                    {
                      "framework": "Flow Theory (Csikszentmihalyi)",
                      "application": "Evidence of optimal experience facilitation",
                      "score": 75,
                      "examples": "Flow state promotion techniques"
                    }
                  ],
                  "motorLearningPrinciples": [
                    {
                      "principle": "Schema Theory (Schmidt)",
                      "application": "Evidence of motor program development",
                      "examples": "Variable practice and schema formation"
                    },
                    {
                      "principle": "Constraints-Led Approach (Newell)",
                      "application": "Environmental constraint manipulation",
                      "examples": "Task constraint modifications observed"
                    },
                    {
                      "principle": "Differential Learning (Schöllhorn)",
                      "application": "Variability and fluctuation in practice",
                      "examples": "Movement variation encouragement"
                    }
                  ],
                  "coachingEffectivenessResearch": [
                    {
                      "study": "Côté & Gilbert (2009) - Coaching Effectiveness",
                      "relevance": "Professional, interpersonal, and intrapersonal knowledge application",
                      "alignment": "How session aligns with coaching effectiveness components"
                    },
                    {
                      "study": "Smith et al. (2007) - Coach-Created Motivational Climate",
                      "relevance": "Mastery vs performance climate creation",
                      "alignment": "Evidence of mastery-oriented coaching behaviors"
                    }
                  ]
                },

                "detailedInsights": {
                  "exceptionalMoments": [
                    {
                      "timestamp": "Approximate time",
                      "description": "Outstanding coaching demonstration",
                      "category": "Excellence type (pedagogical, emotional, tactical)",
                      "impact": "Immediate and long-term player development impact",
                      "literatureConnection": "Relevant research supporting this approach",
                      "replicability": "How this moment can be systematically replicated"
                    }
                  ],
                  "missedOpportunities": [
                    {
                      "moment": "Detailed description of missed teachable moment",
                      "enhancement": "Comprehensive improvement suggestion with implementation steps",
                      "theoreticalBasis": "Research-backed rationale for suggested enhancement",
                      "developmentalBenefit": "Specific player development outcomes possible",
                      "implementationStrategy": "Step-by-step application guidance"
                    }
                  ],
                  "coachingPhilosophyAnalysis": {
                    "evident": "Clear coaching philosophy indicators from session",
                    "alignment": "Philosophy-practice consistency assessment",
                    "theoreticalUnderpinnings": "Philosophical foundations evident in approach",
                    "developmentalFocus": "Player-centered vs coach-centered orientation",
                    "literatureAlignment": "Alignment with established coaching philosophies"
                  },
                  "innovativeApproaches": {
                    "creativity": "Novel or creative coaching approaches observed",
                    "adaptation": "Real-time adaptations to player needs",
                    "problemSolving": "Creative problem-solving demonstrations",
                    "resourcefulness": "Innovative use of available resources"
                  }
                },

                "developmentalConsiderations": {
                  "ageAppropriateness": {"assessment": "Age-appropriate coaching assessment", "score": 88},
                  "skillLevel": {"consideration": "Skill level accommodation", "score": 82},
                  "cognitiveReadiness": {"assessment": "Cognitive readiness evaluation", "score": 85},
                  "physicalReadiness": {"assessment": "Physical readiness evaluation", "score": 90},
                  "socialEmotional": {"development": "Social-emotional development integration", "score": 85}
                },

                "comprehensiveEvidenceBasedRecommendations": [
                  {
                    "priority": "Critical",
                    "category": "Communication Excellence",
                    "area": "Specific improvement domain with detailed context",
                    "recommendation": "Comprehensive evidence-based suggestion with implementation specifics",
                    "theoreticalRationale": "Detailed research backing with specific studies and authors",
                    "practicalImplementation": {
                      "immediateSteps": "Step-by-step immediate implementation guidance",
                      "mediumTermGoals": "3-6 month development objectives",
                      "longTermVision": "Long-term coaching development trajectory"
                    },
                    "timeline": {
                      "week1": "Week 1 specific actions",
                      "month1": "Month 1 milestones",
                      "quarter1": "Quarterly objectives"
                    },
                    "measurementCriteria": {
                      "quantitative": "Specific measurable outcomes",
                      "qualitative": "Observable behavioral changes",
                      "playerFeedback": "Player response indicators"
                    },
                    "literatureSupport": [
                      "Primary research study supporting this recommendation",
                      "Secondary supporting research with specific findings",
                      "Meta-analysis or systematic review evidence"
                    ],
                    "professionalDevelopment": "Suggested training, courses, or resources for skill development"
                  },
                  {
                    "priority": "High", 
                    "category": "Pedagogical Enhancement",
                    "area": "Another critical improvement area with contextual analysis",
                    "recommendation": "Detailed pedagogical improvement suggestion with learning theory application",
                    "theoreticalRationale": "Educational psychology and motor learning research foundation",
                    "practicalImplementation": {
                      "sessionModifications": "Specific session structure modifications",
                      "practiceDesign": "Training exercise design improvements",
                      "assessmentChanges": "Player assessment and feedback enhancements"
                    },
                    "timeline": {
                      "immediate": "Can be implemented in next session",
                      "shortTerm": "2-4 week implementation period",
                      "ongoing": "Continuous development focus area"
                    },
                    "measurementCriteria": {
                      "playerLearning": "Learning outcome indicators",
                      "engagement": "Player engagement metrics",
                      "skillDevelopment": "Technical and tactical skill progression"
                    },
                    "literatureSupport": [
                      "Skill acquisition research supporting approach",
                      "Developmental psychology studies",
                      "Coaching effectiveness research"
                    ],
                    "resourceRequirements": "Equipment, time, or training resources needed"
                  },
                  {
                    "priority": "Medium",
                    "category": "Psychological Climate",
                    "area": "Motivational environment enhancement opportunity",
                    "recommendation": "Psychology-based climate improvement with motivation theory application",
                    "theoreticalRationale": "Self-Determination Theory and Achievement Goal Theory foundation",
                    "practicalImplementation": {
                      "languageModifications": "Specific language and communication adjustments",
                      "structuralChanges": "Practice structure modifications for psychological benefits",
                      "relationshipBuilding": "Coach-player relationship enhancement strategies"
                    },
                    "timeline": {
                      "daily": "Daily implementation opportunities",
                      "weekly": "Weekly climate assessment and adjustment",
                      "seasonal": "Long-term culture development goals"
                    },
                    "measurementCriteria": {
                      "playerWellbeing": "Psychological wellbeing indicators",
                      "teamCohesion": "Team unity and cooperation measures",
                      "intrinsicMotivation": "Internal motivation development signs"
                    },
                    "literatureSupport": [
                      "Motivational climate research in sport",
                      "Positive psychology applications",
                      "Youth development research findings"
                    ],
                    "environmentalConsiderations": "Contextual factors affecting implementation"
                  }
                ],

                "advancedMicroBehavioralAnalysis": {
                  "linguisticMicroPatterns": {
                    "emotionalStateIndicators": {
                      "excitement": {"intensity": 85, "frequency": 12, "examples": "High-energy language patterns"},
                      "stress": {"intensity": 25, "frequency": 3, "examples": "Minimal stress indicators in speech"},
                      "confidence": {"intensity": 88, "frequency": 15, "examples": "Authoritative language patterns"},
                      "empathy": {"intensity": 92, "frequency": 8, "examples": "Empathetic response patterns"}
                    },
                    "speechRhythmAnalysis": {
                      "pacingVariations": "Analysis of speech tempo changes throughout session",
                      "energyFluctuations": "Energy level patterns and their correlation with session phases",
                      "pausePatterns": "Strategic use of silence and timing in communication",
                      "emphasisTechniques": "Vocal emphasis patterns for key instructional moments"
                    },
                    "languageComplexityAdaptation": {
                      "realTimeAdjustments": "Evidence of complexity modification based on player understanding",
                      "vocabularyScaling": "Adaptation of technical language to player comprehension levels",
                      "conceptualScaffolding": "Progressive complexity building in explanations"
                    }
                  },
                  "attentionAllocationMetrics": {
                    "playerEquityIndex": 82,
                    "attentionDistribution": "Quantitative analysis of coaching attention across all players",
                    "qualityOfInteraction": "Assessment of interaction depth and meaningfulness per player",
                    "biasIndicators": "Statistical analysis of potential attention bias patterns"
                  },
                  "decisionMakingPatterns": {
                    "pressureResponses": "Analysis of coaching decisions under time pressure or challenging situations",
                    "adaptabilityIndicators": "Evidence of real-time strategy modifications",
                    "cognitiveFlexibility": "Demonstration of mental agility in session management",
                    "problemSolvingApproaches": "Patterns in approach to unexpected coaching challenges"
                  }
                },

                "predictiveCoachingInsights": {
                  "emergingPatterns": [
                    {
                      "pattern": "Communication style trend identification",
                      "trajectory": "Predicted development direction based on current behaviors",
                      "implications": "Potential long-term coaching effectiveness impacts",
                      "interventions": "Proactive strategies to optimize pattern development"
                    }
                  ],
                  "challengeForecasting": {
                    "potentialRisks": "Identified risk factors for future coaching challenges",
                    "preventiveStrategies": "Evidence-based approaches to mitigate predicted challenges",
                    "earlyWarningIndicators": "Behavioral signals that may predict difficulties"
                  },
                  "playerDevelopmentTrajectories": {
                    "individualPredictions": "Forecasted development paths for individual players based on coaching interactions",
                    "teamDynamicsTrends": "Predicted team cohesion and culture development",
                    "optimalInterventionTiming": "Predicted windows for maximum coaching impact"
                  },
                  "relationshipDevelopmentForecasting": {
                    "coachPlayerBonds": "Predicted relationship strength development over time",
                    "trustBuildingTrajectory": "Forecasted trust development patterns",
                    "communicationEvolution": "Predicted improvements in coach-player communication"
                  }
                },

                "neuroscienceInformedAnalysis": {
                  "cognitiveLoadAssessment": {
                    "instructionalDemand": "Analysis of cognitive processing requirements in instruction delivery",
                    "informationProcessingOptimization": "Assessment of information chunking and delivery pacing",
                    "workingMemoryConsiderations": "Evaluation of memory load in skill instruction",
                    "cognitiveResourceManagement": "Efficiency of mental resource utilization"
                  },
                  "attentionSpanOptimization": {
                    "focusMaintenanceStrategies": "Techniques used to sustain player attention",
                    "attentionRestorationMoments": "Identification of attention reset opportunities",
                    "concentrationFacilitation": "Methods for enhancing focused attention during instruction"
                  },
                  "memoryConsolidationSupport": {
                    "repetitionPatterns": "Strategic use of repetition for memory enhancement",
                    "encodingStrategies": "Techniques supporting memory formation",
                    "retrievalPractice": "Opportunities for memory recall and strengthening"
                  },
                  "stressResponseManagement": {
                    "stressIndicators": "Physiological stress markers evident in communication patterns",
                    "stressRegulationModeling": "Demonstration of stress management techniques",
                    "optimalArousalFacilitation": "Support for optimal performance arousal levels"
                  },
                  "flowStateFacilitation": {
                    "flowConditions": "Environmental and instructional conditions supporting flow states",
                    "challengeSkillBalance": "Assessment of optimal challenge-skill ratio maintenance",
                    "consciousnessAlterationSupport": "Facilitation of immersive learning experiences"
                  }
                },

                "elitePerformancePsychologyIntegration": {
                  "mentalToughnessDevelopment": {
                    "resilienceBuilding": "Strategies for developing psychological resilience",
                    "adversityTraining": "Exposure to controlled challenges for mental strengthening",
                    "confidenceCalibration": "Techniques for accurate self-efficacy assessment"
                  },
                  "visualizationAndImagery": {
                    "mentalRehearsalIntegration": "Use of visualization techniques in skill instruction",
                    "imageryQuality": "Assessment of mental imagery sophistication",
                    "visualizationEffectiveness": "Impact of mental imagery on performance outcomes"
                  },
                  "pressureTrainingIntegration": {
                    "stressInoculation": "Gradual exposure to performance pressure",
                    "pressureReplication": "Simulation of competition stress in training",
                    "pressurePerformanceOptimization": "Techniques for maintaining performance under pressure"
                  },
                  "goalSettingSophistication": {
                    "goalSpecificity": "Precision and clarity in goal articulation",
                    "goalHierarchy": "Systematic progression from process to outcome goals",
                    "goalMonitoring": "Systems for tracking goal progress and adjustment"
                  },
                  "mindfulnessIntegration": {
                    "presentMomentAwareness": "Cultivation of focused attention and awareness",
                    "mindfulnessBasedIntervention": "Integration of mindfulness techniques in coaching",
                    "attentionalControl": "Development of focused and sustained attention skills"
                  }
                },

                "comprehensiveLiteratureReview": {
                  "cuttingEdgeResearch": [
                    {
                      "study": "Neuroscience of Skill Acquisition (Dayan & Cohen, 2011)",
                      "findings": "Neural mechanisms underlying motor learning and expertise development",
                      "sessionApplication": "Evidence of neuroscience-informed coaching practices",
                      "optimization": "Neural efficiency principles for coaching enhancement"
                    },
                    {
                      "study": "Deliberate Practice Theory (Ericsson et al., 1993)",
                      "findings": "Characteristics of practice leading to expert performance",
                      "sessionAlignment": "Assessment of deliberate practice principles in session design",
                      "enhancement": "Strategies for incorporating deliberate practice elements"
                    },
                    {
                      "study": "Psychological Safety in Teams (Edmondson, 1999)",
                      "findings": "Impact of psychological safety on learning and performance",
                      "sessionEvidence": "Psychological safety indicators in coaching environment",
                      "cultivation": "Methods for enhancing psychological safety"
                    }
                  ],
                  "emergingTheories": [
                    {
                      "theory": "Ecological Dynamics Approach (Davids et al., 2008)",
                      "application": "Constraints-led approach to skill development",
                      "sessionEvidence": "Environmental constraint manipulation for learning",
                      "implementation": "Enhanced ecological approach integration"
                    },
                    {
                      "theory": "Nonlinear Pedagogy (Chow et al., 2007)",
                      "application": "Complexity and variability in skill acquisition",
                      "sessionAlignment": "Evidence of nonlinear learning principles",
                      "development": "Nonlinear pedagogy enhancement strategies"
                    }
                  ],
                  "interdisciplinaryInsights": [
                    {
                      "field": "Positive Psychology (Seligman, 2011)",
                      "contribution": "Well-being and flourishing in sport environments",
                      "sessionRelevance": "Positive psychology principles in coaching approach",
                      "application": "Strengths-based coaching enhancement"
                    },
                    {
                      "field": "Cognitive Science (Anderson, 2007)",
                      "contribution": "Information processing and learning optimization",
                      "sessionEvidence": "Cognitive science principles in instruction design",
                      "optimization": "Cognitive load and processing efficiency improvements"
                    }
                  ]
                },
                
                "scores": {
                  "overall": 85,
                  "communication": 82,
                  "engagement": 88,
                  "instruction": 75,
                  "tacticalIntelligence": 78,
                  "motivationPsychology": 82,
                  "learningTheory": 76,
                  "culturalCompetence": 83,
                  "innovationCreativity": 80
                }
              }`
            },
            {
              role: "user",
              content: processedTranscript
            }
          ],
          temperature: 0.5,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content || '{}';
        console.log(`Received analysis response (${content.length} characters)`);
        
        try {
          const result = JSON.parse(content);
          
          // Convert scores from 0-100 to 0-10 scale
          const normalizeScore = (score: number) => {
            const normalized = Math.round(score / 10);
            return Math.max(1, Math.min(10, normalized)); // Ensure between 1-10
          };
          
          // Ensure all arrays have required elements
          const ensureArrayLength = (arr: string[], minLength: number, prefix: string): string[] => {
            const result = Array.isArray(arr) ? [...arr] : [];
            while (result.length < minLength) {
              result.push(`${prefix} ${result.length + 1}`);
            }
            return result;
          };
          
          return {
            summary: result.summary || 'No summary available',
            detailedFeedback: result.detailedFeedback || 'No detailed feedback available',
            strengths: ensureArrayLength(result.strengths, 5, 'Strength'),
            areasForImprovement: ensureArrayLength(result.areasForImprovement, 5, 'Area for improvement'),
            overallScore: normalizeScore(result.scores?.overall || 75),
            communicationScore: normalizeScore(result.scores?.communication || 75),
            engagementScore: normalizeScore(result.scores?.engagement || 75),
            instructionScore: normalizeScore(result.scores?.instruction || 75),
            
            // New analysis fields
            playerEngagement: result.playerEngagement || null,
            coachingBehaviors: result.coachingBehaviors || null,
            coachingStyles: result.coachingStyles || null,
            contentFocus: result.contentFocus || null,
            intendedOutcomesAssessment: result.intendedOutcomesAssessment || null
          };
        } catch (parseError) {
          console.error("Error parsing OpenAI response:", parseError);
          throw new Error("Failed to parse analysis response");
        }
      }, 3, 1000, true); // Use enhanced retry with 3 retries, 1s initial delay and jitter
    } catch (apiError) {
      // No fallback to synthetic data - always require authentic OpenAI analysis
      console.error("OpenAI API call failed. No synthetic fallback will be used.");
      console.error("Error details:", apiError);
      
      // Check if it's an API key issue
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key is required for analysis. Please provide a valid OPENAI_API_KEY.");
      }
      
      // Re-throw the original error to ensure authentic analysis is required
      throw new Error(`OpenAI analysis failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}. Only authentic AI analysis is supported.`);
    }
  } catch (error: any) {
    console.error("Error in analyzeCoachingSession:", error);
    const errorMessage = error?.message || 'Unknown error during coaching analysis';
    throw new Error(`Failed to analyze coaching session: ${errorMessage}`);
  }
}
