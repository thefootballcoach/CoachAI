import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Brain, BookOpen, TrendingUp, Target, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MultiAIAnalysis {
  openaiAnalysis: any;
  claudeAnalysis: any;
  perplexityAnalysis: any;
  synthesizedInsights: {
    overallScore: number;
    keyStrengths: string[];
    priorityDevelopmentAreas: string[];
    researchBackedRecommendations: string[];
    pedagogicalInsights: string[];
    professionalBenchmarking: string;
  };
  comprehensiveReport: {
    executiveSummary: string;
    detailedAnalysis: {
      communicationExcellence: AnalysisSection;
      technicalInstruction: AnalysisSection;
      playerEngagement: AnalysisSection;
      sessionManagement: AnalysisSection;
    };
    professionalDevelopmentPlan: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      researchResources: string[];
    };
    benchmarkComparison: {
      industryStandards: string;
      professionalGrade: string;
      improvementPotential: string;
    };
  };
}

interface AnalysisSection {
  strengths: string[];
  developmentAreas: string[];
  claudeInsights: string[];
  researchEvidence: string[];
  practicalRecommendations: string[];
}

export default function MultiAIAnalysis() {
  const [, params] = useRoute("/analysis/:id");
  const videoId = params?.id;

  const { data: video } = useQuery({
    queryKey: [`/api/audios/${videoId}`],
    enabled: !!videoId,
  });

  const { data: feedback } = useQuery({
    queryKey: [`/api/audios/${videoId}/feedback`],
    enabled: !!videoId,
  });

  const multiAI = feedback?.multiAiAnalysis as MultiAIAnalysis;

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/audios/${videoId}/report/pdf`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `coaching-report-${video?.title || 'session'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!multiAI) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">All Analysis is Now Multi-AI</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
            <p className="text-lg font-semibold mb-2">Every coaching session analysis automatically includes insights from OpenAI, Claude, and Perplexity.</p>
            <p className="text-sm text-muted-foreground mt-2">
              View your comprehensive multi-AI feedback in the main feedback page - all analysis is now enhanced with multiple AI sources by default.
            </p>
            <Button onClick={() => window.location.href = `/feedback/${videoId}`} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              View Multi-AI Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Multi-AI Analysis Report</h1>
          <p className="text-muted-foreground mt-1">{video?.title}</p>
        </div>
        <Button onClick={downloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF Report
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">
            {multiAI.comprehensiveReport?.executiveSummary || "Comprehensive multi-AI analysis completed."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">Overall Score: {multiAI.synthesizedInsights.overallScore}/100</Badge>
            <Badge variant="outline">{multiAI.comprehensiveReport?.benchmarkComparison?.professionalGrade}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="detailed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="development">Development Plan</TabsTrigger>
          <TabsTrigger value="sources">AI Sources</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmarking</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed" className="space-y-6">
          {/* Communication Excellence */}
          <AnalysisSectionCard
            title="Communication Excellence"
            icon={<Zap className="h-5 w-5 text-green-600" />}
            data={multiAI.comprehensiveReport?.detailedAnalysis?.communicationExcellence}
          />

          {/* Technical Instruction */}
          <AnalysisSectionCard
            title="Technical Instruction"
            icon={<Target className="h-5 w-5 text-blue-600" />}
            data={multiAI.comprehensiveReport?.detailedAnalysis?.technicalInstruction}
          />

          {/* Player Engagement */}
          <AnalysisSectionCard
            title="Player Engagement"
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            data={multiAI.comprehensiveReport?.detailedAnalysis?.playerEngagement}
          />

          {/* Session Management */}
          <AnalysisSectionCard
            title="Session Management"
            icon={<BookOpen className="h-5 w-5 text-orange-600" />}
            data={multiAI.comprehensiveReport?.detailedAnalysis?.sessionManagement}
          />
        </TabsContent>

        <TabsContent value="development">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Immediate Actions</CardTitle>
                <p className="text-sm text-muted-foreground">Next 2 weeks</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {multiAI.comprehensiveReport?.professionalDevelopmentPlan?.immediate?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Short-term Goals</CardTitle>
                <p className="text-sm text-muted-foreground">Next 3 months</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {multiAI.comprehensiveReport?.professionalDevelopmentPlan?.shortTerm?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Long-term Development</CardTitle>
                <p className="text-sm text-muted-foreground">Next 12 months</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {multiAI.comprehensiveReport?.professionalDevelopmentPlan?.longTerm?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Research Resources</CardTitle>
                <p className="text-sm text-muted-foreground">Academic references</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {multiAI.comprehensiveReport?.professionalDevelopmentPlan?.researchResources?.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  OpenAI GPT-4
                </CardTitle>
                <p className="text-sm text-muted-foreground">Technical Analysis</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  Comprehensive coaching assessment with detailed scoring and specific feedback.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline">Overall Score: {multiAI.openaiAnalysis?.overallScore || 0}/100</Badge>
                  {multiAI.openaiAnalysis?.keyStrengths && (
                    <p className="text-xs text-muted-foreground">
                      Key Strengths: {multiAI.openaiAnalysis.keyStrengths.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Anthropic Claude
                </CardTitle>
                <p className="text-sm text-muted-foreground">Pedagogical Insights</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  Educational theory and teaching methodology analysis for coaching effectiveness.
                </p>
                <div className="space-y-2">
                  {multiAI.claudeAnalysis?.coachingPhilosophy?.identifiedPhilosophy && (
                    <Badge variant="outline">{multiAI.claudeAnalysis.coachingPhilosophy.identifiedPhilosophy}</Badge>
                  )}
                  {multiAI.claudeAnalysis?.teachingMethodology?.pedagogicalApproach && (
                    <p className="text-xs text-muted-foreground">
                      Approach: {multiAI.claudeAnalysis.teachingMethodology.pedagogicalApproach.slice(0, 1)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Perplexity Research
                </CardTitle>
                <p className="text-sm text-muted-foreground">Evidence-Based Recommendations</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  Current research trends and professional standards in sports coaching.
                </p>
                <div className="space-y-2">
                  {multiAI.perplexityAnalysis?.comparativeAnalysis?.benchmarkingScore && (
                    <Badge variant="outline">
                      Benchmark: {multiAI.perplexityAnalysis.comparativeAnalysis.benchmarkingScore}/100
                    </Badge>
                  )}
                  {multiAI.perplexityAnalysis?.currentBestPractices?.methodologies && (
                    <p className="text-xs text-muted-foreground">
                      Methods: {multiAI.perplexityAnalysis.currentBestPractices.methodologies.slice(0, 1).join(', ')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="benchmark">
          <Card>
            <CardHeader>
              <CardTitle>Professional Benchmarking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Industry Standards</h4>
                <p className="text-sm text-muted-foreground">
                  {multiAI.comprehensiveReport?.benchmarkComparison?.industryStandards}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Professional Grade</h4>
                <Badge variant="secondary" className="mr-2">
                  {multiAI.comprehensiveReport?.benchmarkComparison?.professionalGrade}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Improvement Potential</h4>
                <p className="text-sm text-muted-foreground">
                  {multiAI.comprehensiveReport?.benchmarkComparison?.improvementPotential}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalysisSectionCard({ title, icon, data }: { 
  title: string; 
  icon: React.ReactNode; 
  data?: AnalysisSection;
}) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {data.strengths?.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-red-700 mb-2">Development Areas</h4>
            <ul className="space-y-1">
              {data.developmentAreas?.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-purple-700 mb-2">Pedagogical Insights</h4>
            <ul className="space-y-1">
              {data.claudeInsights?.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-700 mb-2">Research Evidence</h4>
            <ul className="space-y-1">
              {data.researchEvidence?.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-semibold text-orange-700 mb-2">Practical Recommendations</h4>
          <ul className="space-y-1">
            {data.practicalRecommendations?.map((item, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}