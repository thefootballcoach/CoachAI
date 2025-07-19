import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Feedback, User, CreditTransaction } from "@shared/schema";
import { Loader2, PlayCircle, AlertCircle, Check, FileVideo, ChevronLeft, UserCircle2, Users, Edit, Trash, Plus, Save, X, Settings, FileText, CreditCard, PlusCircle, MinusCircle, DollarSign, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [siteSettings, setSiteSettings] = useState({
    siteName: "CoachAI",
    tagline: "AI-powered coaching feedback",
    description: "Empower football coaches with intelligent performance analysis through video technology.",
    contactEmail: "support@coachai.com",
    enableRegistration: true,
    maxUploadSize: 500, // in MB
    aiProvider: "OpenAI",
    defaultPricingTier: "Professional",
    maintenanceMode: false
  });
  const [contentPages, setContentPages] = useState([
    { id: 1, title: "Home", slug: "home", content: "Welcome to CoachAI", isPublished: true, lastModified: new Date() },
    { id: 2, title: "About", slug: "about", content: "About CoachAI", isPublished: true, lastModified: new Date() },
    { id: 3, title: "Privacy Policy", slug: "privacy", content: "Privacy Policy", isPublished: true, lastModified: new Date() },
    { id: 4, title: "Terms of Service", slug: "terms", content: "Terms of Service", isPublished: true, lastModified: new Date() }
  ]);
  const [editingContent, setEditingContent] = useState<{id: number, title: string, content: string} | null>(null);
  
  const {
    data: videos,
    isLoading: isLoadingVideos,
    error: videosError,
  } = useQuery<Video[]>({
    queryKey: ["/api/audios/all"],
    enabled: !!user && user.role === "admin",
  });

  const {
    data: feedbacks,
    isLoading: isLoadingFeedbacks,
    error: feedbacksError,
  } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks/all"],
    enabled: !!user && user.role === "admin",
  });
  
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<any[]>({
    queryKey: ["/api/users/all"],
    enabled: !!user && user.role === "admin",
  });
  
  const {
    data: userVideos,
    isLoading: isLoadingUserVideos,
    error: userVideosError,
  } = useQuery<Video[]>({
    queryKey: ["/api/users", selectedUser, "videos"],
    queryFn: () => fetch(`/api/users/${selectedUser}/videos`).then(res => res.json()),
    enabled: !!selectedUser && !!user && user.role === "admin",
  });
  
  const {
    data: userFeedbacks,
    isLoading: isLoadingUserFeedbacks,
    error: userFeedbacksError,
  } = useQuery<Feedback[]>({
    queryKey: ["/api/users", selectedUser, "feedbacks"],
    queryFn: () => fetch(`/api/users/${selectedUser}/feedbacks`).then(res => res.json()),
    enabled: !!selectedUser && !!user && user.role === "admin",
  });
  
  const {
    data: userProgress,
    isLoading: isLoadingUserProgress,
    error: userProgressError,
  } = useQuery<any>({
    queryKey: ["/api/users", selectedUser, "progress"],
    queryFn: () => fetch(`/api/users/${selectedUser}/progress`).then(res => {
      if (res.status === 404) {
        return null;
      }
      return res.json();
    }),
    enabled: !!selectedUser && !!user && user.role === "admin",
  });
  
  // Credit transactions for selected user
  const {
    data: userCreditTransactions,
    isLoading: isLoadingUserCreditTransactions,
    error: userCreditTransactionsError,
  } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/users", selectedUser, "credits", "transactions"],
    queryFn: () => fetch(`/api/users/${selectedUser}/credits/transactions`).then(res => res.json()),
    enabled: !!selectedUser && !!user && user.role === "admin",
  });
  
  // Add credits mutation
  const [addCreditsAmount, setAddCreditsAmount] = useState<string>("");
  const [addCreditsReason, setAddCreditsReason] = useState<string>("");
  
  const addCreditsMutation = useMutation({
    mutationFn: async (userId: number) => {
      const amount = parseFloat(addCreditsAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid positive number");
      }
      
      const res = await apiRequest("POST", `/api/users/${userId}/credits/add`, {
        amount,
        reason: addCreditsReason || "Credit purchase"
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add credits");
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Reset form
      setAddCreditsAmount("");
      setAddCreditsReason("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser, "credits", "transactions"] });
      
      toast({
        title: "Credits Added",
        description: `Successfully added credits to the user's account.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Deduct credits mutation
  const [deductCreditsAmount, setDeductCreditsAmount] = useState<string>("");
  const [deductCreditsReason, setDeductCreditsReason] = useState<string>("");
  
  const deductCreditsMutation = useMutation({
    mutationFn: async (userId: number) => {
      const amount = parseFloat(deductCreditsAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid positive number");
      }
      
      const res = await apiRequest("POST", `/api/users/${userId}/credits/deduct`, {
        amount,
        reason: deductCreditsReason || "Manual deduction"
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to deduct credits");
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Reset form
      setDeductCreditsAmount("");
      setDeductCreditsReason("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUser, "credits", "transactions"] });
      
      toast({
        title: "Credits Deducted",
        description: `Successfully deducted credits from the user's account.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Deduct Credits",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeAudioMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await apiRequest("POST", `/api/audios/${videoId}/analyze`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to analyze audio");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audios/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks/all"] });
      toast({
        title: "Analysis Started",
        description: "The audio is being analyzed. This may take a few minutes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin, redirect to home
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={() => window.location.href = '/admin/database'} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Database Management
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        if (value !== "users" && selectedUser) {
          setSelectedUser(null);
        }
      }} className="w-full mb-8">
        <TabsList className="grid grid-cols-5 w-[800px]">
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">All Videos</h2>
          {isLoadingVideos ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : videosError ? (
            <div className="text-center p-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading videos</p>
            </div>
          ) : !videos || videos.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FileVideo className="h-8 w-8 mx-auto mb-2" />
              <p>No videos found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <StatusBadge status={video.status} />
                    </div>
                    <CardDescription>ID: {video.id} | User ID: {video.userId}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-sm">{video.description || "No description"}</p>
                    <p className="text-sm">
                      Size: {formatFileSize(video.filesize)}
                      {video.duration ? ` | Duration: ${formatDuration(video.duration)}` : ""}
                    </p>
                    {video.status === "processing" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${video.processingProgress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-center mt-1">{video.processingProgress || 0}%</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => analyzeAudioMutation.mutate(video.id)}
                      disabled={
                        analyzeAudioMutation.isPending || 
                        video.status === "processing" || 
                        video.status === "in_queue" ||
                        video.status === "file_missing"
                      }
                      variant="default"
                      size="sm"
                      className="w-full"
                    >
                      {analyzeAudioMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-2" />
                      )}
                      Analyze with AI
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="feedbacks" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">All Feedbacks</h2>
          {isLoadingFeedbacks ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feedbacksError ? (
            <div className="text-center p-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading feedbacks</p>
            </div>
          ) : !feedbacks || feedbacks.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <FileVideo className="h-8 w-8 mx-auto mb-2" />
              <p>No feedbacks found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((feedback) => (
                <Card key={feedback.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Feedback #{feedback.id}</CardTitle>
                      <Badge>Video #{feedback.videoId}</Badge>
                    </div>
                    <CardDescription>User ID: {feedback.userId}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm font-medium">{feedback.summary}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Overall:</span>
                        <span>{feedback.overallScore}/10</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Communication:</span>
                        <span>{feedback.communicationScore}/10</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Engagement:</span>
                        <span>{feedback.engagementScore}/10</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Instruction:</span>
                        <span>{feedback.instructionScore}/10</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const strengths = JSON.parse(feedback.strengths as string);
                        const improvements = JSON.parse(feedback.improvements as string);
                        toast({
                          title: "Feedback Details",
                          description: (
                            <div>
                              <p className="mb-2">{feedback.feedback}</p>
                              <div className="mb-1 mt-2">
                                <strong>Strengths:</strong>
                                <ul>
                                  {strengths.slice(0, 3).map((s: string, i: number) => (
                                    <li key={i}>• {s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <strong>Improvements:</strong>
                                <ul>
                                  {improvements.slice(0, 3).map((s: string, i: number) => (
                                    <li key={i}>• {s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ),
                          duration: 10000,
                        });
                      }}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedUser ? `User #${selectedUser} Details` : `All Users`}
            {selectedUser && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2"
                onClick={() => setSelectedUser(null)}
              >
                Back to All Users
              </Button>
            )}
          </h2>
          
          {!selectedUser ? (
            // List all users
            isLoadingUsers ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : usersError ? (
              <div className="text-center p-8 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Error loading users</p>
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{user.username}</CardTitle>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role}
                        </Badge>
                      </div>
                      <CardDescription>ID: {user.id} | {user.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{user.name || 'No name provided'}</p>
                      
                      {/* Credit information */}
                      <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <CreditCard className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                            <span className="text-xs font-medium">Credits</span>
                          </div>
                          <Badge variant={user.credits > 0 ? "default" : "secondary"} className="text-xs h-5 px-1.5">
                            {user.credits || 0} available
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-500 dark:text-gray-400">Total Used</span>
                          <span className="font-medium">{user.totalCreditsUsed || 0}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (user.totalCreditsUsed || 0) / ((user.credits || 0) + (user.totalCreditsUsed || 0) || 1) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <p>
                          <span className="font-medium">Subscription:</span> {' '}
                          {user.subscriptionStatus ? (
                            <>
                              <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                {user.subscriptionStatus}
                              </Badge>
                              {user.subscriptionTier && (
                                <Badge variant="outline" className="ml-1">
                                  {user.subscriptionTier}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500">No active subscription</span>
                          )}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">Created:</span> {' '}
                          {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => setSelectedUser(user.id)}
                        variant="default"
                        size="sm"
                        className="w-full"
                      >
                        View User Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Show selected user details
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Credit Balance Section */}
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h3 className="text-sm font-semibold mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                        Credit Balance
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Available</p>
                          <p className="font-medium text-xl">
                            {users && selectedUser ? 
                              users.find(u => u.id === selectedUser)?.credits ?? 0 
                              : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Total Used</p>
                          <p className="font-medium text-xl">
                            {users && selectedUser ? 
                              users.find(u => u.id === selectedUser)?.totalCreditsUsed ?? 0 
                              : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Section */}
                    {isLoadingUserProgress ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : userProgressError ? (
                      <p className="text-sm text-red-500">Error loading user progress</p>
                    ) : !userProgress ? (
                      <p className="text-sm text-gray-500">No performance data available</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Coaching Performance</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500">Communication</p>
                              <p className="font-medium">{userProgress.communicationScoreAvg}/10</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Engagement</p>
                              <p className="font-medium">{userProgress.engagementScoreAvg}/10</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Instruction</p>
                              <p className="font-medium">{userProgress.instructionScoreAvg}/10</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Overall</p>
                              <p className="font-medium">{userProgress.overallScoreAvg}/10</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Activity</h3>
                          <div>
                            <p className="text-gray-500">Sessions Analyzed</p>
                            <p className="font-medium">{userProgress.sessionsCount}</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-500">Weekly Improvement</p>
                            <p className="font-medium">
                              {userProgress.weeklyImprovement > 0 ? '+' : ''}
                              {userProgress.weeklyImprovement}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Tabs defaultValue="userVideos">
                  <TabsList className="w-full">
                    <TabsTrigger value="userVideos" className="flex-1">Videos</TabsTrigger>
                    <TabsTrigger value="userFeedbacks" className="flex-1">Feedbacks</TabsTrigger>
                    <TabsTrigger value="userCredits" className="flex-1">Credits</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="userVideos" className="mt-4">
                    {isLoadingUserVideos ? (
                      <div className="flex justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : userVideosError ? (
                      <div className="text-center p-6 text-red-500">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Error loading user videos</p>
                      </div>
                    ) : !userVideos || userVideos.length === 0 ? (
                      <div className="text-center p-6 text-gray-500">
                        <FileVideo className="h-6 w-6 mx-auto mb-2" />
                        <p>No videos found for this user</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userVideos.map((video) => (
                          <Card key={video.id}>
                            <div className="p-4 flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{video.title}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(video.filesize)} | 
                                  {video.duration ? ` ${formatDuration(video.duration)} | ` : ' '}
                                  {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Unknown date'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={video.status} />
                                <Button
                                  onClick={() => analyzeAudioMutation.mutate(video.id)}
                                  disabled={
                                    analyzeAudioMutation.isPending || 
                                    video.status === "processing" || 
                                    video.status === "in_queue" ||
                                    video.status === "file_missing"
                                  }
                                  variant="outline"
                                  size="sm"
                                >
                                  Analyze
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="userFeedbacks" className="mt-4">
                    {isLoadingUserFeedbacks ? (
                      <div className="flex justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : userFeedbacksError ? (
                      <div className="text-center p-6 text-red-500">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Error loading user feedbacks</p>
                      </div>
                    ) : !userFeedbacks || userFeedbacks.length === 0 ? (
                      <div className="text-center p-6 text-gray-500">
                        <FileVideo className="h-6 w-6 mx-auto mb-2" />
                        <p>No feedbacks found for this user</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userFeedbacks.map((feedback) => (
                          <Card key={feedback.id}>
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">Feedback #{feedback.id}</h3>
                                <Badge>Video #{feedback.videoId}</Badge>
                              </div>
                              <p className="text-sm mb-2">{feedback.summary}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">Overall: {feedback.overallScore}/10</Badge>
                                <Badge variant="outline">Communication: {feedback.communicationScore}/10</Badge>
                                <Badge variant="outline">Engagement: {feedback.engagementScore}/10</Badge>
                                <Badge variant="outline">Instruction: {feedback.instructionScore}/10</Badge>
                              </div>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 h-auto text-xs mt-2"
                                onClick={() => {
                                  const strengths = JSON.parse(feedback.strengths as string);
                                  const improvements = JSON.parse(feedback.improvements as string);
                                  toast({
                                    title: "Feedback Details",
                                    description: (
                                      <div>
                                        <p className="mb-2">{feedback.feedback}</p>
                                        <div className="mb-1 mt-2">
                                          <strong>Strengths:</strong>
                                          <ul>
                                            {strengths.slice(0, 3).map((s: string, i: number) => (
                                              <li key={i}>• {s}</li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div>
                                          <strong>Improvements:</strong>
                                          <ul>
                                            {improvements.slice(0, 3).map((s: string, i: number) => (
                                              <li key={i}>• {s}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    ),
                                    duration: 10000,
                                  });
                                }}
                              >
                                View Full Details
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="userCredits" className="mt-4">
                    {isLoadingUserCreditTransactions ? (
                      <div className="flex justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : userCreditTransactionsError ? (
                      <div className="text-center p-6 text-red-500">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>Error loading credit transactions</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Credit Management */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <PlusCircle className="h-5 w-5 mr-2 text-emerald-500" />
                                Add Credits
                              </CardTitle>
                              <CardDescription>Add credits to this user's account</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="addCreditsAmount">Amount</Label>
                                  <Input
                                    id="addCreditsAmount"
                                    type="number"
                                    placeholder="1.00"
                                    value={addCreditsAmount}
                                    onChange={(e) => setAddCreditsAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="addCreditsReason">Reason (optional)</Label>
                                  <Input
                                    id="addCreditsReason"
                                    placeholder="e.g. Credit purchase, bonus, promotion"
                                    value={addCreditsReason}
                                    onChange={(e) => setAddCreditsReason(e.target.value)}
                                  />
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                className="w-full"
                                onClick={() => addCreditsMutation.mutate(selectedUser as number)}
                                disabled={addCreditsMutation.isPending || !addCreditsAmount}
                              >
                                {addCreditsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-2" />
                                )}
                                Add Credits
                              </Button>
                            </CardFooter>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <MinusCircle className="h-5 w-5 mr-2 text-rose-500" />
                                Deduct Credits
                              </CardTitle>
                              <CardDescription>Remove credits from this user's account</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="deductCreditsAmount">Amount</Label>
                                  <Input
                                    id="deductCreditsAmount"
                                    type="number"
                                    placeholder="1.00"
                                    value={deductCreditsAmount}
                                    onChange={(e) => setDeductCreditsAmount(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="deductCreditsReason">Reason (optional)</Label>
                                  <Input
                                    id="deductCreditsReason"
                                    placeholder="e.g. Manual adjustment, refund"
                                    value={deductCreditsReason}
                                    onChange={(e) => setDeductCreditsReason(e.target.value)}
                                  />
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                className="w-full"
                                variant="destructive"
                                onClick={() => deductCreditsMutation.mutate(selectedUser as number)}
                                disabled={deductCreditsMutation.isPending || !deductCreditsAmount}
                              >
                                {deductCreditsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4 mr-2" />
                                )}
                                Deduct Credits
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                        
                        {/* Credit Transactions History */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                              Credit Transaction History
                            </CardTitle>
                            <CardDescription>History of all credit transactions for this user</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {!userCreditTransactions || userCreditTransactions.length === 0 ? (
                              <div className="text-center p-6 text-gray-500">
                                <DollarSign className="h-6 w-6 mx-auto mb-2" />
                                <p>No credit transactions found for this user</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {userCreditTransactions.map((transaction) => (
                                  <div 
                                    key={transaction.id} 
                                    className="p-3 border rounded-md flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-medium flex items-center">
                                        {transaction.type === 'add' ? (
                                          <PlusCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                        ) : (
                                          <MinusCircle className="h-4 w-4 mr-2 text-rose-500" />
                                        )}
                                        {transaction.type === 'add' ? 'Added' : 'Deducted'} {transaction.amount} credits
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {transaction.description || 'No description provided'}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'Unknown date'}
                                      </div>
                                    </div>
                                    <div>
                                      {transaction.videoId && (
                                        <Badge variant="outline" className="text-xs">
                                          Video #{transaction.videoId}
                                        </Badge>
                                      )}
                                      {transaction.paymentId && (
                                        <Badge variant="outline" className="text-xs ml-1">
                                          Payment #{transaction.paymentId}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Content Management</h2>
          
          {editingContent ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Editing: {editingContent.title}</span>
                  <Button variant="ghost" size="sm" onClick={() => setEditingContent(null)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input 
                      id="title" 
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Page Content</Label>
                    <Textarea 
                      id="content" 
                      rows={10}
                      value={editingContent.content}
                      onChange={(e) => setEditingContent({...editingContent, content: e.target.value})}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingContent(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setContentPages(contentPages.map(page => 
                      page.id === editingContent.id 
                        ? {...page, title: editingContent.title, content: editingContent.content, lastModified: new Date()} 
                        : page
                    ));
                    setEditingContent(null);
                    toast({
                      title: "Content Saved",
                      description: "The page content has been updated successfully."
                    });
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground">Manage website content pages</p>
                <Button onClick={() => {
                  const newId = Math.max(0, ...contentPages.map(p => p.id)) + 1;
                  setEditingContent({
                    id: newId,
                    title: "New Page",
                    content: "Add your content here..."
                  });
                  setContentPages([...contentPages, {
                    id: newId,
                    title: "New Page", 
                    slug: `page-${newId}`,
                    content: "Add your content here...",
                    isPublished: false,
                    lastModified: new Date()
                  }]);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Page
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentPages.map(page => (
                  <Card key={page.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{page.title}</CardTitle>
                        <Badge variant={page.isPublished ? "default" : "outline"}>
                          {page.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <CardDescription>/{page.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-2">{page.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last modified: {page.lastModified ? page.lastModified.toLocaleDateString() : 'Unknown date'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const updatedPages = contentPages.map(p => 
                            p.id === page.id ? {...p, isPublished: !p.isPublished} : p
                          );
                          setContentPages(updatedPages);
                          toast({
                            title: page.isPublished ? "Page Unpublished" : "Page Published",
                            description: `"${page.title}" is now ${page.isPublished ? "unpublished" : "published"}.`
                          });
                        }}
                      >
                        {page.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <div className="space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingContent({
                            id: page.id,
                            title: page.title,
                            content: page.content
                          })}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            if (page.slug === "home" || page.slug === "about" || page.slug === "privacy" || page.slug === "terms") {
                              toast({
                                title: "Cannot Delete",
                                description: "System pages cannot be deleted.",
                                variant: "destructive"
                              });
                              return;
                            }
                            setContentPages(contentPages.filter(p => p.id !== page.id));
                            toast({
                              title: "Page Deleted",
                              description: `"${page.title}" has been deleted.`
                            });
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Website Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic website settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input 
                    id="siteName" 
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input 
                    id="tagline" 
                    value={siteSettings.tagline}
                    onChange={(e) => setSiteSettings({...siteSettings, tagline: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Site Description</Label>
                <Textarea 
                  id="description" 
                  value={siteSettings.description}
                  onChange={(e) => setSiteSettings({...siteSettings, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input 
                  id="contactEmail" 
                  type="email"
                  value={siteSettings.contactEmail}
                  onChange={(e) => setSiteSettings({...siteSettings, contactEmail: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableRegistration">Enable User Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
                </div>
                <Switch 
                  id="enableRegistration"
                  checked={siteSettings.enableRegistration}
                  onCheckedChange={(checked) => setSiteSettings({...siteSettings, enableRegistration: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put the site in maintenance mode (only admins can access)</p>
                </div>
                <Switch 
                  id="maintenanceMode"
                  checked={siteSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSiteSettings({...siteSettings, maintenanceMode: checked})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                <Input 
                  id="maxUploadSize" 
                  type="number"
                  min="1"
                  max="2000"
                  value={siteSettings.maxUploadSize}
                  onChange={(e) => setSiteSettings({...siteSettings, maxUploadSize: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aiProvider">AI Provider</Label>
                <Select 
                  value={siteSettings.aiProvider}
                  onValueChange={(value) => setSiteSettings({...siteSettings, aiProvider: value})}
                >
                  <SelectTrigger id="aiProvider">
                    <SelectValue placeholder="Select an AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Azure">Azure OpenAI</SelectItem>
                    <SelectItem value="Anthropic">Anthropic</SelectItem>
                    <SelectItem value="Local">Local Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultPricingTier">Default Pricing Tier</Label>
                <Select 
                  value={siteSettings.defaultPricingTier}
                  onValueChange={(value) => setSiteSettings({...siteSettings, defaultPricingTier: value})}
                >
                  <SelectTrigger id="defaultPricingTier">
                    <SelectValue placeholder="Select default pricing tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto"
                onClick={() => {
                  // Here we would normally save to the backend
                  toast({
                    title: "Settings Saved",
                    description: "Your website settings have been updated successfully."
                  });
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "purple" = "outline";
  let label = status;
  
  switch (status) {
    case "completed":
      variant = "default";
      break;
    case "processing":
      variant = "secondary";
      break;
    case "failed":
      variant = "destructive";
      break;
    case "quota_exceeded":
      variant = "destructive";
      label = "API Quota Exceeded";
      break;
    case "api_key_invalid":
      variant = "destructive";
      label = "Invalid API Key";
      break;
    case "file_missing":
      variant = "purple";
      label = "File Missing";
      break;
    case "uploaded":
      variant = "outline";
      break;
  }
  
  return <Badge variant={variant}>{label}</Badge>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "N/A";
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}