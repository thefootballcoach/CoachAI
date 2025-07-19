import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

interface ChunkedUploadProps {
  file: File;
  formData: FormData;
  onComplete: (response: any) => void;
  onError: (error: string) => void;
  onProgress: (progress: number) => void;
}

export function ChunkedUpload({ file, formData, onComplete, onError, onProgress }: ChunkedUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const uploadChunk = async (chunkIndex: number): Promise<void> => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const chunkData = new FormData();
    chunkData.append('chunk', chunk);
    chunkData.append('chunkIndex', chunkIndex.toString());
    chunkData.append('totalChunks', totalChunks.toString());
    chunkData.append('fileName', file.name);
    chunkData.append('fileSize', file.size.toString());
    
    if (uploadId) {
      chunkData.append('uploadId', uploadId);
    }

    // Add form data only on first chunk
    if (chunkIndex === 0) {
      for (const [key, value] of formData.entries()) {
        if (key !== 'audio') {
          chunkData.append(key, value);
        }
      }
    }

    try {
      const response = await fetch('/api/audios/upload-chunk', {
        method: 'POST',
        body: chunkData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!uploadId && result.uploadId) {
        setUploadId(result.uploadId);
      }

      // Update progress
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      onProgress(Math.round(progress));
      setCurrentChunk(chunkIndex + 1);

      // If this was the last chunk, we're done
      if (chunkIndex === totalChunks - 1) {
        onComplete(result);
      } else {
        // Upload next chunk
        await uploadChunk(chunkIndex + 1);
      }
    } catch (error) {
      console.error(`Failed to upload chunk ${chunkIndex}:`, error);
      onError(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
    }
  };

  const startUpload = async () => {
    setUploading(true);
    setCurrentChunk(0);
    
    try {
      await uploadChunk(0);
    } catch (error) {
      console.error('Chunked upload failed:', error);
    }
  };

  if (!uploading) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your file is {(file.size / 1024 / 1024 / 1024).toFixed(2)}GB. Due to its large size, 
            it will be uploaded in chunks for better reliability.
          </AlertDescription>
        </Alert>
        <Button onClick={startUpload} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Start Chunked Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Uploading chunk {currentChunk} of {totalChunks}
      </div>
      <Progress value={(currentChunk / totalChunks) * 100} />
      <div className="text-xs text-muted-foreground">
        {(currentChunk * CHUNK_SIZE / 1024 / 1024).toFixed(1)}MB / {(file.size / 1024 / 1024).toFixed(1)}MB uploaded
      </div>
    </div>
  );
}