import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/dashboard-layout";
import DevelopmentPlansWidget from "@/components/dashboard/development-plans-widget";
import { 
  Target, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Plus,
  BookOpen,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DevelopmentPlan {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  goalsCount: number;
  completedGoals: number;
}

export default function DevelopmentPlansListPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetCoach, setTargetCoach] = useState<any>(null);

  // Get coachId from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const coachId = urlParams.get('coachId');
  const targetUserId = coachId ? parseInt(coachId) : user?.id;

  // Fetch development plans using useEffect to avoid infinite loop
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        
        // If viewing another coach's plans, fetch their profile first
        if (coachId && parseInt(coachId) !== user?.id) {
          const coachResponse = await fetch(`/api/users/${coachId}/profile`, {
            credentials: 'include'
          });
          if (coachResponse.ok) {
            const coachData = await coachResponse.json();
            setTargetCoach(coachData);
          }
        }
        
        const response = await fetch(`/api/development-plans/${targetUserId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        } else {
          console.error('Failed to fetch development plans');
          setPlans([]);
        }
      } catch (error) {
        console.error('Error fetching development plans:', error);
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [targetUserId, coachId, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "active": return <TrendingUp className="w-4 h-4" />;
      case "paused": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading development plans...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-800 mb-2">
                {targetCoach ? `${targetCoach.name || targetCoach.username}'s Development Plans` : 'Development Plans'}
              </h1>
              <p className="text-lg text-slate-600">
                {targetCoach ? `Managing development goals for ${targetCoach.name || targetCoach.username}` : 'Track your professional growth and coaching development goals'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Target className="w-3 h-3 mr-1" />
                {plans.length} {plans.length === 1 ? 'Plan' : 'Plans'}
              </Badge>
            </div>
          </div>

          {/* Development Plans Widget - Shows creation interface and summary */}
          <DevelopmentPlansWidget />

          {/* Detailed Plans List */}
          {plans.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">All Development Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2">
                          {plan.title}
                        </CardTitle>
                        <Badge className={getStatusColor(plan.status)}>
                          {getStatusIcon(plan.status)}
                          <span className="ml-1 capitalize">{plan.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-600 text-sm line-clamp-3">
                        {plan.description}
                      </p>
                      
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-800">
                            {plan.completedGoals || 0} / {plan.goalsCount || 0} goals
                          </span>
                        </div>
                        <Progress 
                          value={plan.progress || 0} 
                          className="h-2" 
                        />
                      </div>

                      {/* Dates */}
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Target: {plan.targetDate 
                            ? new Date(plan.targetDate).toLocaleDateString()
                            : "No target date"
                          }
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Created: {new Date(plan.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href={`/development-plan/${plan.id}`}>
                        <Button className="w-full" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Development Plans Yet</h3>
                <p className="text-gray-500 mb-6">
                  {targetCoach 
                    ? `${targetCoach.name || targetCoach.username} hasn't created any development plans yet. You can help them get started by creating a plan together.`
                    : 'Create your first development plan to start tracking your coaching growth and goals.'
                  }
                </p>
                <p className="text-sm text-gray-400">
                  Use the "New Plan" button in the widget above to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}