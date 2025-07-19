import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, File, FileAudio, CheckCircle, X } from "lucide-react";

// Define acceptable file types
const ACCEPTED_FILE_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/m4a", "audio/x-m4a"];
const MAX_FILE_SIZE = 6 * 1024 * 1024 * 1024; // 6GB

interface BatchUploadProps {
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  selectedFiles: File[];
}

export default function BatchUpload({ onFilesSelected, onRemoveFile, selectedFiles }: BatchUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Validate all files
  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const invalidFiles: { name: string, reason: string }[] = [];
    
    Array.from(files).forEach(file => {
      // Check file type
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push({ name: file.name, reason: "Invalid file type" });
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({ name: file.name, reason: "File size exceeds 6GB limit" });
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show toast for invalid files
    if (invalidFiles.length > 0) {
      const invalidFilesList = invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\n');
      toast({
        title: `${invalidFiles.length} file(s) couldn't be added`,
        description: invalidFilesList,
        variant: "destructive"
      });
    }
    
    // Show toast for valid files
    if (validFiles.length > 0) {
      toast({
        title: `${validFiles.length} file(s) added for upload`,
        description: "Review the files and click Upload to start processing",
      });
    }
    
    return validFiles;
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected, toast]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected, toast]);

  const openFileSelector = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const getFileSize = (size: number): string => {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive 
            ? "border-primary bg-primary/5" 
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
          accept=".mp3,.wav,.ogg,.m4a"
          multiple
          onChange={handleChange}
        />
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Upload Multiple Audio Files</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop your audio files here or click to browse
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
              <FileAudio className="h-3 w-3 mr-1" />
              <span>MP3</span>
            </div>
            <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
              <FileAudio className="h-3 w-3 mr-1" />
              <span>WAV</span>
            </div>
            <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
              <FileAudio className="h-3 w-3 mr-1" />
              <span>OGG</span>
            </div>
            <div className="flex items-center text-xs bg-muted px-2 py-1 rounded">
              <FileAudio className="h-3 w-3 mr-1" />
              <span>M4A</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload up to 10 files at once (6GB per file max)
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {selectedFiles.map((file, index) => (
              <Card key={`${file.name}-${index}`} className="p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center mr-3">
                    <FileAudio className="h-4 w-4 text-neutral-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{getFileSize(file.size)}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}