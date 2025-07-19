import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Target, 
  Award,
  Activity,
  BarChart3,
  UserPlus,
  Plus,
  Search,
  Filter,
  Download,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  GraduationCap,
  Zap,
  Camera,
  ArrowLeft,
  ArrowRight,
  Eye,
  Edit,
  Home,
  Loader2,
  Trash2,
  Video,
  Settings,
  Shield,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Club, Team, Player, TrainingSession, User } from "@shared/schema";
import { CoachProfileModal } from "@/components/coach-profile-modal";
import InviteUserModal from "@/components/invite-user-modal";
import PendingInvitations from "@/components/dashboard/pending-invitations";
import { insertUserSchema } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageCropModal from "@/components/ui/image-crop-modal";

// Form schema for editing club information
const clubEditSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  type: z.string().min(1, "Club type is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  contactEmail: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
});

type ClubEditForm = z.infer<typeof clubEditSchema>;

// Form schema for adding new coach
const addCoachSchema = insertUserSchema.pick({
  username: true,
  email: true,
  name: true,
  password: true,
}).extend({
  role: z.enum(["coach", "head_coach", "assistant_coach"]).default("coach"),
  licenseLevel: z.enum(["uefa_pro", "uefa_a", "uefa_b", "uefa_c", "grassroots", "youth"]).optional(),
  position: z.enum(["goalkeeper_coach", "attacking_coach", "defensive_coach", "fitness_coach", "technical_coach"]).optional(),
  ageGroup: z.enum(["u8", "u10", "u12", "u14", "u16", "u18", "u21", "senior"]).optional(),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddCoachForm = z.infer<typeof addCoachSchema>;

// Form schema for editing existing coach
const editCoachSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["coach", "head_coach", "admin"]),
  licenseLevel: z.enum(["UEFA A", "UEFA B", "UEFA C", "Youth", "Grassroots", "Other"]).optional(),
  position: z.string().optional(),
  ageGroup: z.enum(["U6-U8", "U9-U11", "U12-U14", "U15-U17", "U18-U21", "Senior", "All Ages"]).optional(),
});

type EditCoachForm = z.infer<typeof editCoachSchema>;

interface ClubStats {
  totalCoaches: number;
  totalTeams: number;
  totalPlayers: number;
  totalSessions: number;
  avgCoachingScore: number;
  activeSeasonProgress: number;
  topPerformingTeam: string;
  recentActivity: number;
}

interface CoachPerformance {
  id: number;
  name: string;
  email: string;
  role: string;
  teams: number;
  sessions: number;
  avgScore: number;
  improvement: number;
  specialty: string;
  licenseLevel: string;
  ageGroup?: string;
  coachingBadges?: string[];
  position?: string;
  yearsExperience?: number;
  profilePicture?: string;
}



