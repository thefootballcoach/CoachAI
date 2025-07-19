import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Database, Users, Video, FileText, CreditCard, BarChart3, Trash2, Plus, Edit, Save, X } from "lucide-react";

interface DatabaseStats {
  users: number;
  videos: number;
  feedbacks: number;
  transactions: number;
  processing: number;
  completed: number;
  failed: number;
  totalCreditsUsed: number;
  totalCreditsAvailable: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  credits: number;
  totalCreditsUsed: number;
  createdAt: string;
}

interface Video {
  id: number;
  userId: number;
  title: string;
  status: string;
  duration: number;
  filesize: number;
  createdAt: string;
}

interface Feedback {
  id: number;
  videoId: number;
  userId: number;
  overallScore: number;
  communicationScore: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function AdminDatabasePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Database stats query
  const { data: stats, isLoading: statsLoading } = useQuery<DatabaseStats>({
    queryKey: ['/api/admin/database/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Users query
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/database/users'],
    enabled: selectedTab === 'users'
  });

  // Videos query
  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['/api/admin/database/videos'],
    enabled: selectedTab === 'videos'
  });

  // Feedbacks query
  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery<Feedback[]>({
    queryKey: ['/api/admin/database/feedbacks'],
    enabled: selectedTab === 'feedbacks'
  });

  // Transactions query
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/database/transactions'],
    enabled: selectedTab === 'transactions'
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number, amount: number, reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/database/user/${userId}/credits`, { amount, reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
      toast({ title: "Success", description: "Credits added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/database/video/${videoId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
      toast({ title: "Success", description: "Video deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update feedback mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ feedbackId, data }: { feedbackId: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/database/feedback/${feedbackId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/feedbacks'] });
      toast({ title: "Success", description: "Feedback updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete feedback mutation (deletes entire session)
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/database/feedback/${feedbackId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/videos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database/stats'] });
      toast({ title: "Success", description: "Session deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const AddCreditsDialog = ({ user }: { user: User }) => {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [open, setOpen] = useState(false);

    const handleSubmit = () => {
      if (!amount || !reason) return;
      addCreditsMutation.mutate({ 
        userId: user.id, 
        amount: parseInt(amount), 
        reason 
      });
      setOpen(false);
      setAmount("");
      setReason("");
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Credits
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits to {user.username}</DialogTitle>
            <DialogDescription>
              Add credits to user account for video analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter credit amount"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for adding credits"
              />
            </div>
            <Button onClick={handleSubmit} disabled={!amount || !reason}>
              Add Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Feedback editing component
  const FeedbackEditCard = ({ feedback }: { feedback: Feedback }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      overallScore: feedback.overallScore || 0,
      communicationScore: feedback.communicationScore || 0,
      engagementScore: feedback.engagementScore || 0,
      instructionScore: feedback.instructionScore || 0,
      questioningScore: feedback.questioningScore || 0,
      feedback: feedback.feedback || '',
      summary: feedback.summary || ''
    });

    const handleSave = () => {
      updateFeedbackMutation.mutate({ 
        feedbackId: feedback.id, 
        data: editData 
      });
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditData({
        overallScore: feedback.overallScore || 0,
        communicationScore: feedback.communicationScore || 0,
        engagementScore: feedback.engagementScore || 0,
        instructionScore: feedback.instructionScore || 0,
        questioningScore: feedback.questioningScore || 0,
        feedback: feedback.feedback || '',
        summary: feedback.summary || ''
      });
      setIsEditing(false);
    };

    return (
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Analysis #{feedback.id}</div>
            <div className="text-sm text-muted-foreground">
              Video ID: {feedback.videoId} | User ID: {feedback.userId}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={updateFeedbackMutation.isPending}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteFeedbackMutation.mutate(feedback.id)}
                  title="Delete entire session"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Overall Score</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editData.overallScore}
                onChange={(e) => setEditData({...editData, overallScore: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Communication Score</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={editData.communicationScore}
                onChange={(e) => setEditData({...editData, communicationScore: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Engagement Score</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={editData.engagementScore}
                onChange={(e) => setEditData({...editData, engagementScore: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Instruction Score</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={editData.instructionScore}
                onChange={(e) => setEditData({...editData, instructionScore: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Questioning Score</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={editData.questioningScore}
                onChange={(e) => setEditData({...editData, questioningScore: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="col-span-2">
              <Label>Summary</Label>
              <Input
                value={editData.summary}
                onChange={(e) => setEditData({...editData, summary: e.target.value})}
                placeholder="Analysis summary"
              />
            </div>
            <div className="col-span-2">
              <Label>Detailed Feedback</Label>
              <Textarea
                value={editData.feedback}
                onChange={(e) => setEditData({...editData, feedback: e.target.value})}
                placeholder="Detailed feedback content"
                rows={4}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <strong>Scores:</strong> Overall: {feedback.overallScore || 'N/A'} | 
              Communication: {feedback.communicationScore || 'N/A'} | 
              Engagement: {feedback.engagementScore || 'N/A'}
            </div>
            <div className="text-sm">
              <strong>More Scores:</strong> Instruction: {feedback.instructionScore || 'N/A'} | 
              Questioning: {feedback.questioningScore || 'N/A'}
            </div>
            {feedback.summary && (
              <div className="col-span-2 text-sm">
                <strong>Summary:</strong> {feedback.summary}
              </div>
            )}
            {feedback.feedback && (
              <div className="col-span-2 text-sm">
                <strong>Feedback:</strong> {feedback.feedback.substring(0, 200)}...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground">Admin-only PostgreSQL backend administration</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.videos || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.processing || 0} processing, {stats?.completed || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.feedbacks || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credit System</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCreditsAvailable || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalCreditsUsed || 0} used
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time database statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Processing Queue</span>
                <Badge variant={stats?.processing === 0 ? "default" : "secondary"}>
                  {stats?.processing || 0} videos
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Failed Analyses</span>
                <Badge variant={stats?.failed === 0 ? "default" : "destructive"}>
                  {stats?.failed || 0} videos
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Transactions</span>
                <span>{stats?.transactions || 0}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and credits</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-sm">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          <span className="ml-2">Credits: {user.credits || 0}</span>
                          <span className="ml-2">Used: {user.totalCreditsUsed || 0}</span>
                        </div>
                      </div>
                      <AddCreditsDialog user={user} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Management</CardTitle>
              <CardDescription>Manage uploaded videos and processing status</CardDescription>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <div>Loading videos...</div>
              ) : (
                <div className="space-y-4">
                  {videos?.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{video.title}</div>
                        <div className="text-sm text-muted-foreground">
                          User ID: {video.userId} | Size: {Math.round(video.filesize / 1024 / 1024)}MB
                          {video.duration && ` | Duration: ${Math.round(video.duration / 60)}min`}
                        </div>
                        <Badge variant={
                          video.status === 'completed' ? 'default' :
                          video.status === 'processing' ? 'secondary' :
                          video.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {video.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteVideoMutation.mutate(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Management</CardTitle>
              <CardDescription>Edit and manage coaching analysis results</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacksLoading ? (
                <div>Loading feedbacks...</div>
              ) : (
                <div className="space-y-4">
                  {feedbacks?.map((feedback) => (
                    <FeedbackEditCard key={feedback.id} feedback={feedback} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Transactions</CardTitle>
              <CardDescription>Monitor credit usage and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div>Loading transactions...</div>
              ) : (
                <div className="space-y-4">
                  {transactions?.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          User ID: {transaction.userId} | Type: {transaction.type}
                        </div>
                        <div className="text-sm">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={transaction.amount > 0 ? 'default' : 'secondary'}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}