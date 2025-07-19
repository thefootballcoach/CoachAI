import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  Building2, 
  Video, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  Shield, 
  Database,
  Activity,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Eye,
  Lock,
  Unlock,
  Key,
  UserCheck,
  UserX,
  DollarSign,
  BarChart3,
  Globe,
  Server,
  Clock,
  Mail,
  FileText,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "wouter";

interface SuperAdminStats {
  totalUsers: number;
  totalClubs: number;
  totalVideos: number;
  totalFeedbacks: number;
  totalTransactions: number;
  systemHealth: {
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    activeConnections: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

interface UserManagement {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  clubId: number;
  clubName: string;
  isActive: boolean;
  lastLogin: string;
  totalVideos: number;
  totalCredits: number;
  subscriptionStatus: string;
  createdAt: string;
}

interface ClubManagement {
  id: number;
  name: string;
  type: string;
  country: string;
  totalCoaches: number;
  totalVideos: number;
  isActive: boolean;
  createdAt: string;
  logoUrl: string;
}

interface SystemSettings {
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubManagement | null>(null);
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newContent, setNewContent] = useState({
    title: "",
    slug: "",
    type: "article",
    content: "",
    status: "draft",
    author: "",
    excerpt: ""
  });
  const { toast } = useToast();

  // Fetch super admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<SuperAdminStats>({
    queryKey: ["/api/super-admin/stats"],
  });

  // Fetch all users for management
  const { data: users, isLoading: usersLoading } = useQuery<UserManagement[]>({
    queryKey: ["/api/super-admin/users"],
  });

  // Fetch all clubs for management
  const { data: clubs, isLoading: clubsLoading } = useQuery<ClubManagement[]>({
    queryKey: ["/api/super-admin/clubs"],
  });

  // Fetch system settings
  const { data: systemSettings, isLoading: settingsLoading } = useQuery<SystemSettings[]>({
    queryKey: ["/api/super-admin/settings"],
  });

  // Fetch content for management
  const { data: contentList, isLoading: contentLoading } = useQuery<any[]>({
    queryKey: ["/api/content"],
  });

  // User management mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/super-admin/users/${userId}/status`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    },
  });

  const updateUserCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits, operation }: { userId: number; credits: number; operation: 'add' | 'set' }) => {
      const res = await apiRequest("PUT", `/api/super-admin/users/${userId}/credits`, { credits, operation });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User credits updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update user credits", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/super-admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const assignUserToClubMutation = useMutation({
    mutationFn: async ({ userId, clubId }: { userId: number; clubId: number | null }) => {
      const res = await apiRequest("PUT", `/api/super-admin/users/${userId}/club`, { clubId });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User club assignment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update club assignment", variant: "destructive" });
    },
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/super-admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to update user role", variant: "destructive" });
    },
  });

  const resetUserPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await apiRequest("PUT", `/api/super-admin/users/${userId}/password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "User password reset successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to reset user password", variant: "destructive" });
    },
  });

  // Club management mutations
  const toggleClubStatusMutation = useMutation({
    mutationFn: async ({ clubId, isActive }: { clubId: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/super-admin/clubs/${clubId}/status`, { isActive });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Club status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clubs"] });
    },
    onError: () => {
      toast({ title: "Failed to update club status", variant: "destructive" });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: number) => {
      const res = await apiRequest("DELETE", `/api/super-admin/clubs/${clubId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Club deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clubs"] });
    },
    onError: () => {
      toast({ title: "Failed to delete club", variant: "destructive" });
    },
  });

  // System settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/super-admin/settings/${key}`, { value });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Setting updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/settings"] });
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    },
  });

  // Content management mutations
  const createContentMutation = useMutation({
    mutationFn: async (contentData: any) => {
      const res = await apiRequest("POST", "/api/content", contentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Content created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setNewContent({
        title: "",
        slug: "",
        type: "article",
        content: "",
        status: "draft",
        author: "",
        excerpt: ""
      });
    },
    onError: () => {
      toast({ title: "Failed to create content", variant: "destructive" });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, ...contentData }: any) => {
      const res = await apiRequest("PATCH", `/api/content/${id}`, contentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Content updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setSelectedContent(null);
    },
    onError: () => {
      toast({ title: "Failed to update content", variant: "destructive" });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const res = await apiRequest("DELETE", `/api/content/${contentId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Content deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
    },
    onError: () => {
      toast({ title: "Failed to delete content", variant: "destructive" });
    },
  });

  // Filter users based on search and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && user.isActive) ||
                         (filterStatus === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter clubs based on search
  const filteredClubs = clubs?.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-slate-300 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Super Admin Panel</h1>
                <p className="text-sm text-slate-600">Complete platform management and oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <Lock className="w-3 h-3 mr-1" />
                Restricted Access
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="clubs" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Clubs
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black mb-2">{stats?.totalUsers || 0}</div>
                  <div className="flex items-center text-blue-100 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    All platform users
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-100">Total Clubs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black mb-2">{stats?.totalClubs || 0}</div>
                  <div className="flex items-center text-emerald-100 text-sm">
                    <Building2 className="w-4 h-4 mr-1" />
                    Registered clubs
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">Total Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black mb-2">{stats?.totalVideos || 0}</div>
                  <div className="flex items-center text-purple-100 text-sm">
                    <Video className="w-4 h-4 mr-1" />
                    Uploaded content
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">Total Feedbacks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black mb-2">{stats?.totalFeedbacks || 0}</div>
                  <div className="flex items-center text-orange-100 text-sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    AI analyses
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-100">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black mb-2">{stats?.totalTransactions || 0}</div>
                  <div className="flex items-center text-red-100 text-sm">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Payment records
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats?.systemHealth?.uptime || "0h"}</div>
                    <div className="text-sm text-slate-600">Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats?.systemHealth?.memoryUsage || 0}%</div>
                    <div className="text-sm text-slate-600">Memory Usage</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats?.systemHealth?.cpuUsage || 0}%</div>
                    <div className="text-sm text-slate-600">CPU Usage</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats?.systemHealth?.diskUsage || 0}%</div>
                    <div className="text-sm text-slate-600">Disk Usage</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{stats?.systemHealth?.activeConnections || 0}</div>
                    <div className="text-sm text-slate-600">Active Connections</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {stats?.recentActivity?.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Badge variant={activity.severity === 'error' ? 'destructive' : activity.severity === 'warning' ? 'secondary' : 'default'}>
                          {activity.severity}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                          <p className="text-xs text-slate-600">{format(new Date(activity.timestamp), 'PPp')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage all platform users with complete administrative control
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="head_coach">Head Coach</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name || user.username}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{user.clubName || "No Club"}</TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.totalVideos}</TableCell>
                          <TableCell>{user.totalCredits}</TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {user.lastLogin ? format(new Date(user.lastLogin), 'PP') : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Building2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign Club</DialogTitle>
                                    <DialogDescription>
                                      Assign {user.name || user.username} to a club
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Select Club</Label>
                                      <Select onValueChange={(value) => assignUserToClubMutation.mutate({
                                        userId: user.id,
                                        clubId: value === "none" ? null : parseInt(value)
                                      })}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose a club" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">No Club</SelectItem>
                                          {clubs?.map((club) => (
                                            <SelectItem key={club.id} value={club.id.toString()}>
                                              {club.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Change Role</DialogTitle>
                                    <DialogDescription>
                                      Change role for {user.name || user.username}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Select Role</Label>
                                      <Select onValueChange={(value) => changeUserRoleMutation.mutate({
                                        userId: user.id,
                                        role: value
                                      })}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="coach">Coach</SelectItem>
                                          <SelectItem value="head_coach">Head Coach</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="academy_director">Academy Director</SelectItem>
                                          <SelectItem value="technical_director">Technical Director</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Key className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reset Password</DialogTitle>
                                    <DialogDescription>
                                      Reset password for {user.name || user.username}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>New Password</Label>
                                      <Input
                                        type="password"
                                        placeholder="Enter new password (min 6 characters)"
                                        onChange={(e) => {
                                          const newPassword = e.target.value;
                                          if (newPassword.length >= 6) {
                                            resetUserPasswordMutation.mutate({
                                              userId: user.id,
                                              newPassword
                                            });
                                          }
                                        }}
                                      />
                                      <div className="text-xs text-slate-500 mt-1">
                                        Password must be at least 6 characters long
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                variant={user.isActive ? "destructive" : "default"}
                                onClick={() => toggleUserStatusMutation.mutate({
                                  userId: user.id,
                                  isActive: !user.isActive
                                })}
                              >
                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clubs Management Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Club Management
                </CardTitle>
                <CardDescription>
                  Oversee all registered clubs and their activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <Input
                    placeholder="Search clubs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {/* Clubs Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Coaches</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClubs?.map((club) => (
                        <TableRow key={club.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {club.logoUrl && (
                                <img 
                                  src={club.logoUrl} 
                                  alt={club.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div className="font-medium">{club.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{club.type}</Badge>
                          </TableCell>
                          <TableCell>{club.country}</TableCell>
                          <TableCell>{club.totalCoaches}</TableCell>
                          <TableCell>{club.totalVideos}</TableCell>
                          <TableCell>
                            <Badge variant={club.isActive ? "default" : "secondary"}>
                              {club.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {format(new Date(club.createdAt), 'PP')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedClub(club)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleClubStatusMutation.mutate({
                                  clubId: club.id,
                                  isActive: !club.isActive
                                })}
                              >
                                {club.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteClubMutation.mutate(club.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Content Management
                </CardTitle>
                <CardDescription>
                  Create and manage platform content, articles, and educational materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Content Creation Form */}
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Create New Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        placeholder="Enter content title"
                        value={newContent.title}
                        onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        placeholder="Enter URL slug"
                        value={newContent.slug}
                        onChange={(e) => setNewContent({...newContent, slug: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newContent.type}
                        onValueChange={(value) => setNewContent({...newContent, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Content</Label>
                      <textarea
                        className="w-full h-32 p-3 border rounded-md"
                        placeholder="Enter content body"
                        value={newContent.content}
                        onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={newContent.status}
                        onValueChange={(value) => setNewContent({...newContent, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Author</Label>
                      <Input
                        placeholder="Content author"
                        value={newContent.author}
                        onChange={(e) => setNewContent({...newContent, author: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button 
                    className="mt-4"
                    onClick={() => createContentMutation.mutate(newContent)}
                    disabled={!newContent.title || !newContent.slug || !newContent.content}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Content
                  </Button>
                </div>

                {/* Content List */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentList?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                            No content available. Create your first piece of content above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        contentList?.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell>
                              <div className="font-medium">{content.title}</div>
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {content.excerpt || content.content?.substring(0, 100) + '...'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{content.type}</Badge>
                            </TableCell>
                            <TableCell>{content.author}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  content.status === 'published' ? 'default' : 
                                  content.status === 'draft' ? 'secondary' : 'destructive'
                                }
                              >
                                {content.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {content.createdAt ? format(new Date(content.createdAt), 'PP') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedContent(content)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteContentMutation.mutate(content.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Management Tab */}
          <TabsContent value="system" className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.systemHealth?.uptime || '0h 0m'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Continuous operation
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.systemHealth?.memoryUsage || 0}%
                  </div>
                  <p className="text-xs text-slate-500">
                    Server memory utilization
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.systemHealth?.cpuUsage || 0}%
                  </div>
                  <p className="text-xs text-slate-500">
                    Processing load
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.systemHealth?.activeConnections || 0}
                  </div>
                  <p className="text-xs text-slate-500">
                    User sessions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* System Settings Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Manage platform-wide settings and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemSettings?.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{setting.key}</Label>
                        <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                        <p className="text-xs text-slate-400">
                          Category: {setting.category} | Last updated: {setting.updatedAt ? format(new Date(setting.updatedAt), 'PPp') : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={setting.value}
                          onChange={(e) => updateSettingMutation.mutate({
                            key: setting.key,
                            value: e.target.value
                          })}
                          className="w-40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent System Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent System Activity
                </CardTitle>
                <CardDescription>
                  Monitor system events and important activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.severity === 'error' ? 'bg-red-500' :
                        activity.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.type}</div>
                        <div className="text-xs text-slate-500">{activity.description}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {activity.timestamp ? format(new Date(activity.timestamp), 'PPp') : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <div className="text-center text-slate-500 py-8">
                      No recent system activity recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Monitor database performance and manage data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-slate-600">Total Records</div>
                    <div className="text-2xl font-bold">
                      {(stats?.totalUsers || 0) + (stats?.totalVideos || 0) + (stats?.totalFeedbacks || 0)}
                    </div>
                    <div className="text-xs text-slate-500">Across all tables</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-slate-600">Storage Used</div>
                    <div className="text-2xl font-bold">
                      {stats?.systemHealth?.diskUsage || 0}%
                    </div>
                    <div className="text-xs text-slate-500">Disk utilization</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-medium text-slate-600">Transactions</div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.totalTransactions || 0}
                    </div>
                    <div className="text-xs text-slate-500">Payment records</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure global platform settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemSettings?.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{setting.key}</Label>
                        <p className="text-xs text-slate-500 mt-1">{setting.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={setting.value}
                          onChange={(e) => updateSettingMutation.mutate({
                            key: setting.key,
                            value: e.target.value
                          })}
                          className="w-40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete user information and management options
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <Input value={selectedUser.username} readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={selectedUser.email} readOnly />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input value={selectedUser.name} readOnly />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={selectedUser.role} readOnly />
                  </div>
                  <div>
                    <Label>Credits</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Credits to add"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            updateUserCreditsMutation.mutate({
                              userId: selectedUser.id,
                              credits: parseInt(input.value),
                              operation: 'add'
                            });
                            input.value = '';
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Credits to add"]') as HTMLInputElement;
                          updateUserCreditsMutation.mutate({
                            userId: selectedUser.id,
                            credits: parseInt(input.value),
                            operation: 'add'
                          });
                          input.value = '';
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedUser.isActive}
                        onCheckedChange={(checked) => 
                          toggleUserStatusMutation.mutate({
                            userId: selectedUser.id,
                            isActive: checked
                          })
                        }
                      />
                      <span className="text-sm">{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Club Detail Modal */}
        <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Club Details</DialogTitle>
              <DialogDescription>
                Complete club information and management options
              </DialogDescription>
            </DialogHeader>
            {selectedClub && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Club Name</Label>
                    <Input value={selectedClub.name} readOnly />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input value={selectedClub.type} readOnly />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={selectedClub.country} readOnly />
                  </div>
                  <div>
                    <Label>Total Coaches</Label>
                    <Input value={selectedClub.totalCoaches} readOnly />
                  </div>
                  <div>
                    <Label>Total Videos</Label>
                    <Input value={selectedClub.totalVideos} readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedClub.isActive}
                        onCheckedChange={(checked) => 
                          toggleClubStatusMutation.mutate({
                            clubId: selectedClub.id,
                            isActive: checked
                          })
                        }
                      />
                      <span className="text-sm">{selectedClub.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}