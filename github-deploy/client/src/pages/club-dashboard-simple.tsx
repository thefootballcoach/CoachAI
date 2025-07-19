import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ImageCropModal from "@/components/ui/image-crop-modal";
import ColorPicker from "@/components/ui/color-picker";
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
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  GraduationCap,
  ArrowLeft,
  Eye,
  Edit,
  Home,
  Video,
  Settings,
  Shield,
  Camera,
  User
} from "lucide-react";
import { Club, User as UserType } from "@shared/schema";
import { CoachProfileModal } from "@/components/coach-profile-modal";
import InviteUserModal from "@/components/invite-user-modal";
import PendingInvitations from "@/components/dashboard/pending-invitations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// CoachMetrics component to display coaching performance metrics
interface CoachMetricsProps {
  userId: number;
}

function CoachMetrics({ userId }: CoachMetricsProps) {
  // Fetch coach's sessions (videos)
  const { data: coachSessions } = useQuery({
    queryKey: [`/api/club/coach-sessions/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/club/coach-sessions/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch coach sessions");
      }
      return response.json();
    },
    retry: 1
  });

  // Fetch coach's feedback (analysis)
  const { data: coachFeedbacks } = useQuery({
    queryKey: [`/api/club/coach-feedbacks/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/club/coach-feedbacks/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch coach feedbacks");
      }
      return response.json();
    },
    retry: 1
  });

  const uploadedSessions = coachSessions?.length || 0;
  const analysedSessions = coachFeedbacks?.length || 0;
  const reflectionsCompleted = coachFeedbacks?.filter((f: any) => f.comments && f.comments.trim().length > 0).length || 0;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Uploaded Sessions:</span>
          <span className="ml-1 font-medium text-blue-600">{uploadedSessions}</span>
        </div>
        <div>
          <span className="text-gray-500">Analysed Sessions:</span>
          <span className="ml-1 font-medium text-green-600">{analysedSessions}</span>
        </div>
        <div>
          <span className="text-gray-500">Reflections Completed:</span>
          <span className="ml-1 font-medium text-purple-600">{reflectionsCompleted}</span>
        </div>
      </div>
      
      {/* Development Plan Link */}
      <div className="pt-2 border-t border-gray-200">
        <Link href={`/development-plans?coachId=${userId}`}>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <Target className="w-4 h-4 mr-1" />
            Development Plan
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Form schema for editing club information
const clubEditSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  type: z.string().min(1, "Club type is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  contactEmail: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  website: z.string().url("Valid website URL is required").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
});

type ClubEditForm = z.infer<typeof clubEditSchema>;

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

