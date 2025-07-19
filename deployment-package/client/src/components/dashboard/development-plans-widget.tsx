import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Target, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  BookOpen,
  ExternalLink
} from "lucide-react";

const createPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetDate: z.string().optional()
});

type CreatePlanForm = z.infer<typeof createPlanSchema>;

interface DevelopmentPlansWidgetProps {
  userId?: number;
}

export default function DevelopmentPlansWidget({ userId }: DevelopmentPlansWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const targetUserId = userId || user?.id;

  // Fetch development plans using useEffect
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/development-plans/${targetUserId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        } else {
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
  }, [targetUserId]);

  // Create plan form
  const form = useForm<CreatePlanForm>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      targetDate: ""
    }
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: CreatePlanForm) => {
      const response = await fetch("/api/development-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          userId: targetUserId,
          targetDate: data.targetDate || null
        })
      });
      if (!response.ok) throw new Error("Failed to create plan");
      return response.json();
    },
    onSuccess: () => {
      // Refresh the plans data
      const fetchPlans = async () => {
        try {
          const response = await fetch(`/api/development-plans/${targetUserId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setPlans(data);
          }
        } catch (error) {
          console.error('Error refetching plans:', error);
        }
      };
      fetchPlans();
      
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Plan Created",
        description: "Development plan created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive"
      });
    }
  });

  const handleCreatePlan = (data: CreatePlanForm) => {
    createPlanMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader className="bg-gradient-to-r from-blue-50/80 to-cyan-50/60 border-b border-slate-200/80 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-blue-500/25 shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Development Plans</CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Professional growth tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {(!userId || userId === user?.id) && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">New Plan</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Development Plan</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter plan title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the development plan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPlanMutation.isPending}>
                        {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            )}
            <Link href="/development-plans" className="inline-flex">
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-50">
                <ExternalLink className="w-4 h-4 mr-1" />
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-2 sm:h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 sm:h-6 w-12 sm:w-16 bg-slate-200 rounded-full shrink-0 ml-2"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Target className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No Development Plans</h3>
            <p className="text-slate-600 mb-3 sm:mb-4 text-sm sm:text-base">Create your first development plan to start tracking your professional growth.</p>
            {(!userId || userId === user?.id) && (
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {plans.slice(0, 3).map((plan: any) => (
              <div key={plan.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1 mr-2">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{plan.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{plan.description}</p>
                  </div>
                  <Badge className={`${getStatusColor(plan.status)} text-xs shrink-0`}>
                    <span className="capitalize">{plan.status}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">
                        {plan.targetDate 
                          ? new Date(plan.targetDate).toLocaleDateString()
                          : "No target"
                        }
                      </span>
                      <span className="sm:hidden">
                        {plan.targetDate 
                          ? new Date(plan.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : "No target"
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">{new Date(plan.createdAt).toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  <Link href={`/development-plan/${plan.id}`}>
                    <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">View & Edit</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {plans.length > 3 && (
              <div className="text-center pt-3 sm:pt-4 border-t">
                <p className="text-xs sm:text-sm text-gray-500">
                  {plans.length - 3} more development plans
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}