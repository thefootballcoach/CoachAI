import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, MessageSquare, Star, Calendar, User, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Coach {
  id: number;
  name: string;
  email: string;
  position: string;
  ageGroup: string;
}

interface CustomFeedbackReport {
  id: number;
  authorId: number;
  coachId: number;
  title: string;
  description: string;
  reportType: string;
  priority: string;
  status: string;
  keyObservations: string[];
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  actionItems: Array<{
    item: string;
    deadline: string;
    priority: string;
    status: string;
  }>;
  overallRating: number;
  communicationRating: number;
  technicalRating: number;
  leadershipRating: number;
  developmentRating: number;
  observationPeriod: string;
  sessionTypes: string[];
  playerAgeGroups: string[];
  nextReviewDate: string;
  followUpRequired: boolean;
  privateNotes: string;
  coachResponse: string;
  coachResponseDate: string;
  isConfidential: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CustomFeedbackReportsPage() {
  const [selectedTab, setSelectedTab] = useState("my-reports");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomFeedbackReport | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch custom feedback reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/custom-feedback-reports"],
    enabled: true
  });

  // Fetch available coaches
  const { data: coaches } = useQuery({
    queryKey: ["/api/custom-feedback-reports/coaches/available"],
    enabled: true
  });

  // Create new report mutation
  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await fetch("/api/custom-feedback-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to create report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-feedback-reports"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Custom feedback report created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create custom feedback report", variant: "destructive" });
    }
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/custom-feedback-reports/${reportId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to delete report");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-feedback-reports"] });
      toast({ title: "Success", description: "Report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "reviewed": return "bg-blue-100 text-blue-800";
      case "archived": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const CreateReportDialog = () => {
    const [formData, setFormData] = useState({
      coachId: "",
      title: "",
      description: "",
      reportType: "individual_feedback",
      priority: "medium",
      keyObservations: [""],
      strengths: [""],
      areasForImprovement: [""],
      recommendations: [""],
      overallRating: 5,
      communicationRating: 5,
      technicalRating: 5,
      leadershipRating: 5,
      developmentRating: 5,
      observationPeriod: "",
      sessionTypes: [],
      playerAgeGroups: [],
      nextReviewDate: "",
      followUpRequired: false,
      privateNotes: "",
      isConfidential: false,
      tags: [""]
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createReportMutation.mutate({
        ...formData,
        coachId: parseInt(formData.coachId),
        keyObservations: formData.keyObservations.filter(obs => obs.trim()),
        strengths: formData.strengths.filter(str => str.trim()),
        areasForImprovement: formData.areasForImprovement.filter(area => area.trim()),
        recommendations: formData.recommendations.filter(rec => rec.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        nextReviewDate: formData.nextReviewDate ? new Date(formData.nextReviewDate).toISOString() : null
      });
    };

    const addArrayItem = (field: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field as keyof typeof prev] as string[], ""]
      }));
    };

    const updateArrayItem = (field: string, index: number, value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => 
          i === index ? value : item
        )
      }));
    };

    const removeArrayItem = (field: string, index: number) => {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
      }));
    };

    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Feedback Report</DialogTitle>
            <DialogDescription>
              Create a personalized feedback report for a coach under your management.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coach">Select Coach</Label>
                <Select value={formData.coachId} onValueChange={(value) => setFormData(prev => ({ ...prev, coachId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {coaches?.map((coach: Coach) => (
                      <SelectItem key={coach.id} value={coach.id.toString()}>
                        {coach.name} - {coach.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_feedback">Individual Feedback</SelectItem>
                    <SelectItem value="performance_review">Performance Review</SelectItem>
                    <SelectItem value="development_plan">Development Plan</SelectItem>
                    <SelectItem value="observation_report">Observation Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Quarterly Performance Review - John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief overview of this feedback report..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observationPeriod">Observation Period</Label>
                <Input
                  id="observationPeriod"
                  value={formData.observationPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, observationPeriod: e.target.value }))}
                  placeholder="e.g., January 2024, Q4 2023"
                />
              </div>
            </div>

            {/* Rating Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Ratings (1-10)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'overallRating', label: 'Overall' },
                  { key: 'communicationRating', label: 'Communication' },
                  { key: 'technicalRating', label: 'Technical' },
                  { key: 'leadershipRating', label: 'Leadership' },
                  { key: 'developmentRating', label: 'Development' }
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData[key as keyof typeof formData] as number}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        [key]: parseInt(e.target.value) || 5 
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Array Fields */}
            {[
              { key: 'keyObservations', label: 'Key Observations' },
              { key: 'strengths', label: 'Strengths' },
              { key: 'areasForImprovement', label: 'Areas for Improvement' },
              { key: 'recommendations', label: 'Recommendations' }
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                {(formData[key as keyof typeof formData] as string[]).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem(key, index, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem(key, index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem(key)}
                >
                  Add {label.slice(0, -1)}
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextReviewDate">Next Review Date</Label>
                <Input
                  id="nextReviewDate"
                  type="date"
                  value={formData.nextReviewDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
                <Label htmlFor="followUpRequired">Follow-up Required</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateNotes">Private Notes (Admin Only)</Label>
              <Textarea
                id="privateNotes"
                value={formData.privateNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, privateNotes: e.target.value }))}
                placeholder="Internal notes not visible to the coach..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const ViewReportDialog = ({ report }: { report: CustomFeedbackReport | null }) => {
    if (!report) return null;

    return (
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{report.title}</DialogTitle>
                <DialogDescription>{report.description}</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={getPriorityColor(report.priority)}>
                  {report.priority}
                </Badge>
                <Badge className={getStatusColor(report.status)}>
                  {report.status}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Performance Ratings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Performance Ratings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Overall', value: report.overallRating },
                  { label: 'Communication', value: report.communicationRating },
                  { label: 'Technical', value: report.technicalRating },
                  { label: 'Leadership', value: report.leadershipRating },
                  { label: 'Development', value: report.developmentRating }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{value}/10</div>
                    <div className="text-sm text-gray-600">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Sections */}
            {[
              { title: 'Key Observations', items: report.keyObservations },
              { title: 'Strengths', items: report.strengths },
              { title: 'Areas for Improvement', items: report.areasForImprovement },
              { title: 'Recommendations', items: report.recommendations }
            ].map(({ title, items }) => (
              <div key={title}>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <ul className="space-y-1">
                  {items?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Coach Response */}
            {report.coachResponse && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Coach Response
                </h3>
                <p className="mb-2">{report.coachResponse}</p>
                <p className="text-sm text-gray-600">
                  Responded on {format(new Date(report.coachResponseDate), "PPP")}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Observation Period:</span> {report.observationPeriod}
                </div>
                <div>
                  <span className="font-medium">Next Review:</span> {
                    report.nextReviewDate ? format(new Date(report.nextReviewDate), "PPP") : "Not scheduled"
                  }
                </div>
                <div>
                  <span className="font-medium">Follow-up Required:</span> {
                    report.followUpRequired ? "Yes" : "No"
                  }
                </div>
                <div>
                  <span className="font-medium">Created:</span> {format(new Date(report.createdAt), "PPP")}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (reportsLoading) {
    return <div className="flex justify-center p-8">Loading custom feedback reports...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Feedback Reports</h1>
          <p className="text-gray-600">Create and manage personalized feedback reports for your coaches</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="pending-review">Pending Review</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="space-y-4">
          <div className="grid gap-4">
            {reports?.map((report: CustomFeedbackReport) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(report.priority)}>
                        {report.priority}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Coach Report
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(report.createdAt), "PPP")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {report.overallRating}/10
                      </span>
                      {report.coachResponse && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Coach Responded
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending-review" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No reports pending review</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateReportDialog />
      <ViewReportDialog report={selectedReport} />
    </div>
  );
}