import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  BarChart2, 
  ChevronRight, 
  MessageSquare 
} from "lucide-react";
import { Feedback } from "@shared/schema";

interface FeedbackCardProps {
  feedback: Feedback;
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  // Parse strengths and improvements if they're strings
  const strengths = typeof feedback.strengths === 'string' 
    ? JSON.parse(feedback.strengths as string) 
    : feedback.strengths;
  
  const improvements = typeof feedback.improvements === 'string' 
    ? JSON.parse(feedback.improvements as string) 
    : feedback.improvements;

  // Format date
  const formattedDate = new Date(feedback.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Link href={`/feedback/${feedback.videoId}`}>
      <Card className="feedback-card cursor-pointer hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formattedDate}</span>
              </div>
              <h3 className="font-medium text-base mb-3">Coaching Session Analysis</h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Overall Score</span>
                  <span>{feedback.overallScore}/100</span>
                </div>
                <Progress value={feedback.overallScore} className="h-2" />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="bg-muted py-1 px-2 rounded-md text-xs flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  <span>Communication: {feedback.communicationScore}</span>
                </div>
                <div className="bg-muted py-1 px-2 rounded-md text-xs flex items-center">
                  <BarChart2 className="h-3 w-3 mr-1" />
                  <span>Engagement: {feedback.engagementScore}</span>
                </div>
              </div>
              
              <div className="text-sm text-neutral-700 line-clamp-2">
                {feedback.summary}
              </div>
            </div>
            
            <div className="ml-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {strengths && Array.isArray(strengths) && strengths.slice(0, 2).map((strength: string, index: number) => (
                <div key={index} className="bg-green-50 text-green-700 py-1 px-2 rounded-md text-xs">
                  {strength}
                </div>
              ))}
              {improvements && Array.isArray(improvements) && improvements.slice(0, 1).map((improvement: string, index: number) => (
                <div key={index} className="bg-amber-50 text-amber-700 py-1 px-2 rounded-md text-xs">
                  {improvement}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
