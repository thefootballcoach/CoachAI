import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX
} from "lucide-react";

interface AudioPreviewProps {
  audioFile: File | null;
  transcription?: string;
}

export default function AudioPreview({ audioFile, transcription }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (audioFile) {
      // Clean up previous URL object to prevent memory leaks
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Create a temporary URL for the audio file
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);
  
  useEffect(() => {
    // Set up audio element
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    
    // Load metadata to get duration
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioUrl]);

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audio.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const updateProgress = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setCurrentTime(audio.currentTime);
    animationRef.current = requestAnimationFrame(updateProgress);
  };
  
  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime += 10;
  };
  
  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime -= 10;
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const value = parseFloat(e.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  if (!audioFile) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Audio Preview</h3>
            <p className="text-sm text-muted-foreground">
              Listen to your audio before uploading
            </p>
          </div>
          
          <div className="space-y-4">
            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
            
            <div className="flex items-center justify-between space-x-2">
              <div className="text-sm text-muted-foreground w-12">
                {formatTime(currentTime)}
              </div>
              
              <div className="relative flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  ref={progressBarRef}
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              
              <div className="text-sm text-muted-foreground w-12 text-right">
                {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center justify-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={skipBackward}
                  disabled={!audioUrl}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button 
                  className="h-12 w-12 rounded-full"
                  onClick={togglePlayPause}
                  disabled={!audioUrl}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={skipForward}
                  disabled={!audioUrl}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {transcription && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Preview Transcription</h4>
                <div className="max-h-40 overflow-y-auto bg-muted rounded-md p-4 text-sm">
                  <p>{transcription}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}