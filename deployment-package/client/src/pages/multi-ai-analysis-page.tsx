import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BookOpen, Search, Eye, TrendingUp, Award, Target, Lightbulb } from 'lucide-react';

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
}

export default function MultiAIAnalysisPage() {
  const [, params] = useRoute('/feedback/:id/multi-ai');
  const feedbackId = params?.id;

  const { data: multiAIData, isLoading } = useQuery({
    queryKey: ['/api/feedback', feedbackId, 'multi-ai'],
    enabled: !!feedbackId,
  }) as { data: MultiAIAnalysis | undefined, isLoading: boolean };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-lg">Loading comprehensive AI analysis...</p>
        </div>
      </div>
    );
  }

  if (!multiAIData) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg">Multi-AI analysis not available for this session.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { synthesizedInsights, openaiAnalysis, claudeAnalysis, perplexityAnalysis } = multiAIData;

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Multi-AI Coaching Analysis
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive insights from OpenAI GPT-4, Anthropic Claude, and Perplexity research
        </p>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Award className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold">{synthesizedInsights.overallScore}/100</span>
            </div>
            <Progress value={synthesizedInsights.overallScore} className="w-full max-w-md mx-auto h-3" />
            <p className="text-sm text-muted-foreground">Synthesized Multi-AI Score</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Sources Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <span>OpenAI GPT-4</span>
            </CardTitle>
            <CardDescription>Comprehensive coaching analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={openaiAnalysis ? "default" : "secondary"}>
              {openaiAnalysis ? "Analysis Complete" : "Unavailable"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span>Claude (Anthropic)</span>
            </CardTitle>
            <CardDescription>Pedagogical insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={claudeAnalysis ? "default" : "secondary"}>
              {claudeAnalysis ? "Analysis Complete" : "Unavailable"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Perplexity</span>
            </CardTitle>
            <CardDescription>Research-backed recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={perplexityAnalysis ? "default" : "secondary"}>
              {perplexityAnalysis ? "Analysis Complete" : "Unavailable"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Content */}
      <Tabs defaultValue="synthesized" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="synthesized" className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4" />
            <span>Synthesized</span>
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center space-x-1">
            <Brain className="h-4 w-4" />
            <span>OpenAI</span>
          </TabsTrigger>
          <TabsTrigger value="claude" className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>Claude</span>
          </TabsTrigger>
          <TabsTrigger value="perplexity" className="flex items-center space-x-1">
            <Search className="h-4 w-4" />
            <span>Perplexity</span>
          </TabsTrigger>
          <TabsTrigger value="vision" className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>Vision</span>
          </TabsTrigger>
        </TabsList>

        {/* Synthesized Insights */}
        <TabsContent value="synthesized" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span>Key Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesizedInsights.keyStrengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span>Priority Development Areas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesizedInsights.priorityDevelopmentAreas.map((area, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Research-Backed Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesizedInsights.researchBackedRecommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <span>Pedagogical Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {synthesizedInsights.pedagogicalInsights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Professional Benchmarking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {synthesizedInsights.professionalBenchmarking}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OpenAI Analysis */}
        <TabsContent value="openai">
          {openaiAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle>OpenAI GPT-4 Analysis</CardTitle>
                <CardDescription>Comprehensive coaching assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openaiAnalysis.overallScore && (
                    <div>
                      <h3 className="font-semibold mb-2">Overall Score</h3>
                      <Progress value={openaiAnalysis.overallScore} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground mt-1">{openaiAnalysis.overallScore}/100</p>
                    </div>
                  )}
                  {openaiAnalysis.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{openaiAnalysis.summary}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">OpenAI analysis not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Claude Analysis */}
        <TabsContent value="claude">
          {claudeAnalysis ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Methodology</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Approach</h4>
                      <p className="text-sm text-muted-foreground">{claudeAnalysis.teachingMethodology?.approach}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Effectiveness</h4>
                      <Progress value={claudeAnalysis.teachingMethodology?.effectiveness || 0} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground mt-1">{claudeAnalysis.teachingMethodology?.effectiveness}/100</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Theoretical Framework</h4>
                      <p className="text-sm text-muted-foreground">{claudeAnalysis.teachingMethodology?.theoreticalFramework}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coaching Philosophy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Identified Philosophy</h4>
                      <p className="text-sm text-muted-foreground">{claudeAnalysis.coachingPhilosophy?.identifiedPhilosophy}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Leadership Style</h4>
                      <p className="text-sm text-muted-foreground">{claudeAnalysis.coachingPhilosophy?.leadershipStyle}</p>
                    </div>
                    {claudeAnalysis.coachingPhilosophy?.valuesDemonstrated && (
                      <div>
                        <h4 className="font-medium">Values Demonstrated</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {claudeAnalysis.coachingPhilosophy.valuesDemonstrated.map((value: string, index: number) => (
                            <li key={index}>• {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Claude analysis not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Perplexity Analysis */}
        <TabsContent value="perplexity">
          {perplexityAnalysis ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {perplexityAnalysis.currentBestPractices?.methodologies && (
                      <div>
                        <h4 className="font-medium">Methodologies</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {perplexityAnalysis.currentBestPractices.methodologies.map((method: string, index: number) => (
                            <li key={index}>• {method}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {perplexityAnalysis.currentBestPractices?.citations && (
                      <div>
                        <h4 className="font-medium">Research Citations</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {perplexityAnalysis.currentBestPractices.citations.map((citation: string, index: number) => (
                            <li key={index}>• <a href={citation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{citation}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparative Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Professional Standards</h4>
                      <p className="text-sm text-muted-foreground">{perplexityAnalysis.comparativeAnalysis?.professionalStandards}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Benchmarking Score</h4>
                      <Progress value={perplexityAnalysis.comparativeAnalysis?.benchmarkingScore || 0} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground mt-1">{perplexityAnalysis.comparativeAnalysis?.benchmarkingScore}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Perplexity analysis not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Computer Vision Analysis */}
        <TabsContent value="vision">
          {openaiAnalysis?.visualAnalysis ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Analysis Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Frames Analyzed</h4>
                      <p className="text-2xl font-bold text-blue-600">{openaiAnalysis.visualAnalysis.frameAnalysis?.totalFramesAnalyzed || 0}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Overall Assessment</h4>
                      <Progress value={openaiAnalysis.visualAnalysis.bodyLanguage?.overallAssessment || 0} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground mt-1">{openaiAnalysis.visualAnalysis.bodyLanguage?.overallAssessment || 0}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visual Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {openaiAnalysis.visualAnalysis.recommendations?.visualImprovements && (
                      <div>
                        <h4 className="font-medium">Visual Improvements</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {openaiAnalysis.visualAnalysis.recommendations.visualImprovements.map((improvement: string, index: number) => (
                            <li key={index}>• {improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Computer vision analysis not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}