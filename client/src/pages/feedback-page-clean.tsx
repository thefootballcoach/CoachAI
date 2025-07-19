import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Clock, Users, Brain, Target, HelpCircle, 
  Volume2, Star, BookOpen, Hash, Timer, CheckCircle2, Award, TrendingUp, FileText
} from "lucide-react";
import { Video, Feedback } from "@shared/schema";
import SelfReflection from "@/components/dashboard/self-reflection";
import MediaPlayer from "@/components/dashboard/media-player";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const videoId = parseInt(id);

  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<Video>({
    queryKey: [`/api/audios/${videoId}`],
    enabled: !!videoId,
    retry: 1,
  });

  const { data: feedback, isLoading: feedbackLoading, error: feedbackError } = useQuery<Feedback>({
    queryKey: [`/api/audios/${videoId}/feedback`],
    enabled: !!videoId,
    retry: 1,
  });
  
  useEffect(() => {
    if (videoError) {
      console.error("Error fetching video:", videoError);
      toast({
        title: "Error loading video",
        description: videoError instanceof Error ? videoError.message : "Could not load video details",
        variant: "destructive",
      });
    }
    
    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError);
      toast({
        title: "Error loading feedback",
        description: feedbackError instanceof Error ? feedbackError.message : "Could not load feedback details",
        variant: "destructive",
      });
    }
  }, [videoError, feedbackError, toast]);

  if (videoLoading || feedbackLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis results...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!video || !feedback) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No analysis data found for this session.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Parse strengths and improvements safely
  let strengths = [];
  try {
    strengths = typeof feedback.strengths === 'string' && feedback.strengths
      ? JSON.parse(feedback.strengths as string) 
      : (feedback.strengths || []);
  } catch (error) {
    console.error("Error parsing strengths:", error);
    strengths = [];
  }
  
  let improvements = [];
  try {
    improvements = typeof feedback.improvements === 'string' && feedback.improvements
      ? JSON.parse(feedback.improvements as string) 
      : (feedback.improvements || []);
  } catch (error) {
    console.error("Error parsing improvements:", error);
    improvements = [];
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        {/* Elite Header Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center mb-6 lg:mb-0">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl mr-4 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                    {video.title}
                  </h1>
                  <p className="text-slate-400 mt-1 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')} minutes` : 'Duration unknown'} • 
                    <span className="ml-1">
                      {feedback.createdAt 
                        ? `Analyzed ${new Date(String(feedback.createdAt)).toLocaleDateString()}` 
                        : 'Recently processed'}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Performance Score Badge */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl font-black text-cyan-400 mb-1">{feedback.overallScore}</div>
                  <div className="text-sm text-slate-300 font-medium">Performance Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 -mt-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Media Player */}
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Session Recording
                  </h2>
                </div>
                <div className="p-8">
                  <MediaPlayer video={video} />
                </div>
              </div>
            </div>

            {/* Comprehensive Analysis Tabs */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  AI Analysis Results
                </h2>
              </div>
              
              <div className="p-8">
                <Tabs defaultValue="key-info" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 bg-slate-100/80 rounded-2xl p-2 mb-8">
                    <TabsTrigger value="key-info" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Key Info
                    </TabsTrigger>
                    <TabsTrigger value="questioning" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Questioning
                    </TabsTrigger>
                    <TabsTrigger value="language" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Language
                    </TabsTrigger>
                    <TabsTrigger value="behaviours" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Behaviours
                    </TabsTrigger>
                    <TabsTrigger value="engagement" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Engagement
                    </TabsTrigger>
                    <TabsTrigger value="outcomes" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Outcomes
                    </TabsTrigger>
                  </TabsList>

                  {/* Key Info Tab */}
                  <TabsContent value="key-info" className="mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Timer className="w-5 h-5 mr-2 text-cyan-600" />
                            Session Statistics
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-3xl font-black text-cyan-600">
                                {feedback.transcription ? feedback.transcription.split(' ').length : 0}
                              </div>
                              <div className="text-sm text-slate-600">Total Words</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-blue-600">
                                {video.duration && feedback.transcription 
                                  ? Math.round((feedback.transcription.split(' ').length / (video.duration / 60))) 
                                  : 0}
                              </div>
                              <div className="text-sm text-slate-600">Words/Min</div>
                            </div>
                          </div>
                          <div className="mt-4 text-center">
                            <div className="text-lg font-semibold text-slate-700">Analysis Complete</div>
                            <div className="text-sm text-slate-500">Session processed with AI insights</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-600" />
                          Player Analysis
                        </h3>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                          {feedback.keyInfo && feedback.keyInfo.playerNamesIdentified ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="text-3xl font-black text-green-600">
                                  {feedback.keyInfo.playerNamesIdentified.length}
                                </div>
                                <div className="text-sm text-slate-600">Players Named</div>
                              </div>
                              
                              <div className="mt-4">
                                <h4 className="font-semibold text-slate-800 mb-2">Individual Attention:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {feedback.keyInfo.playerNamesIdentified.map((name: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-white/70 rounded-full text-sm font-medium text-green-700 border border-green-200">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="text-center bg-white/50 rounded-lg p-3">
                                  <div className="text-xl font-bold text-slate-700">
                                    {feedback.keyInfo.positiveLanguageCount || 0}
                                  </div>
                                  <div className="text-xs text-slate-600">Positive Words</div>
                                </div>
                                <div className="text-center bg-white/50 rounded-lg p-3">
                                  <div className="text-xl font-bold text-slate-700">
                                    {feedback.keyInfo.instructionalCommands || 0}
                                  </div>
                                  <div className="text-xs text-slate-600">Instructions</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-600">
                              Player analysis data not available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Questioning Tab */}
                  <TabsContent value="questioning" className="mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
                            Question Analysis
                          </h3>
                          <div className="text-center mb-6">
                            <div className="text-4xl font-black text-purple-600">
                              {feedback.questioning?.totalQuestions || (feedback.transcription ? (feedback.transcription.match(/\?/g) || []).length : 0)}
                            </div>
                            <div className="text-sm text-slate-600">Questions Detected</div>
                          </div>
                          
                          {feedback.questioning ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center bg-white/50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-purple-700">
                                    {feedback.questioning.engagementQuestions || 0}
                                  </div>
                                  <div className="text-xs text-slate-600">Engagement</div>
                                </div>
                                <div className="text-center bg-white/50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-purple-700">
                                    {feedback.questioning.clarifyingQuestions || 0}
                                  </div>
                                  <div className="text-xs text-slate-600">Clarifying</div>
                                </div>
                              </div>
                              
                              {feedback.questioning.questionTypes && feedback.questioning.questionTypes.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="font-semibold text-slate-800 mb-2">Question Types:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {feedback.questioning.questionTypes.map((type: string, index: number) => (
                                      <span key={index} className="px-3 py-1 bg-white/70 rounded-full text-sm font-medium text-purple-700 border border-purple-200">
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white/70 rounded-xl p-4">
                              <p className="text-slate-600 text-sm">
                                Question analysis data not available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                          Research Insights
                        </h3>
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200/50">
                          {feedback.questioning?.totalQuestions && feedback.questioning.totalQuestions > 0 ? (
                            <div className="space-y-4">
                              <p className="text-slate-700 leading-relaxed">
                                Your questioning shows {feedback.questioning.totalQuestions > 20 ? 'excellent' : feedback.questioning.totalQuestions > 10 ? 'good' : 'developing'} engagement patterns. 
                                {feedback.questioning.engagementQuestions > feedback.questioning.clarifyingQuestions 
                                  ? ' You focus well on player engagement through questioning.' 
                                  : ' Consider increasing engagement-focused questions.'}
                              </p>
                              
                              <div className="bg-white/70 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">Research Insight:</h4>
                                <p className="text-slate-600 text-sm">
                                  Effective coaches ask 15-25 questions per session. Your {feedback.questioning.totalQuestions} questions demonstrate 
                                  {feedback.questioning.totalQuestions >= 15 ? ' strong' : ' developing'} questioning technique.
                                </p>
                              </div>
                              
                              <div className="bg-white/70 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">Development Focus:</h4>
                                <p className="text-slate-600 text-sm">
                                  {feedback.questioning.totalQuestions < 15 
                                    ? 'Increase question frequency to enhance player thinking and engagement'
                                    : 'Maintain current questioning approach while exploring different question types'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-slate-700 leading-relaxed">
                                Question analysis data not available for this session
                              </p>
                              
                              <div className="bg-white/70 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-800 mb-2">Development Focus:</h4>
                                <p className="text-slate-600 text-sm">
                                  Effective questioning enhances player learning and engagement
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Language Tab */}
                  <TabsContent value="language" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600 mb-4">Language Communication Analysis</div>
                      <p className="text-slate-500">
                        Comprehensive assessment of clarity, specificity, and age-appropriate communication patterns will be displayed here
                      </p>
                    </div>
                  </TabsContent>

                  {/* Behaviours Tab */}
                  <TabsContent value="behaviours" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600 mb-4">Coach Behaviour Assessment</div>
                      <p className="text-slate-500">
                        Analysis of interpersonal skills, professional competencies, and technical coaching abilities
                      </p>
                    </div>
                  </TabsContent>

                  {/* Engagement Tab */}
                  <TabsContent value="engagement" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600 mb-4">Player Engagement Metrics</div>
                      <p className="text-slate-500">
                        Coaching style analysis with personalization tracking and player interaction assessment
                      </p>
                    </div>
                  </TabsContent>

                  {/* Outcomes Tab */}
                  <TabsContent value="outcomes" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600 mb-4">Intended Outcomes Assessment</div>
                      <p className="text-slate-500">
                        Coaching framework analysis evaluating Why, What, How, and Who components with outcome alignment scoring
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Summary Section */}
            <div className="mt-8">
              <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    Session Summary
                  </h2>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                        Key Strengths
                      </h3>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                        {strengths.length > 0 ? (
                          <ul className="space-y-3">
                            {strengths.map((strength: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500">AI analysis will identify key coaching strengths</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                        Areas for Development
                      </h3>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200/50">
                        {improvements.length > 0 ? (
                          <ul className="space-y-3">
                            {improvements.map((improvement: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <TrendingUp className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-500">AI analysis will suggest development opportunities</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Self Reflection Section */}
            <div className="mt-8">
              <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Self Reflection
                  </h2>
                </div>
                
                <div className="p-8">
                  <SelfReflection />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}