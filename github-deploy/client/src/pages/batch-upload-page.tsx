import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BatchUpload from "@/components/dashboard/batch-upload";
import UploadProgress from "@/components/dashboard/upload-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { uploadAudio } from "@/lib/storage";

export default function BatchUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [completedUploads, setCompletedUploads] = useState<number>(0);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleFilesSelected = (files: File[]) => {
    // Limit to 10 files maximum
    const allFiles = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(allFiles);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setSelectedFiles([]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setCompletedUploads(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const currentFileIndex = i;
      
      try {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('title', file.name.split('.')[0]);
        formData.append('description', 'Batch upload: ' + file.name);
        formData.append('filesize', file.size.toString());

        // Calculate overall progress
        const fileProgress = (progress: number) => {
          const totalProgress = ((currentFileIndex * 100) + progress) / selectedFiles.length;
          setUploadProgress(Math.round(totalProgress));
        };

        await uploadAudio(formData, fileProgress);
        successCount++;
        setCompletedUploads(prev => prev + 1);

      } catch (error: any) {
        failCount++;
        console.error(`Error uploading ${file.name}:`, error);
        
        toast({
          title: `Failed to upload ${file.name}`,
          description: error.message || "There was an error uploading this file",
          variant: "destructive",
        });
      }

      // Update progress to reflect completion of current file
      const totalProgress = ((currentFileIndex + 1) * 100) / selectedFiles.length;
      setUploadProgress(Math.round(totalProgress));
    }

    toast({
      title: "Batch upload complete",
      description: `Successfully uploaded ${successCount} files. ${failCount > 0 ? `Failed to upload ${failCount} files.` : ''}`,
      variant: failCount > 0 ? "default" : "default",
    });

    // Give a moment to show completion before redirecting
    setTimeout(() => {
      setUploading(false);
      window.location.href = "/dashboard";
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Batch Upload Audio Files</h1>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Multiple Audio Files</CardTitle>
            <CardDescription>
              Upload multiple coaching session audio files at once to receive AI-powered feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploading ? (
              <div className="space-y-4">
                <UploadProgress progress={uploadProgress} />
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Upload progress</span>
                    <span className="text-sm">{completedUploads} of {selectedFiles.length} files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <div className="text-sm">
                      {completedUploads === selectedFiles.length 
                        ? "All files uploaded successfully!" 
                        : `Uploading file ${completedUploads + 1} of ${selectedFiles.length}...`}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <BatchUpload 
                  onFilesSelected={handleFilesSelected} 
                  onRemoveFile={handleRemoveFile}
                  selectedFiles={selectedFiles}
                />

                {selectedFiles.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-6">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-amber-800">Before you upload</h4>
                        <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                          <li>Files will be processed one at a time</li>
                          <li>Each file requires 1 credit for analysis</li>
                          <li>Ensure clear audio quality with minimal background noise</li>
                          <li>Recordings should be no longer than 60 minutes</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {selectedFiles.length > 0 && !uploading && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="ml-2"
                  disabled={selectedFiles.length === 0}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
                </Button>
              </>
            )}
            
            {uploading && (
              <Button
                variant="outline"
                disabled
                className="ml-auto"
              >
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Uploading...
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}