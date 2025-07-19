import { useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, File, FileVideo, X, AlertTriangle, Check } from "lucide-react";

interface VideoUploadProps {
  onFileSelected: (file: File) => void;
}

export default function VideoUpload({ onFileSelected }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Valid file types - both audio and video
  const ACCEPTED_FILE_TYPES = [
    // Audio formats - comprehensive WAV support
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", 
    "audio/vnd.wave", "audio/ogg", "audio/m4a", "audio/x-m4a", "audio/aac", 
    "audio/flac", "audio/webm",
    // Video formats
    "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", 
    "video/webm", "video/x-ms-wmv", "video/3gpp", "video/x-flv"
  ];
  // Max file size 6GB
  const MAX_FILE_SIZE = 6 * 1024 * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload audio (MP3, WAV, M4A, AAC, OGG, FLAC) or video (MP4, MOV, AVI, WebM, WMV) files.");
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 6GB limit.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
        toast({
          title: "File selected",
          description: `${file.name} is ready to upload`,
        });
      }
    }
  }, [onFileSelected, toast]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
        toast({
          title: "File selected",
          description: `${file.name} is ready to upload`,
        });
      }
    }
  }, [onFileSelected, toast]);

  const openFileSelector = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : error 
              ? "border-destructive bg-destructive/5" 
              : "border-neutral-300 hover:border-primary hover:bg-primary/5"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input 
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.mov,.avi,.webm,.wmv"
          onChange={handleChange}
        />
        
        {error ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-destructive mb-1">Upload Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"></path>
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Upload Coaching Media</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Drag and drop your audio or video file here or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <File className="h-3 w-3 mr-1" />
                <span>MP3</span>
              </div>
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <File className="h-3 w-3 mr-1" />
                <span>WAV</span>
              </div>
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <File className="h-3 w-3 mr-1" />
                <span>M4A</span>
              </div>
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <FileVideo className="h-3 w-3 mr-1" />
                <span>MP4</span>
              </div>
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <FileVideo className="h-3 w-3 mr-1" />
                <span>MOV</span>
              </div>
              <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
                <FileVideo className="h-3 w-3 mr-1" />
                <span>AVI</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 6GB
            </p>
          </>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Audio requirements</h4>
          <ul className="space-y-2">
            <li className="flex items-start text-sm">
              <Check className="h-4 w-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
              <span>Ensure clear audio quality with minimal background noise</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="h-4 w-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
              <span>Keep recordings under 60 minutes for optimal AI analysis</span>
            </li>
            <li className="flex items-start text-sm">
              <Check className="h-4 w-4 text-secondary mt-0.5 mr-2 flex-shrink-0" />
              <span>Include clear verbal coaching instructions and feedback</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
