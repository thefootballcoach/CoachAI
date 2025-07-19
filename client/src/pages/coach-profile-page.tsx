import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/layout/dashboard-layout";
import FeedbackCard from "@/components/dashboard/feedback-card";
import ProgressChart from "@/components/dashboard/progress-chart";
import SessionList from "@/components/dashboard/session-list";

import { 
  User, Award, Calendar, Users, Target, Mail, Star, TrendingUp, 
  Video, MessageSquare, Clock, Play, ArrowLeft, CreditCard, Bot,
  Brain, Zap, Activity, BarChart2, FileText, Eye, Sparkles, Cpu, MessageCircle
} from "lucide-react";
import ClubChat from "@/components/communication/club-chat";
import Conversations from "@/components/communication/conversations";
import { User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const formatPositionLabel = (position: string) => {
  const labels: Record<string, string> = {
    head_coach: "Head Coach",
    assistant_coach: "Assistant Coach",
    academy_director: "Academy Director",
    technical_director: "Technical Director",
    youth_coach: "Youth Coach",
    goalkeeping_coach: "Goalkeeping Coach",
    fitness_coach: "Fitness Coach",
    analyst: "Performance Analyst"
  };
  return labels[position] || position.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatLicenseLabel = (license: string) => {
  const labels: Record<string, string> = {
    uefa_a: "UEFA A License",
    uefa_b: "UEFA B License", 
    uefa_c: "UEFA C License",
    uefa_pro: "UEFA Pro License",
    grassroots: "Grassroots Certificate",
    youth: "Youth Certificate",
    advanced_youth: "Advanced Youth Certificate"
  };
  return labels[license] || license.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function CoachProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [, params] = useRoute("/coach/:id");
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if current user is a club member
  const isClubMember = user?.clubId;

  // Check for unread club messages
  const { data: unreadClubData } = useQuery({
    queryKey: ["/api/club/unread-count"],
    enabled: !!isClubMember,
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Check for unread conversation messages
  const { data: unreadConversationData } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    enabled: !!isClubMember,
    refetchInterval: 3000, // Check every 3 seconds
  });

  const unreadClubCount = unreadClubData?.count || 0;
  const unreadConversationCount = unreadConversationData?.count || 0;
  
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

  const isLoading = coachLoading || videosLoading || feedbacksLoading || progressLoading;

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
            <Link href="/dashboard?tab=management">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Management
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* AI-Enhanced Header with Neural Network Background - Same as personal dashboard */}
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
                  Welcome back, {coach.name || coach.username}
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
              <Link href="/club-dashboard">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Management
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Metrics - Same style as personal dashboard */}
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
              <div className="text-cyan-400 text-xs font-medium">Excellent Progress</div>
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

            {/* AI Credits */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm font-medium">AI Credits</span>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{coach?.credits || 0}</div>
              <div className="text-purple-400 text-xs font-medium">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs - Same as personal dashboard */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            {isClubMember && (
              <>
                <TabsTrigger value="club-chat" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Club Chat</span>
                  {unreadClubCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadClubCount > 9 ? '9+' : unreadClubCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Messages</span>
                  {unreadConversationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadConversationCount > 9 ? '9+' : unreadConversationCount}
                    </span>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coach Profile Card */}
              <Card className="lg:col-span-1 shadow-lg border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage 
                        src={coach?.profilePicture ? `/api/images/s3-proxy/${coach.profilePicture}` : undefined} 
                        alt={coach?.name || coach?.username} 
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                        {(coach?.name || coach?.username)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl text-slate-800">{coach?.name || coach?.username}</CardTitle>
                      <CardDescription className="text-slate-600">{coach?.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Position</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {formatPositionLabel(coach?.position || 'coach')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">License</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {formatLicenseLabel(coach?.licenseLevel || 'grassroots')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Experience</span>
                      <span className="text-sm font-medium text-slate-800">{coach?.yearsExperience || 0} years</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Age Group</span>
                      <span className="text-sm font-medium text-slate-800">{coach?.ageGroup || 'Not specified'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Feedback */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-800">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Recent AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {feedbacksLoading ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-slate-200 rounded"></div>
                        ))}
                      </div>
                    ) : feedbacks && feedbacks.length > 0 ? (
                      <div className="space-y-4">
                        {feedbacks.slice(0, 3).map((feedback: any) => (
                          <FeedbackCard key={feedback.id} feedback={feedback} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No AI analysis yet</p>
                        <Link href="/upload">
                          <Button className="mt-4">Upload First Session</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Video className="w-5 h-5 mr-2 text-blue-600" />
                  Training Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {videosLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <SessionList sessions={videos || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Progress Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {progressLoading ? (
                    <div className="animate-pulse h-64 bg-slate-200 rounded"></div>
                  ) : (
                    <ProgressChart data={progress} />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Target className="w-5 h-5 mr-2 text-purple-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Communication</span>
                    <span className="font-medium text-slate-800">
                      {progress?.communicationScoreAvg ? Math.round(progress.communicationScoreAvg) : 0}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Technical Instruction</span>
                    <span className="font-medium text-slate-800">
                      {progress?.technicalScoreAvg ? Math.round(progress.technicalScoreAvg) : 0}/10
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Player Engagement</span>
                    <span className="font-medium text-slate-800">
                      {progress?.engagementScoreAvg ? Math.round(progress.engagementScoreAvg) : 0}/10
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-slate-800">Overall Score</span>
                    <span className="text-blue-600 text-lg">
                      {progress?.overallScoreAvg ? Math.round(progress.overallScoreAvg) : 0}/10
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedbacksLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {feedbacks.map((feedback: any) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-2">No AI analysis available</p>
                    <p className="text-slate-400 mb-6">Upload coaching sessions to get detailed AI feedback</p>
                    <Link href="/upload">
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Zap className="w-4 h-4 mr-2" />
                        Start Analysis
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Club Chat Tab - Only if user is club member */}
          {isClubMember && (
            <TabsContent value="club-chat" className="space-y-6">
              <ClubChat />
            </TabsContent>
          )}

          {/* Messages Tab - Only if user is club member */}
          {isClubMember && (
            <TabsContent value="messages" className="space-y-6">
              <Conversations />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
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
                  <p className="text-purple-100 text-sm font-medium">AI Score</p>
                  <p className="text-2xl font-bold text-white">
                    {progress?.communicationScoreAvg ? `${progress.communicationScoreAvg.toFixed(1)}` : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">Average Performance</p>
                </div>
                <Brain className="w-8 h-8 text-purple-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Credits</p>
                  <p className="text-2xl font-bold text-white">{coach.credits || 0}</p>
                  <p className="text-xs text-slate-400">Available Credits</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-400 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Progress</p>
                  <p className="text-2xl font-bold text-white">
                    {progress?.improvementPercentage ? `+${progress.improvementPercentage}%` : 'N/A'}
                  </p>
                  <p className="text-xs text-slate-400">Improvement Rate</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* AI-Enhanced Tabs Navigation - Identical to personal dashboard */}
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
                Training Sessions
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
            {/* AI Performance Dashboard Cards - Identical to personal dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-800">Neural Sessions</CardTitle>
                  <Cpu className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900">{videos?.length || 0}</div>
                  <p className="text-xs text-cyan-600 flex items-center mt-1">
                    <Brain className="h-3 w-3 mr-1" />
                    AI-Analyzed Sessions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">AI Performance</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {progress?.communicationScoreAvg ? `${progress.communicationScoreAvg.toFixed(1)}/10` : 'N/A'}
                  </div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Communication Score
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Neural Insights</CardTitle>
                  <Eye className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">{feedbacks?.length || 0}</div>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Analysis Generated
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Growth Pattern</CardTitle>
                  <Sparkles className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {progress?.engagementScoreAvg ? `${Math.round(progress.engagementScoreAvg)}/100` : 'N/A'}
                  </div>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1" />
                    Player Connection
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Latest Analysis & Progress - Identical styling */}
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
                    <BarChart2 className="h-5 w-5 text-green-600" />
                    Performance Evolution
                  </CardTitle>
                  <CardDescription className="text-slate-600">AI-tracked coaching development</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {progress ? (
                    <ProgressChart progress={progress} />
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart2 className="h-12 w-12 mx-auto mb-4 text-slate-400" />
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
                      Upload coaching sessions to unlock personalized AI-powered insights and recommendations
                    </p>
                    <Link href="/upload">
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                        <Zap className="w-4 h-4 mr-2" />
                        Start Neural Analysis
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
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