import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";

const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  targetDate: z.string().optional()
});

const createActionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional()
});

type CreateGoalForm = z.infer<typeof createGoalSchema>;
type CreateActionForm = z.infer<typeof createActionSchema>;

export default function DevelopmentPlanPage() {
  const { planId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Fetch development plan with details
  const { data: plan, isLoading } = useQuery({
    queryKey: ["/api/development-plans/detail", planId],
    queryFn: async () => {
      const response = await fetch(`/api/development-plans/detail/${planId}`);
      if (!response.ok) throw new Error("Failed to fetch development plan");
      return response.json();
    },
    enabled: !!planId
  });

  // Create goal form
  const goalForm = useForm<CreateGoalForm>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      targetDate: ""
    }
  });

  // Create action form
  const actionForm = useForm<CreateActionForm>({
    resolver: zodResolver(createActionSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: ""
    }
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: CreateGoalForm) => {
      return apiRequest("/api/development-goals", {
        method: "POST",
        body: JSON.stringify({
          planId: parseInt(planId as string),
          ...data,
          targetDate: data.targetDate || null
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/development-plans/detail", planId] });
      setIsAddGoalOpen(false);
      goalForm.reset();
      toast({
        title: "Goal Created",
        description: "Development goal added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive"
      });
    }
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: CreateActionForm) => {
      return apiRequest("/api/development-actions", {
        method: "POST",
        body: JSON.stringify({
          goalId: selectedGoalId,
          ...data,
          dueDate: data.dueDate || null
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/development-plans/detail", planId] });
      setIsAddActionOpen(false);
      actionForm.reset();
      setSelectedGoalId(null);
      toast({
        title: "Action Created",
        description: "Development action added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create action",
        variant: "destructive"
      });
    }
  });

  const handleCreateGoal = (data: CreateGoalForm) => {
    createGoalMutation.mutate(data);
  };

  const handleCreateAction = (data: CreateActionForm) => {
    createActionMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "not_started": return "bg-gray-100 text-gray-800";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading development plan...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Plan Not Found</h1>
          <p className="text-gray-600 mb-4">The development plan you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{plan.title}</h1>
              <p className="text-gray-600">{plan.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(plan.priority)}>
              {plan.priority} priority
            </Badge>
            <Badge className={getStatusColor(plan.status)}>
              {plan.status}
            </Badge>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plan.goals?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {plan.goals?.filter((g: any) => g.status === 'completed').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {plan.goals?.filter((g: any) => g.status === 'in_progress').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {plan.goals?.length > 0 
                  ? Math.round((plan.goals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / plan.goals.length))
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Development Goals
              </CardTitle>
              <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Development Goal</DialogTitle>
                  </DialogHeader>
                  <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(handleCreateGoal)} className="space-y-4">
                      <FormField
                        control={goalForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter goal title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the goal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="technical">Technical Skills</SelectItem>
                                <SelectItem value="leadership">Leadership</SelectItem>
                                <SelectItem value="player_management">Player Management</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={goalForm.control}
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
                        <Button type="button" variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createGoalMutation.isPending}>
                          {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.goals?.map((goal: any) => (
                <Card key={goal.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <p className="text-gray-600 text-sm">{goal.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{goal.category}</Badge>
                          <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-2">Progress</div>
                        <div className="text-2xl font-bold">{goal.progress || 0}%</div>
                        <Progress value={goal.progress || 0} className="w-24 mt-2" />
                      </div>
                    </div>
                    
                    {/* Actions for this goal */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Action Items</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setIsAddActionOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Action
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {goal.actions?.map((action: any) => (
                          <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-sm">{action.title}</div>
                              <div className="text-xs text-gray-500">{action.description}</div>
                            </div>
                            <Badge className={getStatusColor(action.status)} size="sm">
                              {action.status}
                            </Badge>
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500 italic">No actions yet</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Goals Yet</h3>
                  <p className="text-gray-500">Start by adding your first development goal</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Action Dialog */}
        <Dialog open={isAddActionOpen} onOpenChange={setIsAddActionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Action Item</DialogTitle>
            </DialogHeader>
            <Form {...actionForm}>
              <form onSubmit={actionForm.handleSubmit(handleCreateAction)} className="space-y-4">
                <FormField
                  control={actionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter action title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={actionForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the action" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={actionForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddActionOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createActionMutation.isPending}>
                    {createActionMutation.isPending ? "Creating..." : "Create Action"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}