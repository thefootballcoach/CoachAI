import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Clock, Database, Upload, User, Shield, Server, Bug, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface ErrorLog {
  id: number;
  userId: number | null;
  errorType: string;
  severity: string;
  message: string;
  stackTrace: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  additionalData: string | null;
  resolved: boolean;
  resolvedBy: number | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

interface ErrorStats {
  total: number;
  unresolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

const severityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const typeIcons = {
  upload_error: Upload,
  auth_error: User,
  api_error: Server,
  system_error: AlertTriangle,
  database_error: Database,
  validation_error: Shield,
};

export default function ErrorLogsPage() {
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(true);
  const { toast } = useToast();

  const { data: errorLogs = [], isLoading } = useQuery({
    queryKey: ["/api/error-logs", { unresolved: showUnresolvedOnly }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/error-logs?unresolved=${showUnresolvedOnly}`);
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/error-logs/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/error-logs/stats");
      return res.json();
    },
  });

  const resolveErrorMutation = useMutation({
    mutationFn: async ({ errorId, notes }: { errorId: number; notes: string }) => {
      const res = await apiRequest("PUT", `/api/error-logs/${errorId}/resolve`, {
        resolutionNotes: notes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs/stats"] });
      setSelectedError(null);
      setResolutionNotes("");
      toast({
        title: "Error resolved",
        description: "The error has been marked as resolved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resolve error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleResolveError = () => {
    if (selectedError) {
      resolveErrorMutation.mutate({
        errorId: selectedError.id,
        notes: resolutionNotes,
      });
    }
  };

  const getErrorTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || Bug;
    return <IconComponent className="h-4 w-4" />;
  };

  const parseAdditionalData = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading error logs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
            <p className="text-muted-foreground">
              Monitor and resolve system errors and user issues
            </p>
          </div>
          <Button
            variant={showUnresolvedOnly ? "default" : "outline"}
            onClick={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showUnresolvedOnly ? "Show All" : "Show Unresolved"}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.unresolved}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.bySeverity.critical || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upload Errors</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.byType.upload_error || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Error Log Entries</CardTitle>
            <CardDescription>
              {showUnresolvedOnly ? "Unresolved errors requiring attention" : "All system errors"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No errors found</h3>
                <p className="text-muted-foreground">
                  {showUnresolvedOnly ? "All errors have been resolved!" : "No errors recorded"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {errorLogs.map((error: ErrorLog) => (
                  <div
                    key={error.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedError(error)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getErrorTypeIcon(error.errorType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={severityColors[error.severity as keyof typeof severityColors]}
                            >
                              {error.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {error.errorType.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {error.resolved && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                RESOLVED
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm mb-1 truncate">
                            {error.message}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(error.createdAt), { addSuffix: true })}
                            </span>
                            {error.requestPath && (
                              <span>
                                {error.requestMethod} {error.requestPath}
                              </span>
                            )}
                            {error.ipAddress && (
                              <span>IP: {error.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Detail Dialog */}
        <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedError && getErrorTypeIcon(selectedError.errorType)}
                Error Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about this error occurrence
              </DialogDescription>
            </DialogHeader>

            {selectedError && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Error Type</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedError.errorType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <div className="mt-1">
                      <Badge className={severityColors[selectedError.severity as keyof typeof severityColors]}>
                        {selectedError.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Occurred</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedError.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      {selectedError.resolved ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          RESOLVED
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          UNRESOLVED
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Error Message</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedError.message}
                  </p>
                </div>

                {selectedError.stackTrace && (
                  <div>
                    <label className="text-sm font-medium">Stack Trace</label>
                    <pre className="text-xs mt-1 p-3 bg-muted rounded-lg overflow-x-auto">
                      {selectedError.stackTrace}
                    </pre>
                  </div>
                )}

                {selectedError.requestPath && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Request Path</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedError.requestMethod} {selectedError.requestPath}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">IP Address</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedError.ipAddress || "Unknown"}
                      </p>
                    </div>
                  </div>
                )}

                {parseAdditionalData(selectedError.additionalData) && (
                  <div>
                    <label className="text-sm font-medium">Additional Data</label>
                    <pre className="text-xs mt-1 p-3 bg-muted rounded-lg overflow-x-auto">
                      {JSON.stringify(parseAdditionalData(selectedError.additionalData), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedError.resolved && selectedError.resolutionNotes && (
                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <p className="text-sm mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                      {selectedError.resolutionNotes}
                    </p>
                  </div>
                )}

                {!selectedError.resolved && (
                  <div>
                    <label className="text-sm font-medium">Resolution Notes</label>
                    <Textarea
                      placeholder="Describe how this error was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedError(null)}>
                Close
              </Button>
              {selectedError && !selectedError.resolved && (
                <Button
                  onClick={handleResolveError}
                  disabled={resolveErrorMutation.isPending || !resolutionNotes.trim()}
                >
                  {resolveErrorMutation.isPending ? "Resolving..." : "Mark as Resolved"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}