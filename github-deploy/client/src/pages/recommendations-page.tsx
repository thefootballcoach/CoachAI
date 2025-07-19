import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, Brain, Target, CheckCircle2, Clock, TrendingUp, 
  Lightbulb, BookOpen, Activity, Zap, Eye, Sparkles,
  PlayCircle, Calendar, Award, Download
} from "lucide-react";

export default function RecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const videoId = parseInt(id);

  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: [`/api/audios/${videoId}`],
    enabled: !!videoId,
  });

  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: [`/api/audios/${videoId}/recommendations`],
    enabled: !!videoId,
  });

  if (videoLoading || recommendationsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!video || !recommendationsData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Recommendations not available</h3>
          <p className="text-muted-foreground mb-6">Unable to load coaching recommendations for this session.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const recommendations = (recommendationsData as any)?.recommendations;
  const analysisType = (recommendationsData as any)?.analysisType;
  const isMultimodal = analysisType === 'multimodal';

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center mb-6 lg:mb-0">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/feedback/${videoId}`)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl mr-4 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Feedback
                </Button>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                    AI Coaching Recommendations
                  </h1>
                  <p className="text-slate-400 mt-1 flex items-center">
                    <Brain className="mr-2 h-4 w-4" />
                    Personalized development plan for "{(video as any)?.title || 'Session'}"
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Analysis Type Badge */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  isMultimodal 
                    ? 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border-emerald-200' 
                    : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200'
                }`}>
                  {isMultimodal ? (
                    <>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <Eye className="w-3 h-3" />
                      <span className="text-sm font-semibold">Multimodal Analysis</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3 h-3" />
                      <span className="text-sm font-semibold">Audio Analysis</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 -mt-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Overall Assessment */}
            <Card className="mb-8 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 text-lg leading-relaxed">
                  {recommendations.overallAssessment}
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="recommendations" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 rounded-2xl p-2 mb-8">
                <TabsTrigger value="recommendations" className="rounded-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger value="exercises" className="rounded-xl font-semibold flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Practice Exercises
                </TabsTrigger>
                <TabsTrigger value="progress" className="rounded-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Progress Tracking
                </TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Strengths to Maintain */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Strengths to Maintain
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.strengthsToMaintain?.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-green-700">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Priority Areas */}
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Priority Development Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.priorityAreas?.map((area: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-orange-700">
                            <Target className="w-4 h-4 mt-0.5 text-orange-500" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Recommendations */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    Detailed Recommendations
                  </h3>
                  
                  {recommendations.recommendations?.map((rec: any, index: number) => (
                    <Card key={index} className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-slate-800">{rec.category}</CardTitle>
                            <CardDescription className="mt-2 text-slate-600">{rec.recommendation}</CardDescription>
                          </div>
                          <Badge className={`${getPriorityColor(rec.priority)} font-semibold`}>
                            {rec.priority} Priority
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                              Implementation Steps
                            </h4>
                            <ul className="space-y-1">
                              {rec.implementationSteps?.map((step: string, stepIndex: number) => (
                                <li key={stepIndex} className="text-sm text-slate-600 pl-6 relative">
                                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-green-500" />
                                Timeframe: {rec.timeframe}
                              </h5>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-700 flex items-center gap-2">
                                <Award className="w-4 h-4 text-purple-500" />
                                Expected Outcome
                              </h5>
                              <p className="text-sm text-slate-600 mt-1">{rec.expectedOutcome}</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-slate-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Research Backing
                              </h5>
                              <p className="text-sm text-slate-600 mt-1">{rec.researchBacking}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Practice Exercises Tab */}
              <TabsContent value="exercises" className="mt-8">
                <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <PlayCircle className="w-6 h-6 text-blue-600" />
                          Practice Exercises
                        </CardTitle>
                        <CardDescription>
                          Specific drills and exercises to develop your coaching skills
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/api/download/drill-guide';
                          link.download = 'CoachAI-Drill-Creation-Guide.svg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Download Guide
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.practiceExercises?.map((exercise: string, index: number) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-slate-700">{exercise}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Progress Tracking Tab */}
              <TabsContent value="progress" className="mt-8">
                <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      Progress Tracking Methods
                    </CardTitle>
                    <CardDescription>
                      Ways to measure and monitor your coaching development
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.progressTracking?.map((method: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                          <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                          <p className="text-slate-700">{method}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-8">
                <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-purple-600" />
                      Development Timeline
                    </CardTitle>
                    <CardDescription>
                      Recommended timeline for implementing improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200/50">
                      <p className="text-slate-700 text-lg">{recommendations.nextStepsTimeline}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}