export default function ClubDashboardSimple() {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const [selectedCoachId, setSelectedCoachId] = useState<number>(0);
  const [isCoachProfileOpen, setIsCoachProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [logoUpdateKey, setLogoUpdateKey] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check user role for access control
  const isHeadOfCoaching = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'head_of_coaching' || user?.role === 'club_admin' || user?.position === 'head_coach' || user?.position === 'academy_director';

  // Fetch club data
  const { data: clubStats, isLoading: statsLoading } = useQuery<ClubStats>({
    queryKey: ["/api/club/stats"],
    enabled: isHeadOfCoaching,
  });

  const { data: coachPerformance, isLoading: coachLoading } = useQuery<CoachPerformance[]>({
    queryKey: ["/api/club/coaches/performance"],
    enabled: isHeadOfCoaching,
  });

  // Fetch all users for admin management
  const { data: allUsers, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: isHeadOfCoaching,
  });

  // Use local state for club info to bypass React Query issues
  const [clubInfo, setClubInfo] = useState<Club | null>(null);

  // Fetch club info on mount and when needed
  const fetchClubInfo = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const response = await fetch(`/api/club/info?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-cache'
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched fresh club info:", data);
        setClubInfo(data);
      } else {
        console.error("Failed to fetch club info:", response.status);
      }
    } catch (error) {
      console.error("Error fetching club info:", error);
    }
  };

  // Initial fetch
  React.useEffect(() => {
    fetchClubInfo();
  }, []);

  // Initialize form with club data
  const form = useForm<ClubEditForm>({
    resolver: zodResolver(clubEditSchema),
    defaultValues: {
      name: "",
      type: "",
      city: "",
      country: "",
      contactEmail: "",
      phoneNumber: "",
      website: "",
      primaryColor: "#8A4FFF",
      secondaryColor: "#7C3AED",
      accentColor: "#B794F6",
    },
  });

  // Update form values when club info changes
  React.useEffect(() => {
    if (clubInfo) {
      console.log("Updating form with club info:", clubInfo);
      form.reset({
        name: clubInfo.name || "",
        type: clubInfo.type || "",
        city: clubInfo.city || "",
        country: clubInfo.country || "",
        contactEmail: clubInfo.contactEmail || "",
        phoneNumber: clubInfo.phoneNumber || "",
        website: clubInfo.website || "",
        primaryColor: clubInfo.primaryColor || "#8A4FFF",
        secondaryColor: clubInfo.secondaryColor || "#7C3AED",
        accentColor: clubInfo.accentColor || "#B794F6",
      });
    }
  }, [clubInfo, form]);

  // Club info edit mutation
  const clubEditMutation = useMutation({
    mutationFn: async (data: ClubEditForm) => {
      console.log("Making API request with data:", data);
      const response = await fetch("/api/club/info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update club info: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: async (clubData) => {
      console.log("Club info update success:", clubData);
      
      toast({
        title: "Success",
        description: "Club information updated successfully!",
      });
      
      // Update club info immediately with the response data
      console.log("Setting club info to:", clubData);
      setClubInfo(clubData);
      
      // Close settings dialog
      setIsSettingsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update club information",
        variant: "destructive",
      });
    },
  });

  // Club logo upload mutation
  const clubLogoMutation = useMutation({
    mutationFn: async (file: File | Blob) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch("/api/club/logo", {
        method: "POST",
        body: formData,
        credentials: 'include', // Include credentials for authentication
      });
      if (!response.ok) throw new Error("Failed to upload logo");
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("Logo upload success:", data);
      console.log("Current club info before update:", clubInfo);
      
      toast({
        title: "Success",
        description: "Club logo updated successfully!",
      });
      
      // Update club info immediately with new logo URL
      if (data?.logoUrl) {
        const updatedClubInfo = {
          ...clubInfo,
          logo: data.logoUrl
        };
        console.log("Setting updated club info:", updatedClubInfo);
        setClubInfo(updatedClubInfo);
        
        // Also force a fresh fetch to make sure we have the latest data
        setTimeout(() => {
          fetchClubInfo();
        }, 500);
      }
      
      // Force logo re-render
      setLogoUpdateKey(prev => prev + 1);
      
      // Also refetch to ensure consistency
      await fetchClubInfo();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  // Handle image file selection
  const handleImageFileSelect = (file: File) => {
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setSelectedImageFile(file);
    setIsCropModalOpen(true);
  };

  // Handle crop completion
  const handleCropComplete = (croppedImage: Blob) => {
    clubLogoMutation.mutate(croppedImage);
    setIsCropModalOpen(false);
    setSelectedImageFile(null);
  };

  const onSubmit = (data: ClubEditForm) => {
    console.log("Submitting club data:", data);
    clubEditMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header Section with Club Branding */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8">
          {/* Dynamic Gradient Background */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${clubInfo?.primaryColor || '#8A4FFF'}, ${clubInfo?.secondaryColor || '#7C3AED'}, ${clubInfo?.accentColor || '#B794F6'})`
            }}
          ></div>
          
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
                            handleImageFileSelect(file);
                          }
                        }}
                      />
                      
                      {clubInfo?.logo ? (
                        <img 
                          key={`${clubInfo.logo}-${logoUpdateKey}`} // Force re-render when URL changes
                          src={clubInfo.logo}
                          alt={`${clubInfo.name} logo`} 
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl shadow-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                          onError={(e) => {
                            console.error("❌ Logo load FAILED for URL:", clubInfo.logo);
                            console.log("Network error or 403/404. Checking accessibility...");
                            // Test URL accessibility
                            fetch(clubInfo.logo, { mode: 'no-cors' })
                              .then(() => console.log("✅ URL is reachable"))
                              .catch(err => console.log("❌ URL unreachable:", err));
                          }}
                          onLoad={() => {
                            console.log("✅ Logo loaded successfully:", clubInfo.logo);
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center justify-center ring-4 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
                          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                      )}
                      
                      {/* Hover Upload Effect */}
                      <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center pointer-events-none">
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-white text-xs font-medium">Upload & Crop</span>
                      </div>
                    </label>
                  ) : (
                    <>
                      {clubInfo?.logo ? (
                        <img 
                          key={`${clubInfo.logo}-${logoUpdateKey}`} // Force re-render when URL changes
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
                    </div>
                  )}
                </div>
              </div>
              
              {/* Club Settings Button */}
              {isHeadOfCoaching && (
                <Button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:border-white/50 border"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Club Settings
                </Button>
              )}
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

        {/* Simplified Content */}
        <Tabs defaultValue={isHeadOfCoaching ? "users" : "overview"} className="space-y-6">
          <TabsList className={`grid w-full ${isHeadOfCoaching ? 'grid-cols-4' : 'grid-cols-1'}`}>
            {isHeadOfCoaching ? (
              <>
                <TabsTrigger value="users">All Users</TabsTrigger>
                <TabsTrigger value="coaches">Coach Performance</TabsTrigger>
                <TabsTrigger value="statistics">Club Statistics</TabsTrigger>
                <TabsTrigger value="invitations">Invitations</TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="overview">Overview</TabsTrigger>
            )}
          </TabsList>

          {/* All Users Tab - For Admins */}
          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-800">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    All Users ({allUsers?.length || 0})
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <InviteUserModal />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      Loading users...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {allUsers
                      ?.filter(user => 
                        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      ?.map((user, index) => (
                        <div 
                          key={user.id} 
                          className={`p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            index === 0 ? 'border-t-0' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage 
                                  src={user.profilePicture ? `/api/images/s3-proxy/${user.profilePicture}` : undefined} 
                                  alt={user.name || user.username} 
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                  {(user.name || user.username)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {user.name || user.username}
                                </h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={
                                      user.role === 'super_admin' ? 'destructive' :
                                      user.role === 'admin' ? 'default' :
                                      user.role === 'head_of_coaching' ? 'secondary' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {user.role?.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  {user.position && (
                                    <Badge variant="outline" className="text-xs">
                                      {user.position.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCoachId(user.id);
                                  setIsCoachProfileOpen(true);
                                }}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Profile
                              </Button>
                              
                              <Link href={`/coach/${user.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <User className="w-4 h-4 mr-1" />
                                  Coach View
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {/* Coach Performance Metrics */}
                          <CoachMetrics userId={user.id} />
                        </div>
                      ))}
                    
                    {allUsers?.filter(user => 
                      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab - For Regular Coaches */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Home className="w-5 h-5 mr-2 text-blue-600" />
                  Welcome to {clubInfo?.name || "Club Management"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">Your coaching development hub</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Access your coaching development tools and resources. Upload sessions, view AI analysis, and connect with your club community.
                  </p>
                  <div className="mt-6 flex justify-center gap-4">
                    <Link href="/dashboard">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Video className="w-4 h-4 mr-2" />
                        Go to Dashboard
                      </Button>
                    </Link>
                    <Link href="/upload">
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Upload Session
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coach Management Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Coach Management</h2>
              <InviteUserModal />
            </div>
            
            {/* Coach List */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Coaching Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coachLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-slate-200 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : coachPerformance && coachPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {coachPerformance.map((coach) => (
                      <div key={coach.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-slate-800">{coach.name}</h4>
                            <p className="text-slate-600">{coach.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">{coach.role}</Badge>
                              <span className="text-sm text-slate-500">{coach.licenseLevel}</span>
                              <span className="text-sm text-green-600 font-medium">
                                {coach.avgScore}/10 avg score
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCoachId(coach.id);
                              setIsCoachProfileOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No coaches yet</h3>
                    <p className="text-slate-500">Invite coaches to start building your team</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Club Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  Club Analytics & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">Comprehensive Club Statistics</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    View detailed analytics including coaching performance trends, session analysis, coach rankings, and development insights.
                  </p>
                  <Link href="/club-statistics">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full Statistics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <PendingInvitations />
          </TabsContent>
        </Tabs>
      </div>

      {/* Coach Profile Modal */}
      <CoachProfileModal
        userId={selectedCoachId}
        isOpen={isCoachProfileOpen}
        onClose={() => setIsCoachProfileOpen(false)}
      />

      {/* Club Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Club Settings
            </DialogTitle>
            <DialogDescription>
              Update your club information and settings
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                      <FormControl>
                        <Input placeholder="e.g., football_club" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact email" {...field} />
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
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter website URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Color Theme Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Club Color Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker
                          label="Primary Color"
                          value={field.value || "#8A4FFF"}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker
                          label="Secondary Color"
                          value={field.value || "#7C3AED"}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker
                          label="Accent Color"
                          value={field.value || "#B794F6"}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <div 
                    className="w-full h-12 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ 
                      background: `linear-gradient(135deg, ${form.watch("primaryColor") || "#8A4FFF"}, ${form.watch("secondaryColor") || "#7C3AED"})` 
                    }}
                  >
                    {clubInfo?.name || "Your Club Name"}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={clubEditMutation.isPending}>
                  {clubEditMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedImageFile(null);
        }}
        onCropComplete={handleCropComplete}
        selectedFile={selectedImageFile}
      />
    </div>
  );
}