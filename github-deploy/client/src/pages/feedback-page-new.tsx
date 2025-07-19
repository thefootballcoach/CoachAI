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
import { getAudio, getFeedbackByAudioId } from "@/lib/storage";
import SelfReflection from "@/components/dashboard/self-reflection";
import MediaPlayer from "@/components/dashboard/media-player";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const videoId = parseInt(id);

  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<Video>({
    queryKey: [`/api/audios/${videoId}`],
    queryFn: () => getAudio(videoId),
    retry: 1,
  });

  const { data: feedback, isLoading: feedbackLoading, error: feedbackError } = useQuery<Feedback>({
    queryKey: [`/api/audios/${videoId}/feedback`],
    queryFn: () => getFeedbackByAudioId(videoId),
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
                              <div className="text-3xl font-black text-cyan-600">{(feedback as any).keyInfo?.totalWords || 0}</div>
                              <div className="text-sm text-slate-600">Total Words</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-blue-600">{(feedback as any).keyInfo?.wordsPerMinute || 0}</div>
                              <div className="text-sm text-slate-600">Words/Min</div>
                            </div>
                          </div>
                          <div className="mt-4 text-center">
                            <div className="text-lg font-semibold text-slate-700">{(feedback as any).keyInfo?.talkingToSilenceRatio || "Not calculated"}</div>
                            <div className="text-sm text-slate-500">Talking to Silence Ratio</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-green-600" />
                          Player Mentions
                        </h3>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                          {(feedback as any).keyInfo?.playersmentioned && (feedback as any).keyInfo.playersmentioned.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={(feedback as any).keyInfo.playersmentioned}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fontSize: 12, fill: '#64748b' }}
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'white', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                  }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="text-center py-8 text-slate-500">
                              No player mentions detected in this session
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
                            <div className="text-4xl font-black text-purple-600">{(feedback as any).questioning?.totalQuestions || 0}</div>
                            <div className="text-sm text-slate-600">Total Questions Asked</div>
                          </div>
                          
                          {(feedback as any).questioning?.questionTypes && (feedback as any).questioning.questionTypes.length > 0 && (
                            <div className="space-y-3">
                              {(feedback as any).questioning.questionTypes.map((qType: any, index: number) => (
                                <div key={index} className="flex justify-between items-center bg-white/70 rounded-xl p-3">
                                  <span className="font-medium text-slate-700">{qType.type}</span>
                                  <div className="text-right">
                                    <div className="font-bold text-purple-600">{qType.count}</div>
                                    <div className="text-xs text-slate-500">{qType.impact}</div>
                                  </div>
                                </div>
                              ))}
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
                          <p className="text-slate-700 leading-relaxed mb-4">
                            {(feedback as any).questioning?.researchInsights || "Research insights will be provided based on questioning patterns"}
                          </p>
                          
                          {(feedback as any).questioning?.developmentAreas && (feedback as any).questioning.developmentAreas.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-slate-800 mb-3">Development Areas:</h4>
                              <ul className="space-y-2">
                                {(feedback as any).questioning.developmentAreas.map((area: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <TrendingUp className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-600">{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Placeholder for other tabs - Language, Behaviours, Engagement, Outcomes */}
                  <TabsContent value="language" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600">Language analysis will display comprehensive clarity, specificity, and age-appropriateness metrics</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="behaviours" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600">Coach behaviour analysis including interpersonal, professional, and technical skills assessment</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="engagement" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600">Player engagement metrics with coaching style analysis and personalization tracking</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="outcomes" className="mt-8">
                    <div className="text-center py-12">
                      <div className="text-lg text-slate-600">Intended outcomes assessment with coaching framework (Why, What, How, Who) analysis</div>
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
                          <p className="text-slate-500">Strengths will be identified from the analysis</p>
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
                          <p className="text-slate-500">Development areas will be identified from the analysis</p>
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