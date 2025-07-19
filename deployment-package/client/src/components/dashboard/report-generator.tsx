import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Download, Calendar, ArrowUpDown, FileText, PieChart, Info } from "lucide-react";
import { Video, Feedback, Progress } from "@shared/schema";
import { downloadCSV, exportFeedbackToCSV, exportToPDF, generatePerformanceSummary } from "@/lib/export-utils";

interface ReportGeneratorProps {
  videos: Video[];
  feedbacks: Feedback[];
  progress?: Progress;
  pdfTargetElementId: string;
}

export default function ReportGenerator({ 
  videos, 
  feedbacks, 
  progress, 
  pdfTargetElementId 
}: ReportGeneratorProps) {
  const [exportType, setExportType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [dataFormat, setDataFormat] = useState<string>("csv");
  const [includeOptions, setIncludeOptions] = useState<{
    scores: boolean;
    charts: boolean;
    strengths: boolean;
    improvements: boolean;
    summary: boolean;
    transcript: boolean;
  }>({
    scores: true,
    charts: true,
    strengths: true,
    improvements: true,
    summary: true,
    transcript: false
  });
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleIncludeOptionChange = (option: keyof typeof includeOptions) => {
    setIncludeOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const getFilteredData = () => {
    // Filter by date range
    let filteredFeedbacks = [...feedbacks];
    let filteredVideos = [...videos];
    
    if (dateRange !== "all") {
      const now = new Date();
      let cutoff: Date;
      
      switch (dateRange) {
        case "week":
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "quarter":
          cutoff = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          cutoff = new Date(0); // Beginning of time
      }
      
      filteredFeedbacks = feedbacks.filter(feedback => {
        if (!feedback.createdAt) return false;
        return new Date(feedback.createdAt as Date | string) > cutoff;
      });
      
      filteredVideos = videos.filter(video => {
        if (!video.createdAt) return false;
        return new Date(video.createdAt as Date | string) > cutoff;
      });
    }
    
    // Filter by export type
    if (exportType === "latest") {
      // Sort by date (newest first)
      filteredFeedbacks.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt as Date | string).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt as Date | string).getTime() : 0;
        return dateB - dateA;
      });
      
      // Take only the latest
      if (filteredFeedbacks.length > 0) {
        const latestFeedback = filteredFeedbacks[0];
        filteredFeedbacks = [latestFeedback];
        
        // Include corresponding video
        if (latestFeedback.videoId) {
          filteredVideos = videos.filter(v => v.id === latestFeedback.videoId);
        }
      }
    }
    
    // Return filtered data
    return {
      filteredFeedbacks,
      filteredVideos
    };
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      const { filteredFeedbacks, filteredVideos } = getFilteredData();
      
      if (filteredFeedbacks.length === 0) {
        toast({
          title: "No data available",
          description: "There's no feedback data available for the selected filters.",
          variant: "destructive"
        });
        setGenerating(false);
        return;
      }
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `coaching_report_${dateStr}`;
      
      if (dataFormat === "csv") {
        // Export to CSV
        const csvData = exportFeedbackToCSV(filteredFeedbacks, filteredVideos);
        downloadCSV(csvData, `${filename}.csv`);
        
        toast({
          title: "CSV Export Complete",
          description: "Your coaching data has been exported to CSV successfully.",
        });
      } else {
        // Export to PDF
        await exportToPDF(pdfTargetElementId, `${filename}.pdf`, "CoachAI Performance Report");
        
        toast({
          title: "PDF Export Complete",
          description: "Your coaching report has been exported to PDF successfully.",
        });
      }
    } catch (error) {
      // Error generating report
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the report",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
        <CardDescription>
          Export your coaching data and analysis in different formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export-options" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export-options">Export Options</TabsTrigger>
            <TabsTrigger value="data-selection">Data Selection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export-options" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="data-format">Export Format</Label>
              <RadioGroup 
                id="data-format" 
                value={dataFormat} 
                onValueChange={setDataFormat}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="data-format-csv" />
                  <Label htmlFor="data-format-csv" className="flex items-center cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV (Raw data for spreadsheets)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="data-format-pdf" />
                  <Label htmlFor="data-format-pdf" className="flex items-center cursor-pointer">
                    <PieChart className="h-4 w-4 mr-2" />
                    PDF (Visual report with charts)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {dataFormat === "pdf" && (
              <div className="space-y-2 pt-2">
                <Label>Include in PDF Report</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-scores" 
                      checked={includeOptions.scores}
                      onCheckedChange={() => handleIncludeOptionChange('scores')}
                    />
                    <label
                      htmlFor="include-scores"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Performance Scores
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-charts" 
                      checked={includeOptions.charts}
                      onCheckedChange={() => handleIncludeOptionChange('charts')}
                    />
                    <label
                      htmlFor="include-charts"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Performance Charts
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-strengths" 
                      checked={includeOptions.strengths}
                      onCheckedChange={() => handleIncludeOptionChange('strengths')}
                    />
                    <label
                      htmlFor="include-strengths"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Key Strengths
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-improvements" 
                      checked={includeOptions.improvements}
                      onCheckedChange={() => handleIncludeOptionChange('improvements')}
                    />
                    <label
                      htmlFor="include-improvements"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Areas for Improvement
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-summary" 
                      checked={includeOptions.summary}
                      onCheckedChange={() => handleIncludeOptionChange('summary')}
                    />
                    <label
                      htmlFor="include-summary"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Session Summary
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-transcript" 
                      checked={includeOptions.transcript}
                      onCheckedChange={() => handleIncludeOptionChange('transcript')}
                    />
                    <label
                      htmlFor="include-transcript"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Session Transcript
                    </label>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="data-selection" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="export-type">Export Data</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Select data to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="latest">Latest Session Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {feedbacks.length} sessions available for export
                </span>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort Options
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sort Options</DialogTitle>
                    <DialogDescription>
                      Choose how to sort your coaching data in the report
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4 space-y-4">
                    <RadioGroup defaultValue="date-desc">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="date-desc" id="sort-date-desc" />
                        <Label htmlFor="sort-date-desc">Newest First</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="date-asc" id="sort-date-asc" />
                        <Label htmlFor="sort-date-asc">Oldest First</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="score-desc" id="sort-score-desc" />
                        <Label htmlFor="sort-score-desc">Highest Score First</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="score-asc" id="sort-score-asc" />
                        <Label htmlFor="sort-score-asc">Lowest Score First</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit">Apply Sorting</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerateReport}
          disabled={generating || feedbacks.length === 0}
          className="w-full"
        >
          {generating ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}