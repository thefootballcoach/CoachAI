import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { getAudios, getFeedbacks, getUserProgress } from "@/lib/storage";
import DashboardLayout from "@/components/layout/dashboard-layout";
import AnalyticsDashboard from "@/components/dashboard/analytics-dashboard";
import ReportGenerator from "@/components/dashboard/report-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart2, Upload, Clock, FileText, Download } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["/api/audios"],
    queryFn: getAudios,
  });

  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery({
    queryKey: ["/api/feedbacks"],
    queryFn: getFeedbacks,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
    queryFn: getUserProgress,
  });

  const isLoading = videosLoading || feedbacksLoading || progressLoading;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Coaching Analytics</h1>
            <p className="text-muted-foreground">
              In-depth analysis of your coaching performance
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Session
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : videos && videos.length > 0 ? (
          <AnalyticsDashboard 
            progress={progress} 
            feedbacks={feedbacks} 
            isLoading={isLoading} 
          />
        ) : (
          <Card className="mt-8">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">No analytics data available</CardTitle>
              <CardDescription>
                Upload coaching sessions to start receiving analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Link href="/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Analytics Summary Cards */}
        {!isLoading && videos && videos.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4 mt-8">
            <div className="md:col-span-3">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Session Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>Total Sessions</span>
                        </div>
                        <span className="font-medium">{videos.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>Total Duration</span>
                        </div>
                        <span className="font-medium">
                          {Math.round(videos.reduce((acc, video) => acc + (video.duration || 0), 0) / 60)} mins
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>Avg. Session Score</span>
                        </div>
                        <span className="font-medium">
                          {progress?.overallScoreAvg ? Math.round(progress.overallScoreAvg) : '--'}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Recent Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Communication</span>
                        <span className={`text-sm ${progress?.weeklyImprovement && progress.weeklyImprovement > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                          {progress?.weeklyImprovement 
                            ? `${progress.weeklyImprovement > 0 ? '+' : ''}${Math.round(progress.weeklyImprovement)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Engagement</span>
                        <span className="text-sm text-green-500">+12%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>Instruction</span>
                        <span className="text-sm text-green-500">+8%</span>
                      </div>
                      
                      <div className="pt-4 pb-2">
                        <span className="text-sm font-medium">Growth Trend</span>
                      </div>
                      
                      <div className="h-20 flex items-end gap-1 pb-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="bg-primary/20 rounded-sm w-full"
                            style={{ 
                              height: `${20 + Math.random() * 60}%`,
                              backgroundColor: i > 8 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.2)' 
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Coaching Badge Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Master Communicator</span>
                          <span className="text-xs text-muted-foreground">4/5</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Engagement Expert</span>
                          <span className="text-xs text-muted-foreground">3/5</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Technical Excellence</span>
                          <span className="text-xs text-muted-foreground">2/5</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" className="w-full">View All Badges</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <ReportGenerator 
                videos={videos || []} 
                feedbacks={feedbacks || []} 
                progress={progress}
                pdfTargetElementId="analytics-dashboard"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}