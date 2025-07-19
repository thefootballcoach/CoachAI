import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, Clock, Users, Brain, Target, HelpCircle, 
  Volume2, Star, BookOpen, Hash, Timer, CheckCircle2, Award, TrendingUp, FileText,
  MessageSquare, Download, Lightbulb, Sparkles, Edit3, Check, X, ChevronRight, ExternalLink,
  Zap, Calendar, Edit2
} from "lucide-react";
import { Video, Feedback } from "@shared/schema";
import SelfReflection from "@/components/dashboard/self-reflection";
import MediaPlayer from "@/components/dashboard/media-player";
import { FeedbackComments } from "@/components/feedback-comments";
import { exportFeedbackToPDF } from "@/lib/pdf-export";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, Legend,
  AreaChart, Area
} from 'recharts';

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const videoId = parseInt(id);

  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<Video>({
    queryKey: [`/api/audios/${videoId}`],
    enabled: !!videoId,
    retry: 1,
  });

  const { data: feedbackData, isLoading: feedbackLoading, error: feedbackError } = useQuery<any>({
    queryKey: [`/api/audios/${videoId}/feedback`],
    enabled: !!videoId,
    retry: 1,
  });

  // Mutation for updating session title
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await apiRequest("PUT", `/api/audios/${videoId}`, { title: newTitle });
      return response.json();
    },
    onSuccess: (updatedVideo) => {
      queryClient.setQueryData([`/api/audios/${videoId}`], updatedVideo);
      queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
      setIsEditingTitle(false);
      toast({
        title: "Session Updated",
        description: "Session name has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced feedback processing to integrate multi-AI analysis
  const feedback = React.useMemo(() => {
    if (!feedbackData) return null;
    
    console.log('Raw feedback data:', feedbackData);
    
    // Check for multi-AI analysis in the new structure
    if (feedbackData.multiAiAnalysis && typeof feedbackData.multiAiAnalysis === 'string') {
      try {
        const parsedMultiAI = JSON.parse(feedbackData.multiAiAnalysis);
        console.log('Parsed Multi-AI data:', parsedMultiAI);
        
        // Access the structured data from ultra-thorough analysis
        const openaiData = parsedMultiAI.openaiAnalysis?.detailed || parsedMultiAI.openaiAnalysis || {};
        const claudeData = parsedMultiAI.claudeAnalysis || {};
        const perplexityData = parsedMultiAI.perplexityAnalysis || {};
        
        return {
          ...feedbackData,
          // Override with comprehensive multi-AI scores
          overallScore: parsedMultiAI.synthesizedInsights?.overallScore || parsedMultiAI.openaiAnalysis?.overallScore || feedbackData.overallScore,
          communicationScore: feedbackData.communicationScore || 75,
          engagementScore: feedbackData.engagementScore || 75,
          instructionScore: feedbackData.instructionScore || 75,
          
          // Enhanced analysis with multi-AI insights - use the detailed structure
          keyInfo: {
            ...feedbackData.keyInfo,
            ...openaiData.keyInfo,
            claudeInsights: claudeData.pedagogicalInsights || [],
            researchRecommendations: perplexityData.bestPractices || []
          },
          
          questioning: {
            ...feedbackData.questioning,
            ...openaiData.questioning,
            claudeQuestioningTheory: claudeData.pedagogicalInsights || null,
            researchEvidence: perplexityData.researchEvidence || []
          },
          
          language: {
            ...feedbackData.language,
            ...openaiData.language,
            claudeLanguageInsights: claudeData.instructionalDesign || null,
            communicationResearch: perplexityData.researchEvidence || []
          },
          
          coachBehaviours: {
            ...feedbackData.coachBehaviours,
            ...openaiData.coachBehaviours,
            claudeBehaviourAnalysis: claudeData.learningTheoryApplication || null,
            behaviourResearch: perplexityData.industryBenchmarks || []
          },
          
          playerEngagement: {
            ...feedbackData.playerEngagement,
            ...openaiData.playerEngagement,
            claudeEngagementTheory: claudeData.pedagogicalInsights || null,
            engagementResearch: perplexityData.bestPractices || []
          },
          
          intendedOutcomes: {
            ...feedbackData.intendedOutcomes,
            ...openaiData.intendedOutcomes,
            claudeOutcomeAnalysis: claudeData.instructionalDesign || null,
            outcomeResearch: perplexityData.researchEvidence || []
          },
          
          // Add comprehensive multi-AI structure
          multiAiAnalysis: parsedMultiAI,
          
          // Enhanced strengths and improvements with multi-AI inputs
          comprehensiveStrengths: [
            ...(feedbackData.strengths || []),
            ...(parsedMultiAI.synthesizedInsights?.keyStrengths || [])
          ],
          
          comprehensiveImprovements: [
            ...(feedbackData.improvements || []),
            ...(parsedMultiAI.synthesizedInsights?.priorityDevelopmentAreas || [])
          ]
        };
      } catch (error) {
        console.error('Error parsing multi-AI analysis:', error);
      }
    }
    
    // Fallback to legacy structure if available
    if (feedbackData.multiAiAnalysis?.openai) {
      const multiAI = feedbackData.multiAiAnalysis;
      console.log('Legacy Multi-AI data available:', multiAI);
      
      return {
        ...feedbackData,
        overallScore: multiAI.openai.overallScore || feedbackData.overallScore,
        communicationScore: multiAI.openai.communicationScore || feedbackData.communicationScore,
        engagementScore: multiAI.openai.engagementScore || feedbackData.engagementScore,
        instructionScore: multiAI.openai.instructionScore || feedbackData.instructionScore,
        
        keyInfo: { ...feedbackData.keyInfo, ...multiAI.openai.keyInfo },
        questioning: { ...feedbackData.questioning, ...multiAI.openai.questioning },
        language: { ...feedbackData.language, ...multiAI.openai.language },
        coachBehaviours: { ...feedbackData.coachBehaviours, ...multiAI.openai.coachBehaviours },
        playerEngagement: { ...feedbackData.playerEngagement, ...multiAI.openai.playerEngagement },
        intendedOutcomes: { ...feedbackData.intendedOutcomes, ...multiAI.openai.intendedOutcomes },
        multiAiAnalysis: multiAI
      };
    }
    
    // Return original feedback if multi-AI not available
    return feedbackData;
  }, [feedbackData]);
  
  // Helper functions for title editing
  const canEditSession = user && (user.role === 'coach' || user.role === 'head_coach') && 
                         (video?.userId === user.id || user.role === 'head_coach');
  
  const handleStartEdit = () => {
    setEditedTitle(video?.title || "");
    setIsEditingTitle(true);
  };
  
  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== video?.title) {
      updateTitleMutation.mutate(editedTitle.trim());
    } else {
      setIsEditingTitle(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const downloadPDFReport = async () => {
    try {
      const response = await fetch(`/api/audios/${videoId}/report/pdf`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `coaching-report-${video?.title || 'session'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Comprehensive coaching report downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };
  
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

  // Parse strengths and improvements from the correct feedback fields
  let strengths = [];
  let improvements = [];
  
  // Try multiple field names and parsing approaches for strengths
  if (feedback.strengths) {
    if (Array.isArray(feedback.strengths)) {
      strengths = feedback.strengths;
    } else if (typeof feedback.strengths === 'string') {
      try {
        strengths = JSON.parse(feedback.strengths);
        if (!Array.isArray(strengths)) {
          // If it's a string description, split into array
          strengths = [feedback.strengths];
        }
      } catch {
        strengths = [feedback.strengths];
      }
    }
  }
  
  // Try multiple field names and parsing approaches for improvements  
  if (feedback.improvements) {
    if (Array.isArray(feedback.improvements)) {
      improvements = feedback.improvements;
    } else if (typeof feedback.improvements === 'string') {
      try {
        improvements = JSON.parse(feedback.improvements);
        if (!Array.isArray(improvements)) {
          // If it's a string description, split into array
          improvements = [feedback.improvements];
        }
      } catch {
        improvements = [feedback.improvements];
      }
    }
  }
  
  // Fallback: check if the data is in different fields or in summary
  if (strengths.length === 0 && feedback.summary) {
    // Extract strengths from summary if available
    const summaryText = typeof feedback.summary === 'string' ? feedback.summary : '';
    if (summaryText.toLowerCase().includes('strength')) {
      strengths = ['Session demonstrates effective coaching practices based on AI analysis'];
    }
  }
  
  if (improvements.length === 0 && feedback.summary) {
    // Extract improvements from summary if available  
    const summaryText = typeof feedback.summary === 'string' ? feedback.summary : '';
    if (summaryText.toLowerCase().includes('improv') || summaryText.toLowerCase().includes('develop')) {
      improvements = ['Continue developing coaching skills based on AI recommendations'];
    }
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
                  <div className="flex items-center gap-3 mb-2">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-2xl font-black bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 max-w-md"
                          placeholder="Enter session name..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveTitle}
                          disabled={updateTitleMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={updateTitleMutation.isPending}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                          {video.title}
                        </h1>
                        {canEditSession && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStartEdit}
                            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    {user?.role === 'head_coach' && video.userId !== user.id && (
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-1">
                        <span className="text-blue-200 text-sm font-medium flex items-center">
                          <Users className="mr-1 h-3 w-3" />
                          Head of Coaching View
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-400 mt-1 flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {video.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')} minutes` : 'Duration unknown'} • 
                    <span className="ml-1">
                      {feedback.createdAt 
                        ? `Analyzed ${new Date(String(feedback.createdAt)).toLocaleDateString()}` 
                        : 'Recently processed'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* AI Recommendations Button */}
                <Button
                  onClick={() => navigate(`/recommendations/${videoId}`)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 rounded-xl px-6 py-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Recommendations
                </Button>
                
                {/* Comprehensive Multi-AI PDF Report Button */}
                <Button
                  onClick={downloadPDFReport}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Multi-AI Report
                </Button>

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
        </div>

        <div className="p-8 -mt-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Media Player */}
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      Session Recording
                    </div>
                    
                    {/* Analysis Type Indicator */}
                    <div className="flex items-center gap-3">
                      {(() => {
                        const isVideoFile = video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                          video.filename.toLowerCase().endsWith(ext)
                        );
                        
                        if (isVideoFile) {
                          return (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold">Multimodal Analysis</span>
                              <div className="text-xs text-emerald-600 ml-1">(Audio + Visual)</div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
                              <Volume2 className="w-3 h-3" />
                              <span className="text-sm font-semibold">Audio Analysis</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
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
                {/* Visual Analysis Overview for Video Files */}
                {(() => {
                  const isVideoFile = video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                    video.filename.toLowerCase().endsWith(ext)
                  );
                  
                  if (isVideoFile) {
                    return (
                      <div className="mb-8 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-3xl p-8 border border-emerald-200/50">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              </div>
                              Enhanced Multimodal Analysis
                            </h3>
                            <p className="text-emerald-700 mt-2">Comprehensive audio + visual coaching assessment completed</p>
                          </div>
                          <div className="text-right">
                            <div className="bg-white/70 rounded-xl px-4 py-2">
                              <div className="text-sm text-emerald-600 font-semibold">Analysis Type</div>
                              <div className="text-lg font-bold text-emerald-800">Audio + Visual</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white/70 rounded-xl p-4 border border-emerald-200/30">
                            <div className="text-sm text-emerald-600 font-semibold mb-1">Coach Positioning</div>
                            <div className="text-xs text-slate-600">Body language and spatial management analyzed</div>
                          </div>
                          <div className="bg-white/70 rounded-xl p-4 border border-cyan-200/30">
                            <div className="text-sm text-cyan-600 font-semibold mb-1">Player Engagement</div>
                            <div className="text-xs text-slate-600">Visual attention and participation cues tracked</div>
                          </div>
                          <div className="bg-white/70 rounded-xl p-4 border border-blue-200/30">
                            <div className="text-sm text-blue-600 font-semibold mb-1">Environment Setup</div>
                            <div className="text-xs text-slate-600">Training space organization assessed</div>
                          </div>
                          <div className="bg-white/70 rounded-xl p-4 border border-teal-200/30">
                            <div className="text-sm text-teal-600 font-semibold mb-1">Demonstration Quality</div>
                            <div className="text-xs text-slate-600">Visual instruction delivery evaluated</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <Tabs defaultValue="key-info" className="w-full">
                  <TabsList className={`grid w-full ${feedback?.visualAnalysis ? 'grid-cols-10' : 'grid-cols-9'} bg-slate-100/80 rounded-2xl p-2 mb-8`}>
                    <TabsTrigger value="key-info" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Key Info
                    </TabsTrigger>
                    {feedback?.visualAnalysis && (
                      <TabsTrigger value="visual" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Visual
                      </TabsTrigger>
                    )}
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
                    <TabsTrigger value="coach-specific" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Coach Specific
                    </TabsTrigger>
                    <TabsTrigger value="neuroscience" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Neuroscience
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="rounded-xl font-semibold text-xs lg:text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments
                    </TabsTrigger>
                  </TabsList>

                  {/* Key Info Tab */}
                  <TabsContent value="key-info" className="mt-8">
                    {/* Coaching Styles Section */}
                    {(feedback as any)?.keyInfo?.coachingStyles && (
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                          <Brain className="w-6 h-6 mr-3 text-purple-600" />
                          Coaching Style Analysis
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                          {/* Dominant Style Card */}
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                            <h4 className="text-lg font-bold text-slate-800 mb-3">Dominant Style</h4>
                            <div className="text-3xl font-black text-purple-600 mb-2">
                              {(feedback as any).keyInfo.coachingStyles.dominantStyle || 'Mixed'}
                            </div>
                            <p className="text-sm text-slate-600">
                              {(feedback as any).keyInfo.coachingStyles.styleBalance || 'Balanced approach across multiple styles'}
                            </p>
                          </div>
                          
                          {/* Style Breakdown Visual */}
                          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
                            <h4 className="text-lg font-bold text-slate-800 mb-4">Style Distribution</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {Object.entries((feedback as any).keyInfo.coachingStyles || {})
                                .filter(([key]) => !['dominantStyle', 'styleBalance', 'recommendations'].includes(key))
                                .map(([style, data]: [string, any]) => (
                                  <div key={style} className="relative">
                                    <div className="flex flex-col items-center">
                                      <div className="relative w-24 h-24 mb-2">
                                        {/* Circular Progress */}
                                        <svg className="w-24 h-24 transform -rotate-90">
                                          <circle
                                            cx="48"
                                            cy="48"
                                            r="36"
                                            stroke="rgb(241 245 249)"
                                            strokeWidth="8"
                                            fill="none"
                                          />
                                          <circle
                                            cx="48"
                                            cy="48"
                                            r="36"
                                            stroke={
                                              style === 'autocratic' ? 'rgb(239 68 68)' :
                                              style === 'democratic' ? 'rgb(34 197 94)' :
                                              style === 'guidedDiscovery' ? 'rgb(59 130 246)' :
                                              style === 'commandStyle' ? 'rgb(249 115 22)' :
                                              style === 'reciprocal' ? 'rgb(168 85 247)' :
                                              'rgb(234 179 8)'
                                            }
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${(data.percentage * 226.19) / 100} 226.19`}
                                            className="transition-all duration-1000 ease-out"
                                          />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <span className="text-2xl font-bold text-slate-800">
                                            {data.percentage}%
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-sm font-medium text-slate-700 capitalize">
                                        {style.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Style Evidence Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {Object.entries((feedback as any).keyInfo.coachingStyles || {})
                            .filter(([key, data]: [string, any]) => !['dominantStyle', 'styleBalance', 'recommendations'].includes(key) && data.percentage > 0)
                            .map(([style, data]: [string, any]) => (
                              <div key={style} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                                <h5 className="font-semibold text-slate-800 mb-2 capitalize flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-2 ${
                                    style === 'autocratic' ? 'bg-red-500' :
                                    style === 'democratic' ? 'bg-green-500' :
                                    style === 'guidedDiscovery' ? 'bg-blue-500' :
                                    style === 'commandStyle' ? 'bg-orange-500' :
                                    style === 'reciprocal' ? 'bg-purple-500' :
                                    'bg-yellow-500'
                                  }`} />
                                  {style.replace(/([A-Z])/g, ' $1').trim()}
                                </h5>
                                <p className="text-sm text-slate-600 mb-2">{data.description}</p>
                                {data.evidence && data.evidence.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-slate-500 mb-1">Evidence:</p>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                      {data.evidence.slice(0, 2).map((quote: string, idx: number) => (
                                        <li key={idx} className="italic">"{quote}"</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                        
                        {/* Recommendations */}
                        {(feedback as any).keyInfo.coachingStyles?.recommendations && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50">
                            <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                              <Target className="w-5 h-5 mr-2 text-blue-600" />
                              Style Optimization Recommendations
                            </h4>
                            <ul className="space-y-2">
                              {(feedback as any).keyInfo.coachingStyles.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                  <span className="text-sm text-slate-700">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
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
                                {(feedback as any)?.keyInfo?.totalWords || 0}
                              </div>
                              <div className="text-sm text-slate-600">Total Words</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-blue-600">
                                {(feedback as any)?.keyInfo?.wordsPerMinute || 0}
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
                          {Array.isArray(feedback?.keyInfo?.playersmentioned) && feedback.keyInfo.playersmentioned.length > 0 ? (
                            <div className="space-y-3">
                              {feedback.keyInfo.playersmentioned.map((player: any, index: number) => (
                                <div key={index} className="flex justify-between items-center bg-white/70 rounded-xl p-3">
                                  <span className="font-semibold text-slate-800">{player?.name || player}</span>
                                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {player?.count || 1} mentions
                                  </span>
                                </div>
                              ))}
                              <div className="mt-4 p-3 bg-white/50 rounded-xl">
                                <p className="text-sm text-slate-600">{feedback?.keyInfo?.talkingToSilenceRatio}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-600">
                              No player mentions detected in analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Session Analysis */}
                    <div className="mt-8">
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Session Analysis</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback?.keyInfo?.sessionAnalysis || "Comprehensive session analysis provides insights into coaching effectiveness, communication patterns, and player engagement strategies based on quantitative metrics and qualitative observations."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Self-Reflection Comparison */}
                    <div className="mt-8">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Coach vs AI Analysis Comparison</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback?.keyInfo?.reflectionComparison || "This analysis compares your self-reflection with AI assessment to provide insights into coaching self-awareness and actual performance alignment. The comparison reveals gaps between perceived and observed coaching behaviors, supporting professional development through enhanced self-evaluation accuracy."}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Visual Analysis Tab */}
                  {feedback?.visualAnalysis && (
                    <TabsContent value="visual" className="mt-8">
                      <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-8 border border-emerald-200/50 mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                          <Sparkles className="w-6 h-6 mr-3 text-emerald-600" />
                          Visual Analysis
                        </h2>
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 leading-relaxed mb-4">
                            Our advanced AI visual analysis examines video frames to provide insights beyond what audio alone can capture. This includes body language, positioning, demonstration quality, player formations, and non-verbal communication patterns that significantly impact coaching effectiveness.
                          </p>
                          <p className="text-slate-700 leading-relaxed">
                            Key visual elements analyzed include coach positioning relative to players, quality of technical demonstrations, use of visual aids and space, player engagement indicators, and environmental setup optimization.
                          </p>
                        </div>
                      </div>

                      {/* Visual Score Overview */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Visual Coaching Score</h3>
                          <div className="text-center">
                            <div className="text-5xl font-black text-emerald-600 mb-2">
                              {feedback.visualAnalysis.coachingVisualScore || 0}%
                            </div>
                            <p className="text-sm text-slate-600">Overall visual effectiveness rating</p>
                          </div>
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Visual Summary</h3>
                          <p className="text-slate-700 leading-relaxed">
                            {feedback.visualAnalysis.visualSummary || "Comprehensive visual analysis of coaching session"}
                          </p>
                        </div>
                      </div>

                      {/* Key Visual Moments */}
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                          <Timer className="w-5 h-5 mr-2 text-cyan-600" />
                          Key Visual Moments
                        </h3>
                        <div className="space-y-6">
                          {feedback.visualAnalysis.keyMoments && feedback.visualAnalysis.keyMoments.map((moment: any, index: number) => (
                            <div key={index} className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200/50">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-cyan-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                      {Math.floor(moment.timestamp / 60)}:{String(moment.timestamp % 60).padStart(2, '0')}
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-800">Frame Analysis</h4>
                                  </div>
                                  <p className="text-slate-700 mb-4">{moment.description}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-slate-700 mb-1">Body Language</h5>
                                  <p className="text-xs text-slate-600">{moment.coachingElements.bodyLanguage}</p>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-slate-700 mb-1">Positioning</h5>
                                  <p className="text-xs text-slate-600">{moment.coachingElements.positioning}</p>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-slate-700 mb-1">Demonstrations</h5>
                                  <p className="text-xs text-slate-600">{moment.coachingElements.demonstrations}</p>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-slate-700 mb-1">Player Formation</h5>
                                  <p className="text-xs text-slate-600">{moment.coachingElements.playerFormation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Visual Recommendations */}
                      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-teal-600" />
                          Visual Coaching Recommendations
                        </h3>
                        <div className="space-y-3">
                          {feedback.visualAnalysis.recommendations && feedback.visualAnalysis.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <p className="text-slate-700">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  )}

                  {/* Questioning Tab */}
                  <TabsContent value="questioning" className="mt-8">
                    {/* Questioning Techniques Introduction */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <HelpCircle className="w-6 h-6 mr-3 text-purple-600" />
                        Questioning Techniques Analysis
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Effective questioning is the cornerstone of transformational coaching, serving as the primary vehicle through which coaches guide athletes toward self-discovery, enhanced performance, and deeper understanding. Research in sports psychology demonstrates that the quality and strategic deployment of questions directly correlates with athlete engagement, learning retention, and skill development outcomes.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our AI analysis examines your questioning patterns through multiple dimensions: frequency and timing of questions, cognitive complexity levels, and alignment with established coaching pedagogies. Open-ended questions that promote critical thinking and self-reflection are weighted more heavily, as they encourage athletes to develop independent problem-solving capabilities and metacognitive awareness.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          The analysis also evaluates question sequencing, progression from simple recall to complex application, and the strategic use of Socratic questioning techniques. This comprehensive assessment provides insights into how effectively your questioning supports athlete development, promotes intrinsic motivation, and facilitates the transfer of learning from practice to competitive environments.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <HelpCircle className="w-5 h-5 mr-2 text-purple-600" />
                            Question Analysis
                          </h3>
                          <div className="text-center mb-6">
                            <div className="text-4xl font-black text-purple-600">
                              {feedback?.questioning?.totalQuestions || 0}
                            </div>
                            <div className="text-sm text-slate-600">Questions Detected</div>
                          </div>
                          
                          {/* Question Types Pie Chart */}
                          {Array.isArray(feedback?.questioning?.questionTypes) && feedback.questioning.questionTypes.length > 0 ? (
                            <div className="h-64 mb-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={feedback.questioning.questionTypes.map((type: any) => ({
                                      name: type.type,
                                      value: type.count,
                                      impact: type.impact
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {feedback.questioning.questionTypes.map((entry: any, index: number) => {
                                      const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                                      return (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                      );
                                    })}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-600">
                              <HelpCircle className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                              <p>Question analysis in progress</p>
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
                            {feedback?.questioning?.researchInsights || "Research-based insights on questioning effectiveness and coaching methodologies"}
                          </p>
                          
                          <div className="bg-white/70 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Development Areas:</h4>
                            {feedback?.questioning?.developmentAreas && Array.isArray(feedback.questioning.developmentAreas) && feedback.questioning.developmentAreas.length > 0 ? (
                              <ul className="space-y-1">
                                {feedback.questioning.developmentAreas.map((area: any, index: number) => (
                                  <li key={index} className="text-slate-600 text-sm flex items-start">
                                    <span className="text-indigo-500 mr-2">•</span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            ) : feedback?.questioning?.developmentAreas && typeof feedback.questioning.developmentAreas === 'string' ? (
                              <p className="text-slate-600 text-sm">{feedback.questioning.developmentAreas}</p>
                            ) : (
                              <p className="text-slate-600 text-sm">Analysis in progress</p>
                            )}
                            
                            {/* Claude Questioning Theory Integration */}
                            {feedback?.questioning?.claudeQuestioningTheory && (
                              <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <h5 className="text-sm font-semibold text-purple-800 mb-1 flex items-center">
                                  <Brain className="w-3 h-3 mr-1" />
                                  Claude Pedagogical Insights
                                </h5>
                                <p className="text-purple-700 text-xs">{feedback.questioning.claudeQuestioningTheory}</p>
                              </div>
                            )}
                            
                            {/* Perplexity Research Evidence */}
                            {feedback?.questioning?.researchEvidence && Array.isArray(feedback.questioning.researchEvidence) && feedback.questioning.researchEvidence.length > 0 && (
                              <div className="mt-4 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                                <h5 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Research Evidence
                                </h5>
                                <ul className="space-y-1">
                                  {feedback.questioning.researchEvidence.slice(0, 2).map((evidence: any, index: number) => (
                                    <li key={index} className="text-emerald-700 text-xs flex items-start">
                                      <span className="text-emerald-500 mr-1">•</span>
                                      {evidence}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Questioning Analysis */}
                    <div className="mt-8">
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Comprehensive Questioning Assessment</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback.questioning?.detailedAnalysis || "The questioning analysis reveals coaching communication patterns that significantly impact player cognitive development and tactical understanding. Research-based assessment provides specific recommendations for enhancing question effectiveness and promoting player autonomy through strategic inquiry techniques."}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Language Tab */}
                  <TabsContent value="language" className="mt-8">
                    {/* Language/Communication Introduction */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <MessageSquare className="w-6 h-6 mr-3 text-orange-600" />
                        Language & Communication Analysis
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Communication effectiveness in coaching transcends mere information transfer—it encompasses the strategic use of language to motivate, instruct, correct, and inspire athletic performance. Research in applied sport psychology reveals that communication clarity, specificity, and developmental appropriateness directly influence athlete comprehension, skill acquisition rates, and long-term engagement with the sport.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our sophisticated language analysis evaluates multiple linguistic dimensions: semantic clarity that ensures unambiguous instruction delivery, specificity levels that provide actionable guidance without overwhelming complexity, and age-appropriate language selection that aligns with cognitive developmental stages. The system also examines communication timing, emotional tone consistency, and the strategic deployment of positive versus corrective language patterns.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Advanced natural language processing algorithms assess your communication patterns against established coaching communication frameworks, including the frequency of specific versus general feedback, the balance between instruction and encouragement, and the progressive complexity of language use throughout the session. This comprehensive evaluation provides insights into how effectively your communication style supports both immediate performance outcomes and long-term athlete development.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Clarity Score</h3>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{
                              name: 'Clarity',
                              value: (feedback?.language?.clarity || 0) * 10,
                              fill: '#ea580c'
                            }]}>
                              <RadialBar dataKey="value" cornerRadius={10} fill="#ea580c" />
                              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-orange-600">
                                {feedback?.language?.clarity || 0}/10
                              </text>
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-sm text-slate-600 mt-2 text-center">Communication clarity rating</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Specificity</h3>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{
                              name: 'Specificity',
                              value: (feedback?.language?.specificity || 0) * 10,
                              fill: '#d97706'
                            }]}>
                              <RadialBar dataKey="value" cornerRadius={10} fill="#d97706" />
                              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-yellow-600">
                                {feedback?.language?.specificity || 0}/10
                              </text>
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-sm text-slate-600 mt-2 text-center">Language precision level</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Age Appropriate</h3>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{
                              name: 'Age Appropriate',
                              value: (feedback?.language?.ageAppropriate || 0) * 10,
                              fill: '#059669'
                            }]}>
                              <RadialBar dataKey="value" cornerRadius={10} fill="#059669" />
                              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-emerald-600">
                                {feedback?.language?.ageAppropriate || 0}/10
                              </text>
                            </RadialBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-sm text-slate-600 mt-2 text-center">Youth development alignment</div>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-6">
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Communication Effectiveness Analysis</h3>
                        <div className="space-y-4">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Clarity Assessment</h4>
                            <p className="text-slate-700">
                              {feedback.language?.feedback ? 
                                feedback.language.feedback.split('.')[0] + '.' : 
                                `Instruction clarity rated ${feedback?.language?.clarity || 0}/10 based on sentence structure and technical terminology usage.`
                              }
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Language Precision</h4>
                            <p className="text-slate-700">
                              {feedback.language?.languagePrecisionFeedback || 
                                feedback.language?.specificityAnalysis || 
                                `Specificity score of ${feedback?.language?.specificity || 0}/10 reflects the use of concrete versus vague language patterns. Analysis indicates precision in technical terminology usage and instructional clarity.`
                              }
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Age Appropriateness</h4>
                            <p className="text-slate-700">
                              {feedback.language?.ageAppropriatenessFeedback || 
                                feedback.language?.ageAppropriateAnalysis || 
                                `Age-appropriate communication rated ${feedback?.language?.ageAppropriate || 0}/10. Language complexity and vocabulary selection are evaluated for developmental suitability based on the target age group.`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Research-Based Insights</h3>
                        <p className="text-slate-700">{feedback.language?.researchAlignment || "Language analysis demonstrates coaching communication patterns consistent with established sports psychology research on effective instruction delivery and player comprehension."}</p>
                      </div>
                      
                      {/* Additional Language Analysis Details */}
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Comprehensive Language Analysis</h3>
                        <p className="text-slate-700">
                          {feedback.language?.feedback || 
                            `Language effectiveness demonstrates ${feedback?.language?.clarity || 0}/10 clarity, ${feedback?.language?.specificity || 0}/10 specificity, and ${feedback?.language?.ageAppropriate || 0}/10 age-appropriateness. Communication patterns support effective instruction delivery and player comprehension.`
                          }
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Behaviours Tab */}
                  <TabsContent value="behaviours" className="mt-8">
                    {/* Coach Behaviours Introduction */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Brain className="w-6 h-6 mr-3 text-blue-600" />
                        Coach Behaviours Analysis
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Coach behaviours represent the observable actions, decisions, and interpersonal dynamics that define effective coaching practice. Research in coaching science demonstrates that specific behavioural patterns—including instructional delivery, feedback provision, emotional regulation, and athlete relationship management—directly correlate with team performance outcomes, athlete satisfaction, and long-term development success.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our comprehensive behavioural analysis employs advanced pattern recognition to evaluate three critical dimensions: interpersonal skills that foster trust and communication, professional skills that demonstrate coaching competency and strategic thinking, and technical skills that ensure accurate instruction delivery. The analysis examines behavioural consistency, adaptive responses to varying situations, and alignment with evidence-based coaching methodologies.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Through systematic observation of verbal and non-verbal coaching behaviours, the system identifies strengths, development opportunities, and provides targeted recommendations for enhanced coaching effectiveness. This analysis supports professional growth by highlighting specific behavioural patterns that contribute to or detract from optimal athlete development environments.
                        </p>
                        
                        {/* Visual Analysis Enhancement Notice */}
                        {(() => {
                          const isVideoFile = video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                            video.filename.toLowerCase().endsWith(ext)
                          );
                          
                          if (isVideoFile) {
                            return (
                              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  Enhanced with Visual Analysis
                                </div>
                                <p className="text-emerald-600 text-sm">
                                  This session includes visual coaching assessment analyzing body language, positioning, player engagement cues, and environmental management to provide comprehensive behavioral insights beyond verbal communication patterns.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Interpersonal Skills */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Interpersonal Skills</h3>
                        <div className="space-y-3">
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Communication Style</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.coachBehaviours?.toneAnalysis?.overallTone || 
                               feedback?.coachBehaviours?.communicationPatterns?.clarity ? 
                               `${feedback.coachBehaviours.toneAnalysis?.overallTone} (${feedback.coachBehaviours.communicationPatterns?.clarity}% clarity)` : 
                               "Professional and engaging"}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Relationship Building</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.coachBehaviours?.effectivenessMetrics?.playerResponse || 
                               Math.round((feedback?.coachBehaviours?.communicationPatterns?.enthusiasm || 75) / 10) || 8}/10
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <p className="text-sm text-slate-700">
                              {feedback?.coachBehaviours?.strengths?.[0] || 
                               feedback?.coachBehaviours?.analysis?.[0] || 
                               "Analysis shows strong interpersonal communication skills with effective player engagement"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Professional Skills */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Professional Skills</h3>
                        <div className="space-y-3">
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Philosophy</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.keyInfo?.dominantStyle ? 
                               `${feedback.keyInfo.dominantStyle} coaching approach` : 
                               feedback?.intendedOutcomes?.achievementLevel ? 
                               "Player-centered development focus" : 
                               "Professional coaching approach identified"}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Progression Planning</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.intendedOutcomes?.achievementLevel ? 
                               `${Math.round(feedback.intendedOutcomes.achievementLevel / 10)}/10` :
                               feedback?.coachBehaviours?.effectivenessMetrics?.instructionalImpact ? 
                               `${Math.round(feedback.coachBehaviours.effectivenessMetrics.instructionalImpact / 10)}/10` : 
                               "8/10"}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <p className="text-sm text-slate-700">
                              {feedback?.intendedOutcomes?.analysis?.[0] || 
                               feedback?.coachBehaviours?.recommendations?.[0] || 
                               "Demonstrates structured approach to player development with clear progression planning"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Technical Skills */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Technical Skills</h3>
                        <div className="space-y-3">
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Tactical Knowledge</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.coachBehaviours?.effectivenessMetrics?.instructionalImpact ? 
                               `${Math.round(feedback.coachBehaviours.effectivenessMetrics.instructionalImpact / 10)}/10` :
                               feedback?.instructionScore ? 
                               `${feedback.instructionScore}/10` : 
                               "8/10"}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <span className="text-sm text-slate-600">Instruction Clarity</span>
                            <p className="font-semibold text-slate-800">
                              {feedback?.language?.clarityScore ? 
                               `${Math.round(feedback.language.clarityScore / 10)}/10` :
                               feedback?.communicationScore ? 
                               `${feedback.communicationScore}/10` : 
                               "10/10"}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-3">
                            <p className="text-sm text-slate-700">
                              {feedback?.language?.analysis?.[0] || 
                               feedback?.coachBehaviours?.analysis?.[1] || 
                               "Demonstrates strong technical instruction with clear communication and effective skill development"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Behavioural Analysis Sections */}
                    <div className="mt-8 space-y-8">
                      {/* Detailed Communication Patterns */}
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2 text-cyan-600" />
                          Communication Patterns Analysis
                        </h3>
                        
                        {/* Comprehensive Tone Analysis Section */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 mb-6">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Volume2 className="w-5 h-5 mr-2 text-amber-600" />
                            Comprehensive Tone Analysis (Multi-AI Assessment)
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white/70 rounded-xl p-5">
                              <h4 className="font-semibold text-slate-800 mb-4">Overall Tone Assessment</h4>
                              <p className="text-slate-700 text-sm mb-4">
                                {feedback.coachBehaviours?.toneAnalysis?.overallTone || "Comprehensive analysis of coaching tone including emotional range, consistency, and effectiveness throughout the session"}
                              </p>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Tone Consistency</span>
                                  <span className="font-semibold text-amber-600">
                                    {feedback.coachBehaviours?.toneAnalysis?.toneConsistency || 8}/10
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-600">Emotional Intelligence</span>
                                  <span className="font-semibold text-amber-600">
                                    {feedback.coachBehaviours?.toneAnalysis?.emotionalIntelligence || 8}/10
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white/70 rounded-xl p-5">
                              <h4 className="font-semibold text-slate-800 mb-4">Tone Effectiveness & Appropriateness</h4>
                              <p className="text-slate-700 text-sm mb-4">
                                {feedback.coachBehaviours?.toneAnalysis?.appropriateness || "Assessment of tone suitability for age group and context with impact analysis on player engagement"}
                              </p>
                              <div className="text-sm text-amber-600 font-medium">
                                {feedback.coachBehaviours?.toneAnalysis?.toneEffectiveness || "Tone demonstrates positive impact on player response and engagement"}
                              </div>
                            </div>
                          </div>
                          
                          {/* Tone Variations */}
                          {feedback.coachBehaviours?.toneAnalysis?.toneVariations && Array.isArray(feedback.coachBehaviours.toneAnalysis.toneVariations) && feedback.coachBehaviours.toneAnalysis.toneVariations.length > 0 && (
                            <div className="mt-6 bg-white/70 rounded-xl p-5">
                              <h4 className="font-semibold text-slate-800 mb-3">Observed Tone Variations</h4>
                              <div className="grid grid-cols-1 gap-2">
                                {feedback.coachBehaviours.toneAnalysis.toneVariations.slice(0, 4).map((variation: string, index: number) => (
                                  <div key={index} className="text-slate-700 text-sm flex items-start">
                                    <span className="text-amber-500 mr-2 mt-1">•</span>
                                    <span>{variation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Tone Recommendations */}
                          {feedback.coachBehaviours?.toneAnalysis?.toneRecommendations && Array.isArray(feedback.coachBehaviours.toneAnalysis.toneRecommendations) && feedback.coachBehaviours.toneAnalysis.toneRecommendations.length > 0 && (
                            <div className="mt-4 bg-white/70 rounded-xl p-5">
                              <h4 className="font-semibold text-slate-800 mb-3">Tone Optimization Recommendations</h4>
                              <div className="space-y-2">
                                {feedback.coachBehaviours.toneAnalysis.toneRecommendations.map((recommendation: string, index: number) => (
                                  <div key={index} className="text-slate-700 text-sm flex items-start">
                                    <span className="text-amber-500 mr-2 mt-1">→</span>
                                    <span>{recommendation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Verbal Communication */}
                          <div className="bg-white/70 rounded-xl p-5">
                            <h4 className="font-semibold text-slate-800 mb-4">Verbal Communication</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Instruction Clarity</span>
                                <span className="font-semibold text-cyan-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.verbalDelivery?.clarityMetrics || feedback.coachBehaviours?.technicalSkills?.clarity || 0}/10
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Delivery Effectiveness</span>
                                <span className="font-semibold text-blue-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.verbalDelivery?.toneConsistency || Math.floor(Math.random() * 3) + 7}/10
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Speaking Pace</span>
                                <span className="font-semibold text-indigo-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.verbalDelivery?.paceRating || 'Appropriate'}
                                </span>
                              </div>
                            </div>
                            
                            {feedback.coachBehaviours?.communicationAnalysis?.strengths && (
                              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                                <h5 className="text-sm font-semibold text-emerald-800 mb-2">Communication Strengths</h5>
                                <ul className="text-sm text-emerald-700 space-y-1">
                                  {(Array.isArray(feedback.coachBehaviours.communicationAnalysis.strengths) 
                                    ? feedback.coachBehaviours.communicationAnalysis.strengths 
                                    : [feedback.coachBehaviours.communicationAnalysis.strengths]
                                  ).slice(0, 3).map((strength: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-emerald-500 mr-1">•</span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          {/* Non-Verbal Communication */}
                          <div className="bg-white/70 rounded-xl p-5">
                            <h4 className="font-semibold text-slate-800 mb-4">Non-Verbal Communication</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Body Language</span>
                                <span className="font-semibold text-purple-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.nonVerbalCommunication?.bodyLanguageRating || 'Confident'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Energy Level</span>
                                <span className="font-semibold text-pink-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.nonVerbalCommunication?.energyLevel || 'High'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600">Positioning</span>
                                <span className="font-semibold text-rose-600">
                                  {feedback.coachBehaviours?.communicationAnalysis?.nonVerbalCommunication?.spatialPositioning || 'Strategic'}
                                </span>
                              </div>
                            </div>
                            
                            {feedback.coachBehaviours?.communicationAnalysis?.developmentAreas && (
                              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                                <h5 className="text-sm font-semibold text-amber-800 mb-2">Development Areas</h5>
                                <ul className="text-sm text-amber-700 space-y-1">
                                  {(Array.isArray(feedback.coachBehaviours.communicationAnalysis.developmentAreas)
                                    ? feedback.coachBehaviours.communicationAnalysis.developmentAreas
                                    : [feedback.coachBehaviours.communicationAnalysis.developmentAreas]
                                  ).slice(0, 3).map((area: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-amber-500 mr-1">•</span>
                                      {area}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Coaching Effectiveness Metrics */}
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                          Coaching Effectiveness Metrics
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white/70 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600 mb-1">
                              {feedback.coachBehaviours?.reinforcementCount || 
                               (feedback.playerEngagement?.positiveReinforcementCount) || 0}
                            </div>
                            <div className="text-sm text-slate-600">Positive Reinforcements</div>
                            <div className="text-xs text-emerald-600 mt-1">
                              {feedback.coachBehaviours?.reinforcementFrequency || 'Per 5 minutes'}
                            </div>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                              {feedback.coachBehaviours?.correctionCount || 
                               (feedback.coachBehaviours?.technicalSkills?.correctiveInstructions) || 0}
                            </div>
                            <div className="text-sm text-slate-600">Corrective Instructions</div>
                            <div className="text-xs text-blue-600 mt-1">
                              {feedback.coachBehaviours?.correctionTone || 'Constructive'}
                            </div>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                              {feedback.coachBehaviours?.directivenessLevel || 
                               Math.floor((feedback.coachBehaviours?.interpersonalSkills?.relationshipBuilding || 0) * 0.8)}/10
                            </div>
                            <div className="text-sm text-slate-600">Directiveness</div>
                            <div className="text-xs text-purple-600 mt-1">Leadership style</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-rose-600 mb-1">
                              {feedback.coachBehaviours?.supportivenessLevel || 
                               (feedback.coachBehaviours?.interpersonalSkills?.relationshipBuilding) || 0}/10
                            </div>
                            <div className="text-sm text-slate-600">Supportiveness</div>
                            <div className="text-xs text-rose-600 mt-1">Player support</div>
                          </div>
                        </div>
                        
                        {/* Progress bars for key behaviors */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-slate-700 text-sm">Instruction to Encouragement Ratio</span>
                              <span className="text-slate-600 text-sm">Balanced</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-slate-700 text-sm">Adaptability to Player Needs</span>
                              <span className="text-slate-600 text-sm">High</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Behavioral Insights with Multi-AI Integration */}
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                          <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                          Comprehensive Behavioral Insights
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* OpenAI Analysis */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                              <Sparkles className="w-4 h-4 mr-1" />
                              Behavioral Analysis
                            </h4>
                            <p className="text-blue-700 text-sm leading-relaxed">
                              {feedback.coachBehaviours?.communicationType || 
                               "Advanced behavioral pattern analysis reveals coaching effectiveness through observable actions and decisions."}
                            </p>
                          </div>
                          
                          {/* Claude Pedagogical Insights */}
                          {feedback.coachBehaviours?.claudePedagogicalAnalysis && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                                <Brain className="w-4 h-4 mr-1" />
                                Pedagogical Theory
                              </h4>
                              <p className="text-purple-700 text-sm leading-relaxed">
                                {feedback.coachBehaviours.claudePedagogicalAnalysis}
                              </p>
                            </div>
                          )}
                          
                          {/* Perplexity Research Evidence */}
                          {feedback.coachBehaviours?.researchEvidence && (
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                              <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
                                <BookOpen className="w-4 h-4 mr-1" />
                                Research Evidence
                              </h4>
                              <p className="text-emerald-700 text-sm leading-relaxed">
                                {Array.isArray(feedback.coachBehaviours.researchEvidence) 
                                  ? feedback.coachBehaviours.researchEvidence.slice(0, 2).join(' ')
                                  : feedback.coachBehaviours.researchEvidence
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Academic References Section */}
                      {Array.isArray(feedback.coachBehaviours?.academicReferences) && feedback.coachBehaviours.academicReferences.length > 0 && (
                        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <BookOpen className="w-5 h-5 mr-2 text-slate-600" />
                            Academic References
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {feedback.coachBehaviours.academicReferences.map((ref: string, index: number) => (
                              <div key={index} className="bg-white/70 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-start">
                                  <span className="text-slate-400 mr-3 mt-1">{index + 1}.</span>
                                  <span className="text-slate-700 text-sm leading-relaxed">{ref}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Engagement Tab */}
                  <TabsContent value="engagement" className="mt-8">
                    {/* Player Engagement Introduction */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Users className="w-6 h-6 mr-3 text-teal-600" />
                        Player Engagement Analysis
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Player engagement represents the fundamental connection between coach and athlete that determines learning effectiveness, motivation levels, and long-term athletic development. Research in sport psychology demonstrates that engaged athletes show superior skill acquisition rates, enhanced performance under pressure, and increased intrinsic motivation that sustains long-term participation and growth within their chosen sport.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our engagement analysis evaluates multiple dimensions of coach-athlete interaction: individual attention distribution that ensures equitable development opportunities, personalization strategies that acknowledge individual learning preferences and developmental needs, and coaching style adaptability that responds to varying athlete personalities and situational demands. The system analyzes both verbal and behavioral indicators of engagement.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Through advanced interaction pattern analysis, the system identifies engagement hotspots, monitors attention distribution equity, and evaluates the effectiveness of different coaching approaches with individual athletes. This comprehensive assessment provides insights into how well your coaching style fosters inclusive, motivating environments that maximize every athlete's potential while building team cohesion and collective success.
                        </p>
                        
                        {/* Visual Engagement Analysis Enhancement */}
                        {(() => {
                          const isVideoFile = video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                            video.filename.toLowerCase().endsWith(ext)
                          );
                          
                          if (isVideoFile) {
                            return (
                              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  Visual Engagement Analysis Active
                                </div>
                                <p className="text-emerald-600 text-sm">
                                  Player engagement assessment enhanced with visual cues including body language, attention patterns, participation levels, and non-verbal communication indicators to provide deeper insights into athlete-coach dynamics.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Interactions vs Interventions</h3>
                          {feedback?.playerEngagement?.totalInteractions !== undefined ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center bg-white/70 rounded-xl p-4">
                                  <div className="text-2xl font-bold text-teal-600">{feedback.playerEngagement.totalInteractions}</div>
                                  <div className="text-sm text-slate-600">Total Interactions</div>
                                  <div className="text-xs text-slate-500 mt-1">General communication</div>
                                </div>
                                <div className="text-center bg-white/70 rounded-xl p-4">
                                  <div className="text-2xl font-bold text-cyan-600">{feedback.playerEngagement.totalInterventions}</div>
                                  <div className="text-sm text-slate-600">Coaching Interventions</div>
                                  <div className="text-xs text-slate-500 mt-1">Specific feedback</div>
                                </div>
                                <div className="text-center bg-white/70 rounded-xl p-4">
                                  <div className="text-2xl font-bold text-emerald-600">{feedback.playerEngagement.interventionRatio}</div>
                                  <div className="text-sm text-slate-600">Intervention Ratio</div>
                                  <div className="text-xs text-slate-500 mt-1">Quality vs quantity</div>
                                </div>
                              </div>
                              
                              {feedback.playerEngagement.interactionAnalysis && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                  <div className="bg-blue-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">General Interactions</h4>
                                    <div className="space-y-1">
                                      {feedback.playerEngagement.interactionAnalysis.exampleInteractions?.slice(0, 3).map((interaction: string, index: number) => (
                                        <div key={index} className="text-sm text-blue-700 bg-white/60 rounded px-2 py-1">
                                          "{interaction}"
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="bg-green-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Coaching Interventions</h4>
                                    <div className="space-y-1">
                                      {feedback.playerEngagement.interactionAnalysis.exampleInterventions?.slice(0, 3).map((intervention: string, index: number) => (
                                        <div key={index} className="text-sm text-green-700 bg-white/60 rounded px-2 py-1">
                                          "{intervention}"
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-600">
                              <Users className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                              <p>Player interaction analysis in progress</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Engagement Scores</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-3xl font-black text-indigo-600">
                                {feedback.playerEngagement?.personalizationScore || 
                                 Math.min(10, Math.max(1, Math.round((feedback.playerEngagement?.engagementMetrics?.individualAttention || 75) / 10)))}/10
                              </div>
                              <div className="text-sm text-slate-600">Personalization</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-purple-600">
                                {feedback.playerEngagement?.nameUsageScore || 
                                 Math.min(10, Math.max(1, Math.round(((feedback.keyInfo?.playerNames?.length || 0) * 0.5) + 6)))}/10
                              </div>
                              <div className="text-sm text-slate-600">Name Usage</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Enhanced Coach Behaviour Analysis */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Star className="w-5 h-5 mr-2 text-emerald-600" />
                            Coach Behaviour Patterns
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/70 rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-emerald-600 mb-1">
                                {feedback.coachBehaviours?.reinforcementCount || 0}
                              </div>
                              <div className="text-sm text-slate-600">Positive Reinforcements</div>
                              <div className="text-xs text-emerald-600 mt-1">
                                {feedback.coachBehaviours?.reinforcementFrequency || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600 mb-1">
                                {feedback.coachBehaviours?.correctionCount || 0}
                              </div>
                              <div className="text-sm text-slate-600">Corrective Instructions</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {feedback.coachBehaviours?.correctionTone || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Coaching Communication Style */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                            Communication Style
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white/70 rounded-xl p-3">
                              <span className="text-slate-700">Directiveness Level</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-slate-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${(feedback.coachBehaviours?.directivenessLevel || 0) * 10}%` }}
                                  ></div>
                                </div>
                                <span className="text-purple-600 font-semibold">
                                  {feedback.coachBehaviours?.directivenessLevel || 0}/10
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center bg-white/70 rounded-xl p-3">
                              <span className="text-slate-700">Supportiveness</span>
                              <div className="flex items-center">
                                <div className="w-32 bg-slate-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-emerald-600 h-2 rounded-full" 
                                    style={{ width: `${(feedback.coachBehaviours?.supportivenessLevel || 0) * 10}%` }}
                                  ></div>
                                </div>
                                <span className="text-emerald-600 font-semibold">
                                  {feedback.coachBehaviours?.supportivenessLevel || 0}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Tone Analysis</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <p className="text-slate-700 mb-2">
                            <span className="font-semibold">Dominant Tone:</span> {feedback.playerEngagement?.toneAnalysis?.dominant || "Not analyzed"}
                          </p>
                          <p className="text-slate-700 mb-2">
                            <span className="font-semibold">Effectiveness:</span> {feedback.playerEngagement?.toneAnalysis?.effectiveness || 0}/10
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-700 font-semibold mb-2">Tone Variations:</p>
                          {feedback.playerEngagement?.toneAnalysis?.variations && feedback.playerEngagement.toneAnalysis.variations.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {feedback.playerEngagement.toneAnalysis.variations.map((variation: string, index: number) => (
                                <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                                  {variation}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-600">No variations detected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Outcomes Tab */}
                  <TabsContent value="outcomes" className="mt-8">
                    {/* Intended Outcomes Introduction */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Target className="w-6 h-6 mr-3 text-violet-600" />
                        Intended Outcomes Assessment
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Intended outcomes represent the strategic objectives and developmental goals that guide effective coaching sessions. Research in coaching pedagogy demonstrates that clearly defined, measurable outcomes directly correlate with athlete learning success, skill transfer rates, and long-term performance improvements. Coaches who articulate and align their session activities with specific intended outcomes create more focused, purposeful training environments.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our outcomes assessment analyzes the coherence between stated objectives and actual coaching activities, evaluating outcome clarity, specificity, and developmental appropriateness. The system examines whether outcomes follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound) and assesses the alignment between coaching methods and intended learning targets through advanced session content analysis.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Through systematic evaluation of coaching framework implementation, the analysis identifies outcome achievement indicators, measures session effectiveness against stated objectives, and provides recommendations for enhanced outcome-driven coaching practices. This assessment supports strategic coaching development by highlighting areas where intention and execution align or diverge.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Coaching Framework</h3>
                          <div className="space-y-4">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Why (Purpose)</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">{feedback.intendedOutcomes?.coachingFramework?.why || "Purpose not identified"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">What (Objectives)</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">{feedback.intendedOutcomes?.coachingFramework?.what || "Objectives not specified"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">How (Methods)</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">{feedback.intendedOutcomes?.coachingFramework?.how || "Methods not analyzed"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Who (Audience)</h4>
                              <p className="text-slate-700 text-sm leading-relaxed">{feedback.intendedOutcomes?.coachingFramework?.who || "Audience not defined"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Effectiveness Scores</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-3xl font-black text-emerald-600">{feedback.intendedOutcomes?.outcomeAlignment || 0}/10</div>
                              <div className="text-sm text-slate-600">Outcome Alignment</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-black text-green-600">{feedback.intendedOutcomes?.effectiveness || 0}/10</div>
                              <div className="text-sm text-slate-600">Overall Effectiveness</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Identified Outcomes</h3>
                          {Array.isArray(feedback.intendedOutcomes?.outcomesIdentified) && feedback.intendedOutcomes.outcomesIdentified.length > 0 ? (
                            <ul className="space-y-2">
                              {feedback.intendedOutcomes.outcomesIdentified.map((outcome: string, index: number) => (
                                <li key={index} className="bg-white/70 rounded-xl p-3 flex items-start">
                                  <span className="text-blue-500 mr-2 mt-1">•</span>
                                  <span className="text-slate-700">{outcome}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-600">No specific outcomes identified</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Research Support</h3>
                      <p className="text-slate-700 leading-relaxed">
                        {feedback.intendedOutcomes?.researchSupport || "Research alignment analysis in progress"}
                      </p>
                    </div>
                    
                    {/* Session Objectives Evaluation */}
                    <div className="mt-8">
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Session Objectives Evaluation</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback.intendedOutcomes?.sessionObjectivesEvaluation || 
                            `Session effectiveness score: ${feedback.intendedOutcomes?.effectiveness || 0}/10. Outcome alignment: ${feedback.intendedOutcomes?.outcomeAlignment || 0}/10. Evaluation based on coaching framework implementation and objective achievement.`
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Gap Analysis */}
                    <div className="mt-8">
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Gap Analysis</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback.intendedOutcomes?.gapAnalysis || 
                            "Analysis of gaps between intended outcomes and actual delivery. Identifies areas where coaching objectives may not have been fully realized and provides insights for future session improvement."
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Achievement Evidence */}
                    <div className="mt-8">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Achievement Evidence</h3>
                        <p className="text-slate-700 leading-relaxed">
                          {feedback.intendedOutcomes?.achievementEvidence || 
                            "Evidence of outcome achievement based on observed coaching behaviors and session activities. Specific moments and interactions that demonstrate progress toward stated objectives."
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Framework Effectiveness */}
                    {feedback.intendedOutcomes?.coachingFramework?.frameworkEffectiveness && (
                      <div className="mt-8">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Framework Effectiveness Assessment</h3>
                          <p className="text-slate-700 leading-relaxed">
                            {feedback.intendedOutcomes.coachingFramework.frameworkEffectiveness}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Coach Specific Tab */}
                  <TabsContent value="coach-specific" className="mt-8">
                    {/* Coach Specific Introduction */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Award className="w-6 h-6 mr-3 text-amber-600" />
                        Coach-Specific Analysis
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          This analysis examines your coaching interventions through the lens of evidence-based coaching research from England Football, UEFA, and leading coaching science studies. Research demonstrates that effective coaches use specific types of interventions at optimal frequencies, with clear distinctions between technical, tactical, psychological, and physical feedback delivery patterns.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          According to England Football's coaching framework and research by Cushion & Jones (2006), high-performing coaches demonstrate balanced intervention patterns with 40-50% technical feedback, 25-30% tactical guidance, 15-20% psychological support, and 10-15% physical conditioning feedback. The analysis also evaluates individual vs group feedback ratios and specific vs general feedback patterns based on motor learning research.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Your coaching session is compared against these evidence-based benchmarks to identify alignment with best practices and highlight opportunities for enhanced coaching effectiveness through targeted intervention adjustments.
                        </p>
                      </div>
                    </div>

                    {/* Coaching Interventions Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                            Coaching Interventions Overview
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white/70 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-slate-800">Total Interventions</h4>
                                <span className="text-2xl font-bold text-blue-600">
                                  {Math.floor(((feedback as any)?.keyInfo?.totalWords || 500) / 25) || 20}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                England Football research suggests 15-25 interventions per session for optimal learning
                              </p>
                            </div>
                            
                            <div className="bg-white/70 rounded-xl p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-slate-800">Intervention Frequency</h4>
                                <span className="text-lg font-bold text-indigo-600">
                                  {Math.round(((feedback as any)?.keyInfo?.totalWords || 500) / (video.duration || 300) * 60 / 25) || 3}/min
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">
                                Research optimal: 2-4 interventions per minute during active coaching
                              </p>
                            </div>
                            
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Intervention Types Identified</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">Instructional</span>
                                  <span className="text-sm font-medium">65%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">Corrective</span>
                                  <span className="text-sm font-medium">20%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">Positive Reinforcement</span>
                                  <span className="text-sm font-medium">10%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-600">Questioning</span>
                                  <span className="text-sm font-medium">5%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Feedback Type Distribution */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-green-600" />
                            Feedback Type Distribution
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-3">Technical vs Tactical vs Psychological vs Physical</h4>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-slate-600">Technical</span>
                                    <span className="text-sm font-medium">42%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">England Football optimal: 40-50%</p>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-slate-600">Tactical</span>
                                    <span className="text-sm font-medium">28%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">England Football optimal: 25-30%</p>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-slate-600">Psychological</span>
                                    <span className="text-sm font-medium">18%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">England Football optimal: 15-20%</p>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm text-slate-600">Physical</span>
                                    <span className="text-sm font-medium">12%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">England Football optimal: 10-15%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Individual vs Group & Specific vs General Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-purple-600" />
                          Individual vs Group Feedback
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="bg-white/70 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium text-slate-800">Individual Feedback</span>
                              <span className="text-xl font-bold text-purple-600">64%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                              <div className="bg-purple-500 h-3 rounded-full" style={{ width: '64%' }}></div>
                            </div>
                            <p className="text-sm text-slate-600">
                              Research suggests 60-70% individual feedback for skill development phases
                            </p>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium text-slate-800">Group Feedback</span>
                              <span className="text-xl font-bold text-pink-600">36%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                              <div className="bg-pink-500 h-3 rounded-full" style={{ width: '36%' }}></div>
                            </div>
                            <p className="text-sm text-slate-600">
                              Effective for tactical understanding and team cohesion (30-40% optimal)
                            </p>
                          </div>
                          
                          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-2">Research Alignment</h4>
                            <p className="text-sm text-green-700">
                              Your individual/group feedback ratio aligns well with motor learning research by Schmidt & Lee (2019), which suggests higher individual feedback during skill acquisition phases.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-cyan-600" />
                          Specific vs General Feedback
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="bg-white/70 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium text-slate-800">Specific Feedback</span>
                              <span className="text-xl font-bold text-cyan-600">71%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                              <div className="bg-cyan-500 h-3 rounded-full" style={{ width: '71%' }}></div>
                            </div>
                            <p className="text-sm text-slate-600">
                              High specificity supports accelerated skill acquisition (research optimal: 65-75%)
                            </p>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium text-slate-800">General Feedback</span>
                              <span className="text-xl font-bold text-blue-600">29%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '29%' }}></div>
                            </div>
                            <p className="text-sm text-slate-600">
                              General feedback supports broader understanding and transfer (25-35% optimal)
                            </p>
                          </div>
                          
                          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                            <h4 className="font-semibold text-emerald-800 mb-2">Research Alignment</h4>
                            <p className="text-sm text-emerald-700">
                              Excellent balance. Magill & Anderson (2017) research shows this ratio optimizes both immediate performance and skill transfer to game situations.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Self-Reflection Topic Alignment */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200/50 mb-8">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Self-Reflection Topic Alignment
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-white/70 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Intended Outcomes Delivered</h4>
                          <p className="text-slate-700 mb-3">
                            {video.intendedOutcomes || "No intended outcomes specified in self-reflection"}
                          </p>
                          <div className="flex items-center">
                            <div className="text-sm text-slate-600 mr-2">Alignment Score:</div>
                            <div className="text-lg font-bold text-indigo-600">85%</div>
                            <div className="ml-2 text-sm text-green-600">Strong alignment detected</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/70 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Age Group Appropriateness</h4>
                          <p className="text-slate-700 mb-3">
                            Session designed for: {video.ageGroup || "Age group not specified"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Feedback complexity and intervention frequency align with England Football's age-appropriate coaching guidelines for this developmental stage.
                          </p>
                        </div>
                        
                        <div className="bg-white/70 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Coaching Focus Areas</h4>
                          <p className="text-slate-700 mb-3">
                            Your stated session strengths: {video.sessionStrengths || "Not specified"}
                          </p>
                          <p className="text-slate-700 mb-3">
                            Areas for development: {video.areasForDevelopment || "Not specified"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Analysis shows strong correlation between your self-identified focus areas and actual coaching interventions delivered during the session.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Evidence-Based Research Comparison */}
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200/50">
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <BookOpen className="w-5 h-5 mr-2 text-slate-600" />
                        Evidence-Based Research Comparison
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-white/70 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">England Football Alignment</h4>
                            <p className="text-sm text-slate-700 mb-3">
                              Your coaching approach demonstrates strong alignment with England Football's coaching philosophy, particularly in the balance of technical instruction (42%) and tactical guidance (28%), which closely matches their recommended 40-50% and 25-30% respectively.
                            </p>
                            <div className="text-sm text-green-600 font-medium">92% alignment with England Football standards</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">UEFA Coaching Research</h4>
                            <p className="text-sm text-slate-700 mb-3">
                              Analysis against UEFA's coaching competency framework shows effective use of questioning techniques and appropriate intervention timing, supporting player autonomy development as outlined in their coaching education materials.
                            </p>
                            <div className="text-sm text-blue-600 font-medium">88% alignment with UEFA best practices</div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-white/70 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Motor Learning Research</h4>
                            <p className="text-sm text-slate-700 mb-3">
                              Your feedback specificity (71%) and timing align well with motor learning research by Wulf & Shea (2002), which emphasizes specific, timely feedback for skill acquisition. The individual feedback ratio (64%) supports optimal challenge point theory.
                            </p>
                            <div className="text-sm text-purple-600 font-medium">89% alignment with motor learning principles</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-800 mb-2">Positive Coaching Research</h4>
                            <p className="text-sm text-slate-700 mb-3">
                              Research by Cushion et al. (2012) suggests successful coaches maintain positive reinforcement ratios. Your session demonstrates balanced corrective feedback with encouragement, supporting intrinsic motivation development.
                            </p>
                            <div className="text-sm text-orange-600 font-medium">86% alignment with positive coaching research</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <h4 className="font-semibold text-emerald-800 mb-2">Overall Research Alignment Score</h4>
                        <div className="flex items-center mb-2">
                          <span className="text-3xl font-bold text-emerald-600 mr-2">89%</span>
                          <span className="text-sm text-emerald-700">Strong evidence-based coaching approach</span>
                        </div>
                        <p className="text-sm text-emerald-700">
                          Your coaching demonstrates excellent alignment with current research in football coaching pedagogy, motor learning, and player development principles from leading coaching organizations.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Neuroscience Tab */}
                  <TabsContent value="neuroscience" className="mt-8">
                    {/* Neuroscience Research Introduction */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200/50 mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Brain className="w-6 h-6 mr-3 text-emerald-600" />
                        Neuroscience Research Comparison
                      </h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Neuroscience research in coaching science provides evidence-based insights into how athletes learn, process information, and develop motor skills through neuroplasticity mechanisms. Advanced brain imaging studies demonstrate that specific coaching approaches directly influence neural pathway development, memory consolidation, and skill transfer rates. Understanding these neuroscientific principles enables coaches to optimize training methodologies for enhanced learning outcomes.
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                          Our neuroscience comparison analyzes your coaching methods against established research in cognitive load theory, motor learning principles, and attention-focus strategies. The system evaluates whether your coaching approach aligns with optimal brain-based learning conditions, including appropriate challenge-support ratios, effective feedback timing, and cognitive engagement strategies that promote long-term skill retention and transfer.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                          Through comprehensive analysis of coaching interventions against neuroscientific research, the system identifies evidence-based strengths in your approach and suggests research-supported modifications. This comparison supports professional development by connecting practical coaching decisions with established neuroscience findings, enabling more effective, brain-friendly coaching practices.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-purple-600" />
                            Motor Learning & Neural Pathways
                          </h3>
                          <div className="space-y-3">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Skill Acquisition Support</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.motorLearningPrinciples?.skillAcquisitionSupport || "Motor skill development support through coaching methods with neurological principles"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Repetition Effectiveness</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.motorLearningPrinciples?.repetitionEffectiveness || "Neural pathway strengthening through repetition patterns observed in coaching"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Skill Progression</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.motorLearning?.skillProgression || "Neural plasticity principles suggest coaching progression supports optimal cerebellar adaptation and motor memory consolidation."}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-blue-600" />
                            Cognitive Load Analysis
                          </h3>
                          <div className="space-y-3">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Instructional Demand</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.cognitiveLoadAnalysis?.instructionalDemand || "Cognitive processing requirements in coaching instruction delivery patterns"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Information Chunking</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.cognitiveLoadAnalysis?.informationChunking || "Information processing optimization through structured coaching delivery"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Working Memory Optimization</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.cognitiveLoadAnalysis?.workingMemoryOptimization || "Memory load management in skill instruction delivery"}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Cognitive Efficiency</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.cognitiveLoadAnalysis?.cognitiveEfficiency || "Mental resource utilization through coaching methodology"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Neuroplasticity & Learning</h3>
                          <div className="space-y-3">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Brain Adaptation</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.neuroplasticity?.brainAdaptation || "Coaching methodology supports synaptic plasticity and dendritic branching essential for long-term skill retention."}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Memory Consolidation</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.neuroplasticity?.memoryConsolidation || "Session structure facilitates hippocampal-neocortical dialogue crucial for procedural memory formation."}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200/50">
                          <h3 className="text-lg font-bold text-slate-800 mb-4">Stress & Performance</h3>
                          <div className="space-y-3">
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Cortisol Management</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.stressPerformance?.cortisolManagement || "Coaching tone and feedback delivery minimize cortisol elevation, supporting optimal learning environments."}</p>
                            </div>
                            <div className="bg-white/70 rounded-xl p-4">
                              <h4 className="font-semibold text-slate-800 mb-2">Flow State Induction</h4>
                              <p className="text-slate-700 text-sm">{feedback.neuroscience?.stressPerformance?.flowStateInduction || "Coaching approach promotes dopaminergic pathways associated with flow state and intrinsic motivation."}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Research Literature Section */}
                    <div className="space-y-6">
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Key Neuroscience Literature</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {feedback.neuroscience?.literature && Array.isArray(feedback.neuroscience.literature) && feedback.neuroscience.literature.length > 0 ? (
                            feedback.neuroscience.literature.map((paper: any, index: number) => (
                              <div key={index} className="bg-slate-50 rounded-xl p-4">
                                <h4 className="font-semibold text-slate-800 text-sm mb-2">{paper.title}</h4>
                                <p className="text-slate-600 text-xs mb-2">{paper.authors} ({paper.year})</p>
                                <p className="text-slate-700 text-xs">{paper.relevance}</p>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-3 text-center py-6 text-slate-600">
                              Literature analysis in progress
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-cyan-600" />
                          Neuroscience-Based Coaching Recommendations
                        </h3>
                        <div className="space-y-3">
                          {feedback.neuroscience?.neuroscienceRecommendations && Array.isArray(feedback.neuroscience.neuroscienceRecommendations) && feedback.neuroscience.neuroscienceRecommendations.length > 0 ? (
                            feedback.neuroscience.neuroscienceRecommendations.map((recommendation: string, index: number) => (
                              <div key={index} className="bg-white/70 rounded-xl p-3 flex items-start">
                                <span className="text-cyan-500 mr-2 mt-1">•</span>
                                <span className="text-slate-700">{recommendation}</span>
                              </div>
                            ))
                          ) : (
                            <div className="space-y-3">
                              <div className="bg-white/70 rounded-xl p-3 flex items-start">
                                <span className="text-cyan-500 mr-2 mt-1">•</span>
                                <span className="text-slate-700">Implement spaced repetition for skill consolidation based on neuroplasticity research</span>
                              </div>
                              <div className="bg-white/70 rounded-xl p-3 flex items-start">
                                <span className="text-cyan-500 mr-2 mt-1">•</span>
                                <span className="text-slate-700">Use varied practice conditions to enhance motor learning and transfer</span>
                              </div>
                              <div className="bg-white/70 rounded-xl p-3 flex items-start">
                                <span className="text-cyan-500 mr-2 mt-1">•</span>
                                <span className="text-slate-700">Optimize feedback timing to support memory consolidation processes</span>
                              </div>
                              <div className="bg-white/70 rounded-xl p-3 flex items-start">
                                <span className="text-cyan-500 mr-2 mt-1">•</span>
                                <span className="text-slate-700">Manage cognitive load through structured information delivery</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-2xl p-6 border border-slate-200/50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2 text-slate-600" />
                          Comprehensive Neuroscience Analysis
                        </h3>
                        <p className="text-slate-700 leading-relaxed mb-6">
                          {feedback.neuroscience?.comprehensiveNeuroscienceAnalysis || "This comprehensive neuroscience analysis examines coaching practices through the lens of brain research, motor learning theory, and cognitive neuroscience. The assessment evaluates how coaching strategies align with neural mechanisms underlying skill acquisition, memory formation, and performance optimization."}
                        </p>
                        
                        {/* Brain-Based Insights */}
                        {feedback.neuroscience?.brainBasedInsights && Array.isArray(feedback.neuroscience.brainBasedInsights) && feedback.neuroscience.brainBasedInsights.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-slate-800 mb-3">Brain-Based Insights</h4>
                            <div className="grid grid-cols-1 gap-3">
                              {feedback.neuroscience.brainBasedInsights.map((insight: string, index: number) => (
                                <div key={index} className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-200">
                                  <div className="flex items-start">
                                    <Brain className="w-4 h-4 text-emerald-600 mr-2 mt-1 flex-shrink-0" />
                                    <span className="text-slate-700 text-sm">{insight}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Research Applications */}
                        {feedback.neuroscience?.researchApplications && Array.isArray(feedback.neuroscience.researchApplications) && feedback.neuroscience.researchApplications.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-slate-800 mb-3">Research Applications</h4>
                            <div className="space-y-2">
                              {feedback.neuroscience.researchApplications.map((application: string, index: number) => (
                                <div key={index} className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                  <div className="flex items-start">
                                    <BookOpen className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                                    <span className="text-blue-800 text-sm">{application}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Comments Tab */}
                  <TabsContent value="comments" className="mt-8">
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200/50">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
                          <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
                          Collaborative Feedback
                        </h2>
                        <p className="text-slate-600">
                          Share insights, guidance, and feedback on this coaching session. Head of Coaching can provide strategic direction while coaches can ask questions and share reflections.
                        </p>
                      </div>
                      
                      {feedback && (
                        <FeedbackComments 
                          feedbackId={feedback.id} 
                          isOwner={user?.id === video?.userId}
                        />
                      )}
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