import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Award, Calendar, Users, Target, Mail, Star, TrendingUp, Video, MessageSquare, Clock, Play } from "lucide-react";
import { User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CoachProfileModalProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const formatPositionLabel = (position: string) => {
  const labels: Record<string, string> = {
    head_coach: "Head Coach",
    assistant_coach: "Assistant Coach",
    academy_director: "Academy Director",
    technical_director: "Technical Director",
    youth_coach: "Youth Coach",
    goalkeeping_coach: "Goalkeeping Coach",
    fitness_coach: "Fitness Coach"
  };
  return labels[position] || position;
};

const formatLicenseLabel = (license: string) => {
  const labels: Record<string, string> = {
    fa_level_1: "FA Level 1",
    fa_level_2: "FA Level 2",
    fa_level_3: "FA Level 3",
    fa_level_4: "FA Level 4",
    fa_level_5: "FA Level 5",
    uefa_c: "UEFA C License",
    uefa_b: "UEFA B License",
    uefa_a: "UEFA A License",
    uefa_pro: "UEFA Pro License"
  };
  return labels[license] || license;
};

const formatSpecializationLabel = (specialization: string) => {
  const labels: Record<string, string> = {
    youth_development: "Youth Development",
    goalkeeping: "Goalkeeping",
    fitness: "Fitness & Conditioning",
    tactics: "Tactics & Strategy",
    technical_skills: "Technical Skills",
    mental_coaching: "Mental Coaching",
    set_pieces: "Set Pieces",
    attacking_play: "Attacking Play",
    defensive_play: "Defensive Play"
  };
  return labels[specialization] || specialization;
};

const formatAgeGroupLabel = (ageGroup: string) => {
  const labels: Record<string, string> = {
    u8: "U8",
    u10: "U10",
    u12: "U12",
    u14: "U14",
    u16: "U16",
    u18: "U18",
    u21: "U21",
    senior: "Senior",
    all_ages: "All Ages"
  };
  return labels[ageGroup] || ageGroup;
};

export function CoachProfileModal({ userId, isOpen, onClose }: CoachProfileModalProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const { data: coach, isLoading, error } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}/profile`],
    enabled: isOpen && userId > 0,
  });

  // Fetch coach sessions
  const { data: coachSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/club/coach-sessions/${userId}`],
    enabled: isOpen && userId > 0 && activeTab === "sessions",
  });

  // Fetch coach feedback/comments
  const { data: coachFeedbacks = [], isLoading: feedbacksLoading } = useQuery({
    queryKey: [`/api/club/coach-feedbacks/${userId}`],
    enabled: isOpen && userId > 0 && activeTab === "sessions",
  });

  // Fetch club information if coach is assigned to a club
  const { data: clubInfo } = useQuery({
    queryKey: ["/api/club/info"],
    enabled: isOpen && !!coach?.clubId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest(`/api/sessions/${sessionId}/comment`, {
        method: 'POST',
        body: { comment: newComment },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/club/coach-feedbacks/${userId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Coach Profile...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !coach) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Profile</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load coach profile.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            {coach.name || coach.username} - Coach Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="sessions">Sessions & Feedback</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={coach.profilePicture || undefined} />
                  <AvatarFallback className="text-lg">
                    {coach.name?.split(' ').map(n => n[0]).join('') || coach.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold">{coach.name || coach.username}</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {coach.email}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {coach.role && (
                      <Badge variant="default" className="capitalize">
                        {coach.role.replace('_', ' ')}
                      </Badge>
                    )}
                    {coach.position && (
                      <Badge variant="secondary">
                        {formatPositionLabel(coach.position)}
                      </Badge>
                    )}
                    {coach.licenseLevel && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {formatLicenseLabel(coach.licenseLevel)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coaching Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Coaching Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {coach.specialization && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Specialization</p>
                    <p className="font-medium">{formatSpecializationLabel(coach.specialization)}</p>
                  </div>
                )}
                
                {coach.ageGroup && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Age Group
                    </p>
                    <Badge variant="outline">{formatAgeGroupLabel(coach.ageGroup)}</Badge>
                  </div>
                )}
                
                {coach.yearsExperience !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Experience
                    </p>
                    <p className="font-medium">{coach.yearsExperience} years</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subscription Tier</p>
                  <Badge variant="default" className="capitalize">
                    {coach.subscriptionTier || 'starter'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credits Available</p>
                  <p className="font-medium">{coach.credits || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credits Used</p>
                  <p className="font-medium">{coach.totalCreditsUsed || 0}</p>
                </div>
                
                {coach.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(coach.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coaching Badges */}
          {coach.coachingBadges && coach.coachingBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Coaching Badges & Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.coachingBadges.map((badge, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {coach.achievements && coach.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {coach.achievements.map((achievement, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Biography */}
          {coach.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Biography
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6 mt-6">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sessions List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Coach Sessions ({coachSessions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coachSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No sessions uploaded yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {coachSessions.map((session: any) => (
                            <Card key={session.id} className="border-l-4 border-l-blue-500">
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium mb-2">{session.title}</h4>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {new Date(session.createdAt).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Play className="h-4 w-4" />
                                        {session.status || 'Completed'}
                                      </span>
                                    </div>
                                    
                                    {/* Existing Feedback */}
                                    {coachFeedbacks.find((f: any) => f.sessionId === session.id) && (
                                      <div className="mt-3 p-3 bg-muted rounded-lg">
                                        <p className="text-sm font-medium mb-1">Previous Feedback:</p>
                                        <p className="text-sm text-muted-foreground">
                                          {coachFeedbacks.find((f: any) => f.sessionId === session.id)?.feedback || 'No detailed feedback available'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Add Comment Section */}
                                <div className="mt-4 pt-4 border-t">
                                  <div className="space-y-3">
                                    <label className="text-sm font-medium">Add Management Comment:</label>
                                    <Textarea
                                      placeholder="Add your feedback or comments for this session..."
                                      value={newComment}
                                      onChange={(e) => setNewComment(e.target.value)}
                                      className="min-h-[100px]"
                                    />
                                    <Button
                                      onClick={() => addCommentMutation.mutate(session.id)}
                                      disabled={!newComment.trim() || addCommentMutation.isPending}
                                      className="w-full"
                                    >
                                      {addCommentMutation.isPending ? (
                                        <>
                                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                          Adding Comment...
                                        </>
                                      ) : (
                                        <>
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Add Comment
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                {coachFeedbacks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {coachFeedbacks.length}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Sessions</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {coachFeedbacks.filter((f: any) => f.overallScore >= 8).length}
                          </div>
                          <p className="text-sm text-muted-foreground">High Performance</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {coachFeedbacks.reduce((acc: number, f: any) => acc + (f.overallScore || 0), 0) / coachFeedbacks.length || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}