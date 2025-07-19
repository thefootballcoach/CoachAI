import { useState } from "react";
import { Link } from "wouter";
import { 
  Check, 
  ChevronRight, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  PlayCircle, 
  Pause,
  Trash2, 
  X,
  BrainCircuit,
  Brain,
  Edit,
  Save
} from "lucide-react";
import { Video } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { analyzeAudio } from "@/lib/storage";

interface SessionListProps {
  videos: Video[];
  isLoading: boolean;
}

export default function SessionList({ videos, isLoading }: SessionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analyzingVideoIds, setAnalyzingVideoIds] = useState<Set<number>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>("");
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const { toast } = useToast();
  
  const handleDeleteClick = (videoId: number) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (videoToDelete === null) return;
    
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/audios/${videoToDelete}`);
      queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
      toast({
        title: "Audio deleted",
        description: "Your coaching session has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting your audio",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };
  
  const handlePlayPause = (video: Video) => {
    if (playingVideoId === video.id) {
      // Stop currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      setPlayingVideoId(null);
    } else {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
      
      // Start new audio - always use streaming endpoint for proper authentication
      const audioUrl = `/api/audios/${video.id}/stream`;
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        setPlayingVideoId(null);
        setCurrentAudio(null);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        console.error('Audio error details:', {
          error: e,
          audioUrl,
          videoId: video.id,
          audioError: audio.error
        });
        toast({
          title: "Playback failed", 
          description: "Audio file may still be processing or unavailable",
          variant: "destructive",
        });
        setPlayingVideoId(null);
        setCurrentAudio(null);
      });
      
      audio.play().then(() => {
        setPlayingVideoId(video.id);
        setCurrentAudio(audio);
        toast({
          title: "Playing audio",
          description: `Now playing: ${video.title}`,
        });
      }).catch((error) => {
        console.error('Failed to play audio:', error);
        toast({
          title: "Playback failed",
          description: "Could not start audio playback",
          variant: "destructive",
        });
      });
    }
  };

  const handleAnalyze = async (videoId: number) => {
    if (analyzingVideoIds.has(videoId)) return;
    
    // Add this video ID to the set of videos currently being analyzed
    setAnalyzingVideoIds(prev => {
      const newSet = new Set(prev);
      newSet.add(videoId);
      return newSet;
    });
    
    try {
      const result = await analyzeAudio(videoId);
      
      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      if (result.success) {
        toast({
          title: "Analysis started",
          description: "Your coaching session is being analyzed. This may take a few minutes.",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: result.message || "There was an error analyzing your audio",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "There was an error analyzing your video",
        variant: "destructive",
      });
    } finally {
      // Remove this video ID from the set of videos currently being analyzed
      setAnalyzingVideoIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  const handleStopAnalysis = async (videoId: number) => {
    try {
      await apiRequest("POST", `/api/audios/${videoId}/stop-analysis`);
      
      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      
      toast({
        title: "Analysis stopped",
        description: "AI analysis has been stopped for this session.",
      });
    } catch (error: any) {
      toast({
        title: "Stop failed",
        description: error.message || "Could not stop the analysis",
        variant: "destructive",
      });
    }
  };

  const handleEditTitle = (video: Video) => {
    setEditingTitleId(video.id);
    setEditTitleValue(video.title);
  };

  const handleSaveTitle = async () => {
    if (!editingTitleId || !editTitleValue.trim()) return;
    
    setIsUpdatingTitle(true);
    try {
      await apiRequest("PATCH", `/api/audios/${editingTitleId}`, {
        title: editTitleValue.trim()
      });
      
      // Refresh the videos list
      queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
      
      toast({
        title: "Title updated",
        description: "Session title has been updated successfully.",
      });
      
      setEditingTitleId(null);
      setEditTitleValue("");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update session title",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTitleId(null);
    setEditTitleValue("");
  };
  
  const formatDuration = (seconds?: number) => {
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
  };
  
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Unknown date";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "file_missing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Clock className="h-3 w-3 mr-1" />;
      case "processing":
        return <div className="animate-spin h-3 w-3 mr-1 border-2 border-current border-t-transparent rounded-full" />;
      case "completed":
        return <Check className="h-3 w-3 mr-1" />;
      case "failed":
        return <X className="h-3 w-3 mr-1" />;
      case "file_missing":
        return <FileText className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  console.log("[SESSION-LIST] Videos received:", videos);
  console.log("[SESSION-LIST] Videos length:", videos.length);
  
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No sessions displayed</h3>
        <p className="text-muted-foreground mb-6">
          Upload your first coaching session to get AI-powered feedback
        </p>
        <Button asChild>
          <Link href="/upload">Upload Session</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-md border">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-neutral-50 border-b">
          <tr>
            <th scope="col" className="px-6 py-3">
              Title
            </th>
            <th scope="col" className="px-6 py-3">
              Date
            </th>
            <th scope="col" className="px-6 py-3">
              Duration
            </th>
            <th scope="col" className="px-6 py-3 hidden md:table-cell">
              Status
            </th>
            <th scope="col" className="px-6 py-3 hidden lg:table-cell">
              Size
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} className="bg-white border-b hover:bg-neutral-50">
              <th scope="row" className="px-6 py-4 font-medium">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 mr-3 flex-shrink-0 ${
                      playingVideoId === video.id 
                        ? 'bg-blue-100 hover:bg-blue-200' 
                        : 'hover:bg-blue-100'
                    }`}
                    onClick={() => handlePlayPause(video)}
                    title={playingVideoId === video.id ? "Stop audio" : "Play audio"}
                  >
                    {playingVideoId === video.id ? (
                      <Pause className="h-4 w-4 text-blue-600" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </Button>
                  <div className="flex items-center gap-2 flex-1">
                    {editingTitleId === video.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="flex-1 min-w-0"
                          placeholder="Enter session title..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveTitle}
                          disabled={isUpdatingTitle || !editTitleValue.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdatingTitle}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="truncate max-w-[200px]">{video.title}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTitle(video)}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                          title="Edit title"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {/* Visual Analysis Indicator */}
                        {video.filename && ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mpeg', '.3gp', '.flv'].some(ext => 
                          video.filename.toLowerCase().endsWith(ext)) && (
                          <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span>Visual</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <td className="px-6 py-4">
                {formatDate(video.createdAt || "Unknown")}
              </td>
              <td className="px-6 py-4">
                {formatDuration(video.duration || undefined)}
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                {video.status === "processing" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`py-1 px-2 rounded-full text-xs flex items-center ${getStatusColor(video.status)}`}>
                        {getStatusIcon(video.status)}
                        <span>Processing</span>
                      </div>
                      <span className="text-xs font-medium text-amber-700">
                        {video.processingProgress || 0}%
                      </span>
                    </div>
                    <Progress value={video.processingProgress || 0} className="h-2 w-40" />
                  </div>
                ) : (
                  <div className={`py-1 px-2 rounded-full text-xs inline-flex items-center ${getStatusColor(video.status)}`}>
                    {getStatusIcon(video.status)}
                    <span className="capitalize">{video.status}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 hidden lg:table-cell">
                {(video.filesize / (1024 * 1024)).toFixed(1)} MB
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                  {video.status === "completed" && (
                    <Button 
                      asChild
                      size="sm" 
                      variant="outline"
                      className="hidden sm:inline-flex"
                    >
                      <Link href={`/feedback/${video.id}`}>
                        <FileText className="h-4 w-4 mr-1" />
                        Feedback
                      </Link>
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {video.status === "completed" && (
                        <Link href={`/feedback/${video.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            View Feedback
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      {/* Show Run AI Analysis for any video that's not currently processing and not missing */}
                      {video.status !== "processing" && video.status !== "file_missing" && (
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleAnalyze(video.id)}
                          disabled={analyzingVideoIds.has(video.id)}
                        >
                          {analyzingVideoIds.has(video.id) ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              Multi-AI Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              Run Multi-AI Analysis
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      
                      {/* Show Stop AI Analysis for videos that are currently processing */}
                      {video.status === "processing" && (
                        <DropdownMenuItem 
                          className="cursor-pointer text-orange-600 focus:text-orange-600"
                          onClick={() => handleStopAnalysis(video.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Stop AI Analysis
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => handleDeleteClick(video.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this audio and all associated feedback. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
