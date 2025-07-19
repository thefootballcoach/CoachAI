import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import VideoUpload from "@/components/dashboard/video-upload";
import UploadProgress from "@/components/dashboard/upload-progress";
import SelfReflection, { SelfReflectionData } from "@/components/dashboard/self-reflection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Brain, Zap, AlertTriangle, Target, Activity, CheckCircle, Cpu, Bot, Sparkles, AudioLines, FileText, Upload, Clock, Server, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { uploadAudio } from "@/lib/storage";
import { queryClient } from "@/lib/queryClient";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("audio");
  const reflectionRef = useRef<any>(null);
  const [reflectionData, setReflectionData] = useState<SelfReflectionData | undefined>(undefined);
  const [uploadAttempts, setUploadAttempts] = useState(0);
  const maxRetries = 3;

  // Queue status monitoring
  const { data: queueStatus } = useQuery<{
    queue: number;
    processing: number;
    maxConcurrent: number;
    processingIds: number[];
  }>({
    queryKey: ["/api/queue/status"],
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: true // Re-enable now that endpoint is public
  });

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };

  const handleCancel = () => {
    setSelectedFile(undefined);
    setReflectionData(undefined);
  };
  
  const handleReflectionComplete = (data: SelfReflectionData) => {
    setReflectionData(data);
    setActiveTab("audio");
    
    toast({
      title: "Reflection saved",
      description: "Your self-reflection has been saved and will be included with your upload.",
    });
  };

  const handleUpload = async (retryAttempt = 0) => {
    if (!selectedFile) return;

    // Mandatory self-reflection check
    if (!reflectionData) {
      toast({
        title: "Self-reflection required",
        description: "Please complete your self-reflection before uploading your session.",
        variant: "destructive",
      });
      setActiveTab("reflection");
      return;
    }

    if (activeTab === "reflection" && reflectionRef.current) {
      try {
        const data = await reflectionRef.current.submitForm();
        
        // Validate all required fields are completed
        const requiredFields = ['sessionTitle', 'sessionDate', 'coachName', 'ageGroup', 'intendedOutcomes', 'sessionStrengths', 'areasForDevelopment'];
        const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
        
        if (missingFields.length > 0) {
          toast({
            title: "Complete All Required Fields",
            description: `Please fill in: ${missingFields.join(', ')} before uploading.`,
            variant: "destructive",
          });
          return;
        }
        
        setReflectionData(data);
      } catch (error) {
        toast({
          title: "Self-Assessment Required",
          description: "Please complete all mandatory self-assessment fields.",
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadAttempts(retryAttempt + 1);

    try {
      // Status updates for user feedback
      setUploadStatus("Preparing upload...");
      console.log("[BULLETPROOF] Starting upload process...");
      
      // Validate file before upload
      const validationError = validateFile(selectedFile);
      if (validationError) {
        throw new Error(validationError);
      }
      
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', selectedFile.name);

      if (reflectionData) {
        // Use shorter field names to reduce header size
        formData.append('t', reflectionData.sessionTitle);
        formData.append('dt', reflectionData.sessionDate);
        formData.append('c', reflectionData.coachName);
        formData.append('a', reflectionData.ageGroup);
        formData.append('o', reflectionData.intendedOutcomes);
        formData.append('s', reflectionData.sessionStrengths);
        formData.append('d', reflectionData.areasForDevelopment);
        formData.append('n', reflectionData.notes || '');
        formData.append('cal', reflectionData.generateCalendarEvent ? 'true' : 'false');
      }

      setUploadStatus("Uploading file...");
      console.log("[BULLETPROOF] Calling uploadAudio function...");
      
      // First check if user is authenticated
      try {
        console.log("[BULLETPROOF] Checking authentication before upload...");
        const authCheck = await fetch('/api/user', { credentials: 'include' });
        console.log("[BULLETPROOF] Auth check response:", authCheck.status, authCheck.statusText);
        
        if (!authCheck.ok) {
          if (authCheck.status === 401) {
            console.error("[BULLETPROOF] User not authenticated - 401 error");
            throw new Error('You are not logged in. Please log in first.');
          } else {
            console.error("[BULLETPROOF] Auth check failed with status:", authCheck.status);
            throw new Error(`Authentication check failed: ${authCheck.statusText}`);
          }
        }
        
        const userData = await authCheck.json();
        console.log("[BULLETPROOF] User authenticated:", userData.username);
      } catch (authError) {
        console.error("[BULLETPROOF] Authentication check failed:", authError);
        throw new Error('Please log in to upload files. Click the login button.');
      }
      
      const response = await uploadAudio(formData, (progress) => {
        console.log(`[BULLETPROOF] Upload progress: ${progress}%`);
        setUploadProgress(progress);
        
        // More granular status updates
        if (progress < 10) {
          setUploadStatus("Starting upload...");
        } else if (progress < 30) {
          setUploadStatus(`Uploading file... ${progress}%`);
        } else if (progress < 60) {
          setUploadStatus(`Transferring to server... ${progress}%`);
        } else if (progress < 90) {
          setUploadStatus(`Saving to storage... ${progress}%`);
        } else if (progress < 100) {
          setUploadStatus(`Finalizing upload... ${progress}%`);
        } else {
          setUploadStatus("Upload complete!");
        }
      });

      if (!response || !response.id) {
        throw new Error("Upload failed - no response received");
      }

      console.log("[BULLETPROOF] Upload completed successfully, ID:", response.id);
      setUploadStatus("Upload complete! Processing...");

      // Invalidate caches and refetch immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/audios"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/progress"] })
      ]);
      
      // Force refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey: ["/api/audios"] });

      // Handle calendar event if generated
      if (response.calendarEvent) {
        toast({
          title: "Upload successful with calendar event!",
          description: `Your session has been uploaded and a review reminder has been scheduled.`,
        });
        
        // Show calendar options to user
        setTimeout(() => {
          const calendarEvent = response.calendarEvent;
          const confirmCalendar = window.confirm(
            `Session uploaded successfully!\n\nA calendar event has been created for your session review:\n"${calendarEvent.title}"\nScheduled for: ${new Date(calendarEvent.startDate).toLocaleDateString()} at ${new Date(calendarEvent.startDate).toLocaleTimeString()}\n\nWould you like to add this to your calendar now?`
          );
          
          if (confirmCalendar) {
            // Open Google Calendar by default
            window.open(calendarEvent.googleCalendarUrl, '_blank');
          }
        }, 1000);
      } else {
        toast({
          title: "Upload successful!",
          description: `Your ${selectedFile.name} has been uploaded and is being analyzed by AI.`,
        });
      }

      // Reset state
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(undefined);
      setReflectionData(undefined);
      setUploadError(null);
      setUploadAttempts(0);
      
      // Navigate directly to sessions tab
      setTimeout(() => {
        window.location.href = "/dashboard?tab=sessions";
      }, 1500);
    } catch (error: any) {
      console.error("[BULLETPROOF] Upload error:", error);
      const errorMessage = error.message || "Upload failed";
      setUploadError(errorMessage);
      setUploadStatus("Upload failed");
      
      // Determine if we should retry
      if (retryAttempt < maxRetries - 1 && isRetryableError(error)) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
        toast({
          title: `Upload failed - Retrying in ${retryDelay / 1000}s...`,
          description: `Attempt ${retryAttempt + 1} of ${maxRetries}`,
          variant: "destructive",
        });
        
        setTimeout(() => {
          handleUpload(retryAttempt + 1);
        }, retryDelay);
      } else {
        toast({
          title: "Upload failed",
          description: getDetailedErrorMessage(error),
          variant: "destructive",
        });
        setUploading(false);
      }
    }
  };
  
  // Validate file before upload
  const validateFile = (file: File): string | null => {
    const maxSize = 6 * 1024 * 1024 * 1024; // 6GB
    const allowedTypes = [
      // Audio formats - comprehensive WAV support
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 
      'audio/vnd.wave', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 
      'audio/flac', 'audio/webm',
      // Video formats
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      'video/x-ms-wmv', 'video/mpeg', 'video/3gpp', 'video/x-flv'
    ];
    
    if (file.size > maxSize) {
      return `File size (${(file.size / (1024 * 1024 * 1024)).toFixed(1)}GB) exceeds maximum allowed size of 6GB`;
    }
    
    if (!file.type || file.type === '') {
      // Check by extension if MIME type is missing
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'webm', 'wmv', 'mpeg', '3gp', 'flv'];
      
      if (!extension || !allowedExtensions.includes(extension)) {
        return `File type not supported. Please upload audio (MP3, WAV, M4A) or video (MP4, MOV, AVI, etc.) files.`;
      }
    } else if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} not supported. Please upload audio or video files.`;
    }
    
    return null;
  };
  
  // Check if error is retryable
  const isRetryableError = (error: any): boolean => {
    const retryableMessages = [
      'network', 'timeout', 'failed to fetch', 'connection',
      '500', '502', '503', '504', 'service unavailable'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  };
  
  // Get detailed error message for user
  const getDetailedErrorMessage = (error: any): string => {
    if (error.message?.includes('413') || error.message?.includes('Request Entity Too Large')) {
      return "File too large for current server configuration. Please try a smaller file or contact support.";
    }
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return "Session expired. Please log in again.";
    }
    if (error.message?.includes('network')) {
      return "Network error. Please check your internet connection.";
    }
    if (error.message?.includes('timeout')) {
      return "Upload timed out. Please try again with a stable connection.";
    }
    return error.message || "An unexpected error occurred. Please try again.";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        {/* Elite Header Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center mb-6 lg:mb-0">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl mr-4 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                    Upload Coaching Session
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Upload your audio recording for AI-powered coaching analysis
                  </p>
                </div>
              </div>
              
              {/* System Status & Queue Information */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-600/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Server className="w-6 h-6 text-cyan-400 mr-2" />
                    <span className="text-cyan-400 font-bold">System Status</span>
                  </div>
                  
                  {queueStatus && (
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-sm text-slate-300">
                          Processing: {queueStatus.processing}/{queueStatus.maxConcurrent}
                        </span>
                      </div>
                      
                      {queueStatus.queue > 0 && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-orange-400 mr-1" />
                          <span className="text-sm text-slate-300">
                            Queue: {queueStatus.queue}
                          </span>
                        </div>
                      )}
                      
                      {queueStatus.queue === 0 && queueStatus.processing === 0 && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          Ready
                        </Badge>
                      )}
                      
                      {queueStatus.queue > 5 && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          High Load
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400 mt-2">AI Processing Engine</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 -mt-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Bulletproof Features Card */}
            <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
                  Bulletproof Upload System Active
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Enhanced reliability features to ensure your uploads succeed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900">Automatic Retries</p>
                      <p className="text-sm text-emerald-700">Failed uploads retry up to 3 times automatically</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900">Smart Error Recovery</p>
                      <p className="text-sm text-emerald-700">Intelligent handling of network and server errors</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900">Progress Tracking</p>
                      <p className="text-sm text-emerald-700">Real-time status updates during upload</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900">6GB File Support</p>
                      <p className="text-sm text-emerald-700">Upload full-length coaching sessions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900/5 to-blue-900/5 px-8 py-6 border-b border-slate-200/50">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  Upload Your Session
                </h2>
                <p className="text-slate-600 mt-2">Upload your coaching session audio to receive AI-powered feedback</p>
              </div>
              
              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 rounded-2xl p-1 mb-8">
                    <TabsTrigger 
                      value="audio" 
                      disabled={!reflectionData}
                      className="rounded-xl font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AudioLines className="mr-2 h-4 w-4" />
                      Audio Upload {!reflectionData && "(Complete Assessment First)"}
                    </TabsTrigger>
                    <TabsTrigger value="reflection" className="rounded-xl font-semibold flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Pre-Session Reflection {!reflectionData && "⚠️"}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="audio" className="mt-0">
                    {uploading ? (
                      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/30 rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                            <Sparkles className="w-4 h-4 text-white animate-spin" />
                          </div>
                          Processing Your Session
                        </h3>
                        <UploadProgress progress={uploadProgress} />
                        
                        {/* Upload Status Display */}
                        {uploadStatus && (
                          <div className="mt-6 flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-slate-600 font-medium">{uploadStatus}</span>
                          </div>
                        )}
                        
                        {/* Retry Attempt Display */}
                        {uploadAttempts > 1 && (
                          <Alert className="mt-4 border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              Retry attempt {uploadAttempts} of {maxRetries}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 border border-slate-200/30 rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center mr-3">
                            <AudioLines className="w-4 h-4 text-white" />
                          </div>
                          Select Audio File
                        </h3>
                        

                        <VideoUpload
                          onFileSelected={handleFileSelected}
                        />
                        
                        {/* Error Display */}
                        {uploadError && (
                          <Alert className="mt-4 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              {uploadError}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="reflection" className="mt-0">
                    <div className="bg-gradient-to-br from-purple-50/50 to-violet-50/30 border border-purple-200/30 rounded-2xl p-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border border-blue-200/40 rounded-xl p-6">
                          <div className="flex items-start">
                            <Target className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                            <div>
                              <h3 className="font-bold text-red-900 mb-2">Required: Pre-Session Self-Assessment</h3>
                              <p className="text-red-700 leading-relaxed">
                                Complete the self-assessment below before uploading your session. This mandatory reflection enables AI comparison between your self-perception and actual coaching performance for enhanced analysis accuracy.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <SelfReflection 
                          ref={reflectionRef} 
                          onReflectionSaved={handleReflectionComplete}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 px-8 py-6 border-t border-slate-200/50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {!reflectionData ? (
                    <div className="flex items-center space-x-3 text-red-600">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">Complete self-assessment required before upload</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-slate-600">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">AI analysis typically takes 2-3 minutes</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  {selectedFile && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancel} 
                      disabled={uploading}
                      className="border-slate-300 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading || !reflectionData}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload & Analyze
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}