import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, ChevronRight, Search } from "lucide-react";
import { Video, Feedback } from "@shared/schema";
import { getFeedbacks } from "@/lib/storage";

export default function FeedbackListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: feedbacks, isLoading, error } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
    queryFn: getFeedbacks,
  });

  if (error) {
    console.error("Error fetching feedbacks:", error);
    toast({
      title: "Error",
      description: "Failed to load feedback sessions",
      variant: "destructive",
    });
  }

  const filteredFeedbacks = feedbacks?.filter(feedback => {
    if (!searchTerm) return true;
    return feedback.videoId.toString().includes(searchTerm) || 
           feedback.summary?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Feedback Sessions</h1>
          <div className="mt-4 sm:mt-0 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input 
              type="text" 
              placeholder="Search feedback..." 
              className="py-2 pl-10 pr-4 w-full sm:w-64 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-muted-foreground">Loading feedback sessions...</p>
          </div>
        ) : filteredFeedbacks && filteredFeedbacks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        Session #{feedback.videoId}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {feedback.createdAt ? new Date(String(feedback.createdAt)).toLocaleDateString() : 'Recent'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1 bg-primary-foreground rounded-full px-3 py-1">
                      <span className="text-primary font-bold">{feedback.overallScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3 mb-4">
                    {feedback.summary || "No summary available"}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div>
                      <div className="font-medium">Communication</div>
                      <div className="mt-1 text-sm">{feedback.communicationScore}/100</div>
                    </div>
                    <div>
                      <div className="font-medium">Engagement</div>
                      <div className="mt-1 text-sm">{feedback.engagementScore}/100</div>
                    </div>
                    <div>
                      <div className="font-medium">Instruction</div>
                      <div className="mt-1 text-sm">{feedback.instructionScore}/100</div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <Button 
                    variant="ghost" 
                    className="w-full justify-between"
                    onClick={() => navigate(`/feedback/${feedback.videoId}`)}
                  >
                    View full feedback
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No feedback sessions found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchTerm 
                ? "No feedback sessions match your search. Try a different search term." 
                : "You don't have any feedback sessions yet. Upload a coaching session to receive feedback."}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/upload')}>
                Upload a session
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}