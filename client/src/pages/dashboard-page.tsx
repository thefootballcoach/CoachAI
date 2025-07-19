import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { getAudios, getFeedbacks, getUserProgress } from "@/lib/storage";
import DashboardLayout from "@/components/layout/dashboard-layout";
import FeedbackCard from "@/components/dashboard/feedback-card";
import ProgressChart from "@/components/dashboard/progress-chart";
import SessionList from "@/components/dashboard/session-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

import { Brain, Zap, Activity, Target, TrendingUp, Upload, BarChart2, FileText, Clock, Bot, Cpu, Eye, Sparkles, AlertTriangle, Key, MessageSquare, MessageCircle } from "lucide-react";
import ClubChat from "@/components/communication/club-chat";
import Conversations from "@/components/communication/conversations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearch();
  const tabFromUrl = new URLSearchParams(searchParams).get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  
  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Check if user is a club member
  const isClubMember = user?.clubId;

  // Check for unread club messages
  const { data: unreadClubData } = useQuery({
    queryKey: ["/api/club/unread-count"],
    enabled: !!isClubMember,
    refetchInterval: 10000, // Check every 10 seconds instead of 3
    refetchIntervalInBackground: false,
  });

  // Check for unread conversation messages
  const { data: unreadConversationData } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    enabled: !!isClubMember,
    refetchInterval: 10000, // Check every 10 seconds instead of 3
    refetchIntervalInBackground: false,
  });

  const unreadClubCount = unreadClubData?.count || 0;
  const unreadConversationCount = unreadConversationData?.count || 0;


  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["/api/audios"],
    queryFn: getAudios,
    refetchInterval: 3000, // Refresh every 3 seconds to show new uploads
    refetchIntervalInBackground: false, // Don't refresh in background
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 1000, // Consider data fresh for 1 second
    gcTime: 30000, // Keep in cache for 30 seconds
  });
  
  console.log("[DASHBOARD] Videos data:", videos);
  console.log("[DASHBOARD] Videos loading:", videosLoading);
  console.log("[DASHBOARD] Active tab:", activeTab);

  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery({
    queryKey: ["/api/feedbacks"],
    queryFn: getFeedbacks,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
    queryFn: getUserProgress,
  });

  const isLoading = videosLoading || feedbacksLoading || progressLoading;

  // Check for API-related errors in videos
  const hasApiQuotaError = videos?.some(v => v.status === 'quota_exceeded');
  const hasApiKeyError = videos?.some(v => v.status === 'api_key_invalid');

  return (
    <DashboardLayout>
      {/* AI-Enhanced Header with Neural Network Background */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-800 text-white overflow-hidden">
        {/* Neural Network Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-24 h-24 border border-purple-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-10 left-1/3 w-16 h-16 border border-blue-400 rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/2 right-1/3 w-20 h-20 border border-green-400 rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  Welcome back, {user?.name || user?.username}
                </h1>
                <p className="text-slate-300 text-lg mt-1 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                  AI-Powered Coaching Intelligence Center
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 transition-all duration-300">
                  <Zap className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </Link>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm">
                <Target className="w-4 h-4 mr-2" />
                AI Insights
              </Button>
            </div>
          </div>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Sessions</p>
                  <p className="text-2xl font-bold text-white">{videos?.length || 0}</p>
                  <p className="text-xs text-slate-400">Uploaded Sessions</p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Overall Score</p>
                  <p className="text-2xl font-bold text-white">
                    {progress?.overallScoreAvg ? `${Math.round(progress.overallScoreAvg)}/100` : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">Overall Performance</p>
                </div>
                <Eye className="w-8 h-8 text-purple-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Visual Analysis</p>
                  <p className="text-2xl font-bold text-white">
                    {videos?.filter(v => v.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                      v.filename.toLowerCase().endsWith(ext))).length || 0}
                  </p>
                  <p className="text-xs text-slate-400">Multimodal Sessions</p>
                </div>
                <Eye className="w-8 h-8 text-green-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Engagement Score</p>
                  <p className="text-2xl font-bold text-white">
                    {progress?.engagementScoreAvg ? `${Math.round(progress.engagementScoreAvg)}/100` : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">Player Connection</p>
                </div>
                <Sparkles className="w-8 h-8 text-orange-400 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Error Alerts */}
      {(hasApiQuotaError || hasApiKeyError) && (
        <div className="p-6 space-y-4 bg-slate-50">
          {hasApiQuotaError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">OpenAI API Quota Exceeded</AlertTitle>
              <AlertDescription className="text-red-700">
                Your OpenAI API usage has exceeded the current quota. AI analysis cannot process new sessions until you upgrade your OpenAI plan or wait for the quota to reset. Please check your OpenAI billing dashboard and upgrade your plan to continue using AI coaching analysis.
              </AlertDescription>
            </Alert>
          )}
          {hasApiKeyError && (
            <Alert className="border-orange-200 bg-orange-50">
              <Key className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Invalid OpenAI API Key</AlertTitle>
              <AlertDescription className="text-orange-700">
                The OpenAI API key is invalid or missing. AI analysis requires a valid API key with access to GPT-4 and Whisper models. Please provide a valid OpenAI API key to enable coaching session analysis.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* AI-Enhanced Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="bg-gradient-to-r from-slate-100 to-blue-100/50 border border-slate-200 rounded-xl p-1 shadow-lg backdrop-blur-sm">
              <TabsTrigger 
                value="overview" 
                className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
              >
                <Brain className="mr-2 h-4 w-4" />
                Neural Overview
              </TabsTrigger>
              <TabsTrigger 
                value="sessions" 
                className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
              >
                <Activity className="mr-2 h-4 w-4" />
                AI Feedback
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
              >
                <Target className="mr-2 h-4 w-4" />
                AI Insights
              </TabsTrigger>
              {isClubMember && (
                <>
                  <TabsTrigger 
                    value="communication" 
                    className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300 relative"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Club Chat
                    {unreadClubCount > 0 && activeTab !== "communication" && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadClubCount > 9 ? '9+' : unreadClubCount}
                      </div>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="conversations" 
                    className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300 relative"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                    {unreadConversationCount > 0 && activeTab !== "conversations" && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadConversationCount > 9 ? '9+' : unreadConversationCount}
                      </div>
                    )}
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="space-y-6">
            {/* AI Performance Dashboard Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-800">Neural Sessions</CardTitle>
                  <Activity className="h-5 w-5 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-900">{videos?.length || 0}</div>
                  <p className="text-xs text-cyan-600 mt-1">
                    {videos && videos.length > 0 
                      ? `Last analysis ${videos[0].createdAt ? new Date(videos[0].createdAt).toLocaleDateString() : 'N/A'}`
                      : 'Ready for first session upload'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">AI Performance Score</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">
                    {progress?.overallScoreAvg ? Math.round(progress.overallScoreAvg) : '--'}/100
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    {progress?.weeklyImprovement 
                      ? `${progress.weeklyImprovement > 0 ? '+' : ''}${Math.round(progress.weeklyImprovement)}% neural improvement`
                      : 'Building AI baseline'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Communication Intelligence</CardTitle>
                  <Brain className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">
                    {progress?.communicationScoreAvg ? Math.round(progress.communicationScoreAvg) : '--'}/10
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Neuroscience-backed effectiveness rating
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Live AI Processing</CardTitle>
                  <Cpu className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900 flex items-center">
                    {videos && videos.filter(v => v.status === 'processing').length}
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Neural networks analyzing sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Chart Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <BarChart2 className="mr-2 h-5 w-5 text-purple-600" />
                    AI Performance Trends
                  </CardTitle>
                  <CardDescription>Neural analysis of your coaching progression</CardDescription>
                </CardHeader>
                <CardContent>
                  {progress && !progressLoading ? (
                    <ProgressChart progress={progress} isLoading={progressLoading} />
                  ) : (
                    <div className="h-32 flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading AI insights...</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Sparkles className="mr-2 h-5 w-5 text-cyan-600" />
                    Latest AI Insights
                  </CardTitle>
                  <CardDescription>Most recent neural analysis feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbacks && feedbacks.length > 0 ? (
                    <FeedbackCard feedback={feedbacks[0]} />
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500 mb-4">No AI insights generated yet</p>
                      <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                        <Link href="/upload">Upload First Session</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-4">
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Activity className="mr-2 h-5 w-5 text-purple-600" />
                  AI Feedback Analysis ({videos?.length || 0} sessions)
                </CardTitle>
                <CardDescription>AI-powered coaching session insights</CardDescription>
              </CardHeader>
              <CardContent>
                {videosLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <SessionList videos={videos || []} isLoading={false} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            <Card className="bg-gradient-to-br from-white to-green-50/30 border border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Target className="mr-2 h-5 w-5 text-green-600" />
                  AI Coaching Insights
                </CardTitle>
                <CardDescription>Comprehensive neural analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">AI Analysis Pending</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Upload and analyze your coaching sessions to unlock detailed AI insights, behavioral analysis, and personalized recommendations.
                    </p>
                    <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      <Link href="/upload">Generate AI Insights</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isClubMember && (
            <>
              <TabsContent value="communication" className="space-y-6">
                <ClubChat />
              </TabsContent>
              <TabsContent value="conversations" className="space-y-6">
                <Conversations />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}