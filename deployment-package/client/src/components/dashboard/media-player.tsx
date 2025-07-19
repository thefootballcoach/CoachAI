import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Download,
  Maximize2
} from "lucide-react";
import { Video } from "@shared/schema";

interface MediaPlayerProps {
  video: Video;
  autoplay?: boolean;
}

export default function MediaPlayer({ video, autoplay = false }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const isVideo = video.filename?.match(/\.(mp4|mov|avi|webm|wmv)$/i);
  const mediaUrl = `/api/audios/${video.id}/stream`;
  
  // MediaPlayer rendering optimized for production

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => {
      setDuration(media.duration);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener('timeupdate', updateTime);
    media.addEventListener('loadedmetadata', updateDuration);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);

    return () => {
      media.removeEventListener('timeupdate', updateTime);
      media.removeEventListener('loadedmetadata', updateDuration);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = value[0];
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = value[0];
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.currentTime = Math.max(0, media.currentTime - 10);
  };

  const skipForward = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.currentTime = Math.min(duration, media.currentTime + 10);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === null || time === undefined) return "0:00";
    
    const totalSeconds = Math.floor(time);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = video.filename || `${video.title}.${isVideo ? 'mp4' : 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            {isVideo ? (
              <Maximize2 className="h-5 w-5 mr-2" />
            ) : (
              <Volume2 className="h-5 w-5 mr-2" />
            )}
            {video.title}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadMedia}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unified media element */}
        {isVideo ? (
          <div className="space-y-4">
            {/* Custom video player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl}
                className="w-full h-full object-contain"
                preload="metadata"
                autoPlay={autoplay}
                playsInline
                controls={false}
                onLoadStart={() => setIsLoading(true)}
                onLoadedData={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                onCanPlay={() => setIsLoading(false)}
                onWaiting={() => setIsLoading(true)}
                onStalled={() => setIsLoading(true)}
              >
                Your browser does not support video playback.
              </video>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white">Loading video...</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              preload="metadata"
              autoPlay={autoplay}
              style={{ display: 'none' }}
            />
            {/* Audio waveform visualization */}
            <div className="h-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 50 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-blue-400 rounded-full transition-all duration-300 ${
                      isPlaying ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: `${Math.random() * 60 + 10}px`,
                      opacity: (currentTime / duration) > (i / 50) ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={skipBackward}
              disabled={isLoading}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              disabled={isLoading}
              className="w-12 h-12"
            >
              {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={skipForward}
              disabled={isLoading}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="w-20">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>

        {/* Media info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Duration: {formatTime(video.duration || 0)}</div>
          <div>Size: {((video.filesize || 0) / (1024 * 1024)).toFixed(1)} MB</div>
          <div>Type: {isVideo ? 'Video' : 'Audio'}</div>
          {video.createdAt && (
            <div>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}