export default function ClubDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<string>("month");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<number>(0);
  const [isCoachProfileOpen, setIsCoachProfileOpen] = useState(false);
  const [isAddCoachModalOpen, setIsAddCoachModalOpen] = useState(false);
  const [editCoachModalOpen, setEditCoachModalOpen] = useState(false);
  const [selectedCoachForEdit, setSelectedCoachForEdit] = useState<number>(0);
  const [isCoachSessionsOpen, setIsCoachSessionsOpen] = useState(false);
  const [selectedCoachForSessions, setSelectedCoachForSessions] = useState<number>(0);
  const [deleteCoachId, setDeleteCoachId] = useState<number>(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check user role for access control
  const isHeadOfCoaching = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'head_of_coaching' || user?.role === 'club_admin' || user?.position === 'head_coach' || user?.position === 'academy_director';
  const isRegularCoach = user?.role === 'coach' && !isHeadOfCoaching;

  // Fetch club data with role-based access control
  const { data: clubStats, isLoading: statsLoading } = useQuery<ClubStats>({
    queryKey: ["/api/club/stats", timeRange],
    enabled: isHeadOfCoaching, // Only heads of coaching see full club stats
  });

  const { data: coachPerformance, isLoading: coachLoading } = useQuery<CoachPerformance[]>({
    queryKey: ["/api/club/coaches/performance", timeRange],
    enabled: isHeadOfCoaching, // Only heads of coaching see all coach performance
  });



  const { data: clubInfo } = useQuery<Club>({
    queryKey: ["/api/club/info"],
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/club/recent-activity"],
    enabled: isHeadOfCoaching, // Only heads of coaching see all recent activity
  });

  const { data: performanceAverages } = useQuery<any>({
    queryKey: ["/api/club/performance/averages"],
    enabled: isHeadOfCoaching, // Only heads of coaching see performance averages
  });

  // Shared content for all coaches (curriculum, CPD materials)
  const { data: sharedContent = [], isLoading: sharedContentLoading } = useQuery<any[]>({
    queryKey: [`/api/coach/shared-content`],
  });

  // Fetch selected coach's sessions and feedback
  const { data: coachSessions = [], isLoading: coachSessionsLoading } = useQuery<any[]>({
    queryKey: [`/api/club/coach-sessions/${selectedCoachForSessions}`],
    enabled: selectedCoachForSessions > 0 && isCoachSessionsOpen,
  });

  const { data: coachFeedbacks = [], isLoading: coachFeedbacksLoading } = useQuery<any[]>({
    queryKey: [`/api/club/coach-feedbacks/${selectedCoachForSessions}`],
    enabled: selectedCoachForSessions > 0 && isCoachSessionsOpen,
  });

  // Initialize form with club data
  const form = useForm<ClubEditForm>({
    resolver: zodResolver(clubEditSchema),
    defaultValues: {
      name: clubInfo?.name || "",
      type: clubInfo?.type || "",
      city: clubInfo?.city || "",
      country: clubInfo?.country || "",
      contactEmail: clubInfo?.contactEmail || "",
      phoneNumber: clubInfo?.phoneNumber || "",
      website: clubInfo?.website || "",
    },
  });



  // Edit coach form
  const editCoachForm = useForm<EditCoachForm>({
    resolver: zodResolver(editCoachSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "coach",
      licenseLevel: undefined,
      position: undefined,
      ageGroup: undefined,
    },
  });

  // Get current coach data for editing
  const selectedCoachData = coachPerformance?.find(coach => coach.id === selectedCoachForEdit);

  // Update form when coach is selected for editing
  React.useEffect(() => {
    if (selectedCoachData && editCoachModalOpen) {
      editCoachForm.reset({
        name: selectedCoachData.name || "",
        email: selectedCoachData.email || "",
        role: selectedCoachData.role as "coach" | "head_coach" | "admin" || "coach",
        licenseLevel: selectedCoachData.licenseLevel as any,
        position: selectedCoachData.position as any,
        ageGroup: selectedCoachData.ageGroup as any,
      });
    }
  }, [selectedCoachData, editCoachModalOpen, editCoachForm]);

  // Club logo upload mutation
  const clubLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/club/logo/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Club logo updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/club/info"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form when club data loads
  React.useEffect(() => {
    if (clubInfo) {
      form.reset({
        name: clubInfo.name || "",
        type: clubInfo.type || "",
        city: clubInfo.city || "",
        country: clubInfo.country || "",
        contactEmail: clubInfo.contactEmail || "",
        phoneNumber: clubInfo.phoneNumber || "",
        website: clubInfo.website || "",
      });
    }
  }, [clubInfo, form]);

  // Mutation for updating club information
  const updateClubMutation = useMutation({
    mutationFn: async (data: ClubEditForm) => {
      const response = await apiRequest("PUT", "/api/club/info", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club/info"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Club information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update club information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClubEditForm) => {
    updateClubMutation.mutate(data);
  };

  // Add coach mutation
  const addCoachMutation = useMutation({
    mutationFn: async (data: AddCoachForm) => {
      console.log("Submitting coach data:", data);
      try {
        const res = await apiRequest("POST", "/api/club/invite-coach", data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to add coach');
        }
        return await res.json();
      } catch (error) {
        console.error("Add coach error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New coach added successfully",
      });
      setIsAddCoachModalOpen(false);
      addCoachForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/club/coaches/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club/stats"] });
    },
    onError: (error: Error) => {
      console.error("Add coach mutation error:", error);
      toast({
        title: "Failed to Add Coach",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAddCoachSubmit = (data: AddCoachForm) => {
    console.log("Form data being submitted:", data);
    console.log("Form errors:", addCoachForm.formState.errors);
    addCoachMutation.mutate(data);
  };

  // Edit coach mutation
  const editCoachMutation = useMutation({
    mutationFn: async (data: EditCoachForm) => {
      const response = await apiRequest("PUT", `/api/users/${selectedCoachForEdit}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Success",
        description: "Coach details updated successfully",
      });
      setEditCoachModalOpen(false);
      setSelectedCoachForEdit(0);
      editCoachForm.reset();
      
      // Force refresh of all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/club/coaches/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club/stats"] });
      queryClient.refetchQueries({ queryKey: ["/api/club/coaches/performance"] });
      
      console.log("Coach updated successfully:", updatedUser);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Coach",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onEditCoachSubmit = (data: EditCoachForm) => {
    editCoachMutation.mutate(data);
  };

  // Delete coach mutation
  const deleteCoachMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const response = await fetch(`/api/club/coaches/${coachId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete coach');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach deleted successfully",
      });
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/club/coaches/performance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/club/recent-activity"] });
      // Force immediate refetch to update the UI
      queryClient.refetchQueries({ queryKey: ["/api/club/coaches/performance"] });
      queryClient.refetchQueries({ queryKey: ["/api/club/stats"] });
      setIsDeleteDialogOpen(false);
      setDeleteCoachId(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coach",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCoach = () => {
    if (deleteCoachId > 0) {
      deleteCoachMutation.mutate(deleteCoachId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header Section with Club Branding */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8">
          {/* Dynamic Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700"></div>
          
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
            }}></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/dashboard">
                <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:border-white/50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Club Logo */}
                <div className="relative group">
                  {isHeadOfCoaching ? (
                    <label className="cursor-pointer block relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // For now, use direct upload without crop modal
                            // TODO: Add crop modal functionality later
                            clubLogoMutation.mutate(file);
                          }
                        }}
                      />
                      
                      {clubInfo?.logo ? (
                        <img 
                          src={clubInfo.logo} 
                          alt={`${clubInfo.name} logo`} 
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl shadow-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center justify-center ring-4 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
                          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                      )}
                      
                      {/* Hover Upload Effect */}
                      <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none">
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-white text-xs font-medium">Upload Logo</span>
                      </div>
                    </label>
                  ) : (
                    <>
                      {clubInfo?.logo ? (
                        <img 
                          src={clubInfo.logo} 
                          alt={`${clubInfo.name} logo`} 
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl shadow-2xl ring-4 ring-white/20"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center justify-center ring-4 ring-white/20">
                          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Club Info */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2 drop-shadow-lg">
                    {clubInfo?.name || "Club Management"}
                  </h1>
                  <p className="text-lg sm:text-xl text-white/90 font-medium">
                    Excellence in Coaching Development
                  </p>
                  {clubInfo && (
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {clubInfo.city}, {clubInfo.country}
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {clubInfo.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {clubInfo.establishedYear && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Est. {clubInfo.establishedYear}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {isHeadOfCoaching && (
                  <Button 
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Club Settings
                  </Button>
                )}
                <Button className="bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-xl transition-all duration-300">
                  <Download className="w-4 h-4 mr-2" />
                  Export Reports
                </Button>
                {/* Only show user management features for admins and management */}
                {isHeadOfCoaching && (
                  <InviteUserModal 
                    trigger={
                      <Button className="bg-purple-700 text-white hover:bg-purple-800 font-semibold shadow-xl transition-all duration-300">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite User
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            {isHeadOfCoaching && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-sm">Total Coaches</p>
                  <p className="text-2xl font-bold text-white">{clubStats?.totalCoaches || 0}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Active Teams</p>
                  <p className="text-2xl font-bold text-white">{clubStats?.totalTeams || 0}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Players</p>
                  <p className="text-2xl font-bold text-white">{clubStats?.totalPlayers || 0}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Avg Score</p>
                  <p className="text-2xl font-bold text-white">{clubStats?.avgCoachingScore || 0}/10</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role-based Performance Metrics */}
        {isHeadOfCoaching ? (
          // Full club stats for heads of coaching
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Total Coaches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{clubStats?.totalCoaches || 0}</div>
                <div className="flex items-center text-emerald-100 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Active Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{clubStats?.totalTeams || 0}</div>
                <div className="flex items-center text-blue-100 text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  Across all age groups
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-100">Avg Coaching Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{clubStats?.avgCoachingScore || 0}/10</div>
                <div className="flex items-center text-orange-100 text-sm">
                  <Star className="w-4 h-4 mr-1" />
                  +0.8 improvement
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Personal stats for regular coaches
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">My Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{mySessions?.length || 0}</div>
                <div className="flex items-center text-blue-100 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Total uploaded
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">My Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{myFeedbacks?.length || 0}</div>
                <div className="flex items-center text-green-100 text-sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Sessions analyzed
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Shared Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black mb-2">{sharedContent?.length || 0}</div>
                <div className="flex items-center text-purple-100 text-sm">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Available resources
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Simplified Content Tabs */}
        <Tabs defaultValue={isHeadOfCoaching ? "coaches" : "overview"} className="space-y-6">
          <TabsList className={`grid w-full ${isHeadOfCoaching ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {isHeadOfCoaching ? (
              <>
                <TabsTrigger value="coaches">Coach Management</TabsTrigger>
                <TabsTrigger value="management">Invitations</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg animate-pulse">
                          <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                    recentActivity.map((activity: any) => {
                      const iconMap = {
                        trophy: Trophy,
                        'user-plus': UserPlus,
                        upload: BarChart3,
                      };
                      const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || BarChart3;
                      
                      const colorMap = {
                        blue: 'bg-blue-50 border-blue-200',
                        green: 'bg-green-50 border-green-200',
                        purple: 'bg-purple-50 border-purple-200',
                      };
                      const bgColor = colorMap[activity.color as keyof typeof colorMap] || 'bg-slate-50 border-slate-200';
                      
                      const iconColorMap = {
                        blue: 'bg-blue-600',
                        green: 'bg-green-600',
                        purple: 'bg-purple-600',
                      };
                      const iconBgColor = iconColorMap[activity.color as keyof typeof iconColorMap] || 'bg-slate-600';
                      
                      return (
                        <div key={activity.id} className={`flex items-start space-x-3 p-3 ${bgColor} rounded-lg border`}>
                          <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{activity.title}</p>
                            <p className="text-sm text-slate-600">{activity.description}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-sm">No recent activity to display</p>
                      <p className="text-slate-400 text-xs mt-1">Activity will appear here as coaches upload sessions and complete analyses</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceAverages ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Communication Excellence</span>
                          <span className="text-sm font-bold text-green-600">{performanceAverages.communication}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{width: `${(performanceAverages.communication * 10)}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Player Engagement</span>
                          <span className="text-sm font-bold text-blue-600">{performanceAverages.engagement}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full" style={{width: `${(performanceAverages.engagement * 10)}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Technical Instruction</span>
                          <span className="text-sm font-bold text-purple-600">{performanceAverages.instruction}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" style={{width: `${(performanceAverages.instruction * 10)}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Overall Performance</span>
                          <span className="text-sm font-bold text-orange-600">{performanceAverages.overall}/10</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full" style={{width: `${(performanceAverages.overall * 10)}%`}}></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p>Performance trends require session data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-blue-50 border-blue-200">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    <span className="text-sm">Add Coach</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-green-50 border-green-200">
                    <Users className="w-6 h-6 text-green-600" />
                    <span className="text-sm">Create Team</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-purple-50 border-purple-200">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    <span className="text-sm">Schedule Session</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2 hover:bg-orange-50 border-orange-200">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                    <span className="text-sm">View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coach Management Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Coach Management</h2>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsAddCoachModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Coach
              </Button>
            </div>

            {/* Admin Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Total Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {coachPerformance?.length || 0}
                  </div>
                  <p className="text-sm text-slate-600">Active coaches</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Award className="w-5 h-5 mr-2 text-green-600" />
                    Licensed Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {coachPerformance?.filter(coach => coach.licenseLevel).length || 0}
                  </div>
                  <p className="text-sm text-slate-600">With licenses</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Avg Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {coachPerformance?.length ? 
                      (coachPerformance.reduce((sum, coach) => sum + coach.avgScore, 0) / coachPerformance.length).toFixed(1)
                      : '0'}
                  </div>
                  <p className="text-sm text-slate-600">Average score</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Video className="w-5 h-5 mr-2 text-orange-600" />
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {coachPerformance?.reduce((sum, coach) => sum + coach.sessions, 0) || 0}
                  </div>
                  <p className="text-sm text-slate-600">Analyzed sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search coaches by name, specialty, or license..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button variant="outline" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Comprehensive Coach Management Table */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-800">
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                    Coach Management Console
                  </div>
                  <div className="text-sm text-slate-600">
                    {coachPerformance?.filter((coach) => 
                      coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      coach.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      coach.licenseLevel?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length || 0} coaches found
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Coach Details</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Performance</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Activity</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Credentials</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coachPerformance?.filter((coach) => 
                        coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        coach.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        coach.licenseLevel?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((coach, index) => (
                        <tr 
                          key={coach.id} 
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/coach/${coach.id}`)}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={coach.profilePicture || undefined} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                  {coach.name?.split(' ').map(n => n[0]).join('') || 'C'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-slate-800 text-lg">{coach.name}</div>
                                <div className="text-sm text-slate-600">{coach.email}</div>
                                <div className="text-sm text-slate-500">{coach.specialty}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600 mb-1">{coach.avgScore}/10</div>
                              <div className="text-sm text-slate-600">Average Score</div>
                              <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                coach.improvement > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {coach.improvement > 0 ? '+' : ''}{coach.improvement}% change
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-purple-600 mb-1">{coach.sessions}</div>
                              <div className="text-sm text-slate-600">Sessions</div>
                              <div className="text-xs text-slate-500">{coach.teams} teams</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              {coach.licenseLevel && (
                                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium mb-1">
                                  {coach.licenseLevel.replace('_', ' ').toUpperCase()}
                                </div>
                              )}
                              {coach.yearsExperience && (
                                <div className="text-sm text-slate-600">{coach.yearsExperience}+ years exp.</div>
                              )}
                              {coach.ageGroup && (
                                <div className="text-xs text-slate-500">{coach.ageGroup} specialist</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-center">
                              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                                Active
                              </div>
                              <div className="text-xs text-slate-500">Last: 2 days ago</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col space-y-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCoachForSessions(coach.id);
                                  setIsCoachSessionsOpen(true);
                                }}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Sessions
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCoachForEdit(coach.id);
                                  setEditCoachModalOpen(true);
                                }}
                                className="text-slate-600 border-slate-200 hover:bg-slate-50"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit Profile
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteCoachId(coach.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-600 mb-2">No Coaches Found</h3>
                            <p className="text-slate-500">Add coaches to start managing your team</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Bulk Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Bulk Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Performance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Training
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Top Performer</div>
                      <div className="font-semibold text-slate-800">
                        {coachPerformance?.sort((a, b) => b.avgScore - a.avgScore)[0]?.name || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600 mb-1">Most Active</div>
                      <div className="font-semibold text-slate-800">
                        {coachPerformance?.sort((a, b) => b.sessions - a.sessions)[0]?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Shield className="w-5 h-5 mr-2 text-red-600" />
                    System Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Coach
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Permissions
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    System Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Usage Pattern */}
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Weekly Usage Pattern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">Analytics Coming Soon</h3>
                    <p className="text-slate-500">Detailed analytics require data aggregation implementation</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">Trend Analysis Available</h3>
                    <p className="text-slate-500">Performance tracking across coaching sessions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-6">
            <PendingInvitations />
          </TabsContent>

          {/* Management Tab - Invitations */}
          <TabsContent value="management" className="space-y-6">
            <PendingInvitations />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    System Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {clubStats?.totalSessions || 0}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Total sessions</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    User Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">
                    {clubStats?.totalSessions || 0}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">Total uploads</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Award className="w-5 h-5 mr-2 text-orange-600" />
                    Security Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-slate-800 mb-2">0</div>
                  <p className="text-sm text-slate-600 mb-4">Security incidents</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Building2 className="w-5 h-5 mr-2 text-indigo-600" />
                  Club Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Settings Panel</h3>
                  <p className="text-slate-500">Configure club preferences and system settings</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      {/* Coach Profile Modal */}
      <CoachProfileModal
        userId={selectedCoachId}
        isOpen={isCoachProfileOpen}
        onClose={() => setIsCoachProfileOpen(false)}
      />

      {/* Coach Sessions Modal */}
      <CoachSessionsModal
        isOpen={isCoachSessionsOpen}
        onClose={() => setIsCoachSessionsOpen(false)}
        coachId={selectedCoachForSessions}
      />

      {/* Delete Coach Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the coach
              and remove their data from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoach}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Club Settings Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">Club Settings & Branding</DialogTitle>
            <DialogDescription>
              Customize your club's information and visual identity
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Club Logo Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Club Logo
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    {clubInfo?.logo ? (
                      <img 
                        src={clubInfo.logo} 
                        alt="Club logo" 
                        className="w-24 h-24 object-contain rounded-xl border-2 border-slate-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <Building2 className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <label htmlFor="settings-logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </label>
                    <input
                      id="settings-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          clubLogoMutation.mutate(file);
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Click to upload a new logo</p>
                    <p className="text-xs text-slate-500">Recommended: 200x200px, PNG or JPG</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6"></div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter club name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select club type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="academy">Academy</SelectItem>
                            <SelectItem value="professional_club">Professional Club</SelectItem>
                            <SelectItem value="youth_club">Youth Club</SelectItem>
                            <SelectItem value="school">School</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://www.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateClubMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {updateClubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for coach sessions modal
interface CoachSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: number | null;
}

function CoachSessionsModal({ isOpen, onClose, coachId }: CoachSessionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Coach Sessions</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-slate-600">Viewing sessions for coach ID: {coachId}</p>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Session data will be loaded here</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
