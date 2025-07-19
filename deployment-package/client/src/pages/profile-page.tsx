import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Settings, CreditCard, LogOut, User, Mail, Key, AlertTriangle, Camera, Award, Users, Calendar, Target } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  username: z.string().min(3, "Username must be at least 3 characters."),
  position: z.string().optional(),
  licenseLevel: z.string().optional(),
  specialization: z.string().optional(),
  ageGroup: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  bio: z.string().optional(),
  coachingBadges: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      position: user?.position || "",
      licenseLevel: user?.licenseLevel || "",
      specialization: user?.specialization || "",
      ageGroup: user?.ageGroup || "",
      yearsExperience: user?.yearsExperience || 0,
      bio: user?.bio || "",
      coachingBadges: user?.coachingBadges || [],
      achievements: user?.achievements || [],
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile picture upload mutation
  const profilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/user/profile-picture/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  async function onProfileSubmit(data: ProfileFormValues) {
    setLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/profile", data);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setLoading(true);
    try {
      await apiRequest("PATCH", "/api/user/password", data);
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "There was a problem updating your password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logoutMutation.mutate();
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center">
              <Key className="mr-2 h-4 w-4" />
              Password
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    {/* Profile Picture Upload Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Camera className="w-5 h-5 mr-2" />
                        Profile Picture
                      </h3>
                      <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                          <ImageUpload
                            onUpload={(file) => profilePictureMutation.mutate(file)}
                            currentImageUrl={user?.profilePicture || undefined}
                            isUploading={profilePictureMutation.isPending}
                            label=""
                            variant="avatar"
                            maxSize={5}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{user?.name || user?.username}</h4>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a professional photo to personalize your profile
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your unique username.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              This email will be used for notifications and account recovery.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Coaching Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="head_coach">Head Coach</SelectItem>
                                  <SelectItem value="assistant_coach">Assistant Coach</SelectItem>
                                  <SelectItem value="academy_director">Academy Director</SelectItem>
                                  <SelectItem value="technical_director">Technical Director</SelectItem>
                                  <SelectItem value="youth_coach">Youth Coach</SelectItem>
                                  <SelectItem value="goalkeeping_coach">Goalkeeping Coach</SelectItem>
                                  <SelectItem value="fitness_coach">Fitness Coach</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="licenseLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select license" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="fa_level_1">FA Level 1</SelectItem>
                                  <SelectItem value="fa_level_2">FA Level 2</SelectItem>
                                  <SelectItem value="fa_level_3">FA Level 3</SelectItem>
                                  <SelectItem value="fa_level_4">FA Level 4</SelectItem>
                                  <SelectItem value="fa_level_5">FA Level 5</SelectItem>
                                  <SelectItem value="uefa_c">UEFA C License</SelectItem>
                                  <SelectItem value="uefa_b">UEFA B License</SelectItem>
                                  <SelectItem value="uefa_a">UEFA A License</SelectItem>
                                  <SelectItem value="uefa_pro">UEFA Pro License</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialization</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select specialization" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="youth_development">Youth Development</SelectItem>
                                  <SelectItem value="goalkeeping">Goalkeeping</SelectItem>
                                  <SelectItem value="fitness">Fitness & Conditioning</SelectItem>
                                  <SelectItem value="tactics">Tactics & Strategy</SelectItem>
                                  <SelectItem value="technical_skills">Technical Skills</SelectItem>
                                  <SelectItem value="mental_coaching">Mental Coaching</SelectItem>
                                  <SelectItem value="set_pieces">Set Pieces</SelectItem>
                                  <SelectItem value="attacking_play">Attacking Play</SelectItem>
                                  <SelectItem value="defensive_play">Defensive Play</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="ageGroup"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age Group</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="u8">U8</SelectItem>
                                  <SelectItem value="u10">U10</SelectItem>
                                  <SelectItem value="u12">U12</SelectItem>
                                  <SelectItem value="u14">U14</SelectItem>
                                  <SelectItem value="u16">U16</SelectItem>
                                  <SelectItem value="u18">U18</SelectItem>
                                  <SelectItem value="u21">U21</SelectItem>
                                  <SelectItem value="senior">Senior</SelectItem>
                                  <SelectItem value="all_ages">All Ages</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="yearsExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Experience</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biography</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your coaching philosophy, experience, and approach..."
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Share your coaching background, philosophy, and what makes you unique as a coach.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your current password to authorize changes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-amber-800">Password security tips</h4>
                          <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                            <li>Use at least 8 characters</li>
                            <li>Include numbers, symbols, and uppercase letters</li>
                            <li>Don't reuse passwords from other sites</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your subscription plan and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-lg">
                          {user?.subscriptionTier ? `${user.subscriptionTier} Plan` : 'No Subscription'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.subscriptionStatus === 'active'
                            ? 'Your subscription is active.'
                            : 'You don\'t have an active subscription.'}
                        </p>
                      </div>
                      
                      <Button variant={user?.subscriptionStatus === 'active' ? 'outline' : 'default'}>
                        {user?.subscriptionStatus === 'active' ? 'Manage Subscription' : 'Subscribe Now'}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-4">Payment History</h3>
                    {user?.subscriptionStatus === 'active' ? (
                      <div className="border rounded-md">
                        <div className="p-4 flex justify-between border-b">
                          <div>
                            <p className="font-medium">Monthly Subscription</p>
                            <p className="text-sm text-muted-foreground">Jun 1, 2023</p>
                          </div>
                          <p className="font-medium">$29.00</p>
                        </div>
                        <div className="p-4 flex justify-between border-b">
                          <div>
                            <p className="font-medium">Monthly Subscription</p>
                            <p className="text-sm text-muted-foreground">May 1, 2023</p>
                          </div>
                          <p className="font-medium">$29.00</p>
                        </div>
                        <div className="p-4 flex justify-between">
                          <div>
                            <p className="font-medium">Monthly Subscription</p>
                            <p className="text-sm text-muted-foreground">Apr 1, 2023</p>
                          </div>
                          <p className="font-medium">$29.00</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 border rounded-md">
                        <p className="text-muted-foreground">No payment history available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account settings and session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button variant="outline" className="flex items-center" onClick={handleLogout} disabled={logoutMutation.isPending}>
                  {logoutMutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
