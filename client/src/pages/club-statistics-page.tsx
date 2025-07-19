import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Target, Calendar, BarChart3, Award, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface ClubStatistics {
  totalSessionsAnalysed: number;
  sessionsLast4Weeks: number;
  averageOverallScore: number;
  trendData: {
    currentMonth: number;
    previousMonth: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
  };
  commonWeaknesses: Array<{
    area: string;
    count: number;
    percentage: number;
  }>;
  coachPerformance: Array<{
    id: number;
    name: string;
    averageScore: number;
    sessionsAnalysed: number;
    strengthArea: string;
    weaknessArea: string;
    recentTrend: 'improving' | 'declining' | 'stable';
  }>;
  monthlyTrends: Array<{
    month: string;
    averageScore: number;
    sessionCount: number;
  }>;
}

export default function ClubStatisticsPage() {
  const { data: statistics, isLoading, error } = useQuery<ClubStatistics>({
    queryKey: ["/api/club/statistics"],
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 via-transparent to-slate-700/10"></div>
          <div className="relative p-8">
            <div className="flex items-center mb-6">
              <Link href="/club-dashboard">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl mr-4 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Club Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                  Club Statistics
                </h1>
                <p className="text-slate-400 mt-1">
                  Comprehensive analytics and performance insights
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 -mt-4 relative z-10">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>Unable to load club statistics. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/10 via-transparent to-slate-700/10"></div>
        <div className="relative p-8">
          <div className="flex items-center mb-6">
            <Link href="/club-dashboard">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl mr-4 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Club Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                Club Statistics
              </h1>
              <p className="text-slate-400 mt-1">
                Comprehensive analytics and performance insights
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 -mt-4 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Total Sessions Analysed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      {statistics?.totalSessionsAnalysed || 0}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">All time</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Sessions Last 4 Weeks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {statistics?.sessionsLast4Weeks || 0}
                    </div>
                    <p className="text-xs text-green-600 mt-1">Recent activity</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-800 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Average Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {statistics?.averageOverallScore || 0}/100
                    </div>
                    <p className="text-xs text-purple-600 mt-1">Club average</p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Performance Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-orange-900">
                        {statistics?.trendData?.change || 0}%
                      </div>
                      {statistics?.trendData?.direction === 'up' && (
                        <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
                      )}
                      {statistics?.trendData?.direction === 'down' && (
                        <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-orange-600 mt-1">vs last month</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Common Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Target className="h-5 w-5 mr-2" />
                Common Development Areas
              </CardTitle>
              <CardDescription>
                Most frequent areas requiring improvement across all coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {statistics?.commonWeaknesses?.map((weakness, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                        <span className="font-medium text-slate-700">{weakness.area}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          {weakness.count} coaches
                        </Badge>
                        <Progress value={weakness.percentage} className="w-20" />
                        <span className="text-sm text-slate-600">{weakness.percentage}%</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-slate-500 py-8">No development areas data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coach Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Users className="h-5 w-5 mr-2" />
                Individual Coach Performance
              </CardTitle>
              <CardDescription>
                Detailed performance metrics for each coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {statistics?.coachPerformance?.map((coach, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-slate-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800">{coach.name}</h3>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-slate-900 mr-2">
                            {coach.averageScore}/100
                          </span>
                          {coach.recentTrend === 'improving' && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {coach.recentTrend === 'declining' && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          {coach.recentTrend === 'stable' && (
                            <Target className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 mb-1">Sessions Analysed</p>
                          <p className="font-medium">{coach.sessionsAnalysed}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-1">Area of Strength</p>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <p className="font-medium text-green-700">{coach.strengthArea}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-600 mb-1">Development Area</p>
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                            <p className="font-medium text-orange-700">{coach.weaknessArea}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-center text-slate-500 py-8">No coach performance data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}