import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, RadioTower, Upload, Waves } from "lucide-react";

interface UploadProgressProps {
  progress: number;
}

export default function UploadProgress({ progress }: UploadProgressProps) {
  const [stage, setStage] = useState<"uploading" | "processing" | "analyzing" | "complete">("uploading");

  // Determine the current stage based on the progress
  useEffect(() => {
    if (progress < 90) {
      setStage("uploading");
    } else if (progress < 95) {
      setStage("processing");
    } else if (progress < 100) {
      setStage("analyzing");
    } else {
      setStage("complete");
    }
  }, [progress]);

  return (
    <Card className="p-4 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              {stage === "uploading" && (
                <>
                  <Upload className="h-4 w-4 mr-2 text-blue-500 animate-pulse" />
                  <span className="font-medium">Uploading file...</span>
                </>
              )}
              {stage === "processing" && (
                <>
                  <Waves className="h-4 w-4 mr-2 text-amber-500 animate-pulse" />
                  <span className="font-medium">Processing audio...</span>
                </>
              )}
              {stage === "analyzing" && (
                <>
                  <RadioTower className="h-4 w-4 mr-2 text-purple-500 animate-pulse" />
                  <span className="font-medium">Preparing for analysis...</span>
                </>
              )}
              {stage === "complete" && (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <span className="font-medium">Upload complete!</span>
                </>
              )}
            </div>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className={`text-xs text-center ${stage === "uploading" || stage === "processing" || stage === "analyzing" || stage === "complete" ? "text-blue-500" : "text-muted-foreground"}`}>
            <div className={`mx-auto w-6 h-6 rounded-full mb-1 flex items-center justify-center ${stage === "uploading" || stage === "processing" || stage === "analyzing" || stage === "complete" ? "bg-blue-100" : "bg-muted"}`}>
              <Upload className="h-3 w-3" />
            </div>
            <span>Uploading</span>
          </div>
          
          <div className={`text-xs text-center ${stage === "processing" || stage === "analyzing" || stage === "complete" ? "text-amber-500" : "text-muted-foreground"}`}>
            <div className={`mx-auto w-6 h-6 rounded-full mb-1 flex items-center justify-center ${stage === "processing" || stage === "analyzing" || stage === "complete" ? "bg-amber-100" : "bg-muted"}`}>
              <Waves className="h-3 w-3" />
            </div>
            <span>Processing</span>
          </div>
          
          <div className={`text-xs text-center ${stage === "analyzing" || stage === "complete" ? "text-purple-500" : "text-muted-foreground"}`}>
            <div className={`mx-auto w-6 h-6 rounded-full mb-1 flex items-center justify-center ${stage === "analyzing" || stage === "complete" ? "bg-purple-100" : "bg-muted"}`}>
              <RadioTower className="h-3 w-3" />
            </div>
            <span>Preparing</span>
          </div>
          
          <div className={`text-xs text-center ${stage === "complete" ? "text-green-500" : "text-muted-foreground"}`}>
            <div className={`mx-auto w-6 h-6 rounded-full mb-1 flex items-center justify-center ${stage === "complete" ? "bg-green-100" : "bg-muted"}`}>
              <CheckCircle2 className="h-3 w-3" />
            </div>
            <span>Complete</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          {stage === "uploading" && "Transferring your audio file to our secure servers..."}
          {stage === "processing" && "Preparing your audio for analysis by our AI system..."}
          {stage === "analyzing" && "Setting up AI analysis of your coaching session..."}
          {stage === "complete" && "Your file has been successfully uploaded and is being analyzed!"}
        </div>
      </div>
    </Card>
  );
}