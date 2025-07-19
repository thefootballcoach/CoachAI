import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { ArrowLeft, User, Brain, Zap, Target, Activity, TrendingUp, Video, Bot, Cpu, Eye, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FeedbackCard from "@/components/dashboard/feedback-card";
import ProgressChart from "@/components/dashboard/progress-chart";
import SessionList from "@/components/dashboard/session-list";

export default function CoachProfilePageSimple() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, params] = useRoute("/coach/:id");
  
  if (!params?.id) {
    return <div>Invalid coach ID</div>;
  }
  
  const coachId = parseInt(params.id);
  
  // Fetch coach profile data
  const { data: coach, isLoading: coachLoading, error: coachError } = useQuery({
    queryKey: [`/api/users/${coachId}/profile`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${coachId}/profile`);
      if (!response.ok) {
        throw new Error("Failed to fetch coach profile");
      }
      return response.json();
    },
    retry: 1
  });

  // Fetch coach's videos
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: [`/api/users/${coachId}/videos`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${coachId}/videos`);
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      return response.json();
    },
    enabled: !!coachId
  });

  // Fetch coach's feedbacks
  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery({
    queryKey: [`/api/users/${coachId}/feedbacks`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${coachId}/feedbacks`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }
      return response.json();
    },
    enabled: !!coachId
  });

  // Fetch coach's progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: [`/api/users/${coachId}/progress`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${coachId}/progress`);
      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }
      return response.json();
    },
    enabled: !!coachId
  });

  if (coachLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading coach profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (coachError || !coach) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load coach profile.</p>
            <Link href="/club-dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Club Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                  {coach.name || coach.username}'s Neural Command Center
                </h1>
                <p className="text-slate-300 text-lg mt-1 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                  AI-Powered Coaching Intelligence Center
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
              <Link href="/club-dashboard">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Club Management
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {/* AI Analysis Score */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">AI Analysis Score</span>
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {progress?.communicationScoreAvg ? Math.round(progress.communicationScoreAvg) : 0}/10
              </div>
              <div className="text-cyan-400 text-xs font-medium">Communication Excellence</div>
            </div>

            {/* Total Sessions */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">Total Sessions</span>
                <Video className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{videos?.length || 0}</div>
              <div className="text-blue-400 text-xs font-medium">Sessions Analyzed</div>
            </div>

            {/* Improvement Rate */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">Improvement</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">+{progress?.improvementRate || 0}%</div>
              <div className="text-green-400 text-xs font-medium">This Month</div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">AI Insights</span>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{feedbacks?.length || 0}</div>
              <div className="text-purple-400 text-xs font-medium">Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-center mb-8">
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
                Training Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="feedback" 
                className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all duration-300"
              >
                <Target className="mr-2 h-4 w-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Coach Performance Metrics - Uploaded Sessions, Analysed Sessions, Reflections */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-800">Uploaded Sessions</CardTitle>
                  <Video className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900">{videos?.length || 0}</div>
                  <p className="text-xs text-cyan-600 flex items-center mt-1">
                    <Brain className="h-3 w-3 mr-1" />
                    Total Sessions Uploaded
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Analysed Sessions</CardTitle>
                  <Bot className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">{feedbacks?.length || 0}</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <Target className="h-3 w-3 mr-1" />
                    AI Analysis Complete
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Reflections Completed</CardTitle>
                  <Eye className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    {feedbacks?.filter((f: any) => f.comments && f.comments.trim().length > 0).length || 0}
                  </div>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1" />
                    Self-Reflection Notes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Development Plan Link */}
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg border-b border-blue-100">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Target className="h-5 w-5 text-blue-600" />
                  Development Plan
                </CardTitle>
                <CardDescription className="text-slate-600">Coach's personalized development journey</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Individual Development Plan</h3>
                    <p className="text-sm text-slate-600">View coaching goals, progress, and action items</p>
                  </div>
                  <Link href={`/development-plans?coachId=${coachId}`}>
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                      <Target className="w-4 h-4 mr-2" />
                      View Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Latest Analysis & Progress */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card className="bg-gradient-to-br from-slate-50 to-cyan-50/30 border-slate-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-t-lg border-b border-cyan-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Zap className="h-5 w-5 text-cyan-600" />
                    Latest AI Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-600">Most recent coaching session insights</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {feedbacks && feedbacks.length > 0 ? (
                    <FeedbackCard feedback={feedbacks[0]} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Bot className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p>No AI analysis available yet</p>
                      <p className="text-sm">Upload a session to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-green-50/30 border-slate-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg border-b border-green-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Performance Evolution
                  </CardTitle>
                  <CardDescription className="text-slate-600">AI-tracked coaching development</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {progress ? (
                    <ProgressChart progress={progress} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p>Progress tracking initializing</p>
                      <p className="text-sm">Complete more sessions for detailed insights</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-gradient-to-br from-slate-50 to-purple-50/30 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg border-b border-purple-100">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Neural Training Sessions
                </CardTitle>
                <CardDescription className="text-slate-600">AI-enhanced session analysis history</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SessionList videos={videos || []} isLoading={videosLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <div className="space-y-6">
              {feedbacks && feedbacks.length > 0 ? (
                feedbacks.map((feedback: any) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} />
                ))
              ) : (
                <Card className="bg-gradient-to-br from-slate-50 to-orange-50/30 border-slate-200 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Bot className="h-16 w-16 mx-auto mb-6 text-slate-400" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">AI Insights Awaiting</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      This coach's sessions will appear here once they upload coaching sessions for AI analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}