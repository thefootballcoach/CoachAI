import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Sector
} from "recharts";
import { Progress as ProgressType, Feedback } from "@shared/schema";

interface AnalyticsDashboardProps {
  progress?: ProgressType;
  feedbacks?: Feedback[];
  isLoading: boolean;
}

// Helper function to generate chart data from feedbacks
const generateTimeSeriesData = (feedbacks: Feedback[] = []) => {
  if (!feedbacks.length) return [];
  
  // Sort by date
  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt as Date | string).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt as Date | string).getTime() : 0;
    return dateA - dateB;
  });
  
  return sortedFeedbacks.map((feedback, index) => {
    const date = feedback.createdAt ? new Date(feedback.createdAt as Date | string) : new Date();
    return {
      name: `Session ${index + 1}`,
      date: date.toLocaleDateString(),
      overall: feedback.overallScore,
      communication: feedback.communicationScore,
      engagement: feedback.engagementScore,
      instruction: feedback.instructionScore,
    };
  });
};

// Generate skill distribution data
const generateSkillDistribution = (feedbacks: Feedback[] = []) => {
  if (!feedbacks.length) return [];
  
  // Calculate averages
  let commSum = 0;
  let engSum = 0;
  let instSum = 0;
  let count = 0;
  
  feedbacks.forEach(feedback => {
    if (feedback.communicationScore && feedback.engagementScore && feedback.instructionScore) {
      commSum += feedback.communicationScore;
      engSum += feedback.engagementScore;
      instSum += feedback.instructionScore;
      count++;
    }
  });
  
  if (count === 0) return [];
  
  return [
    { name: "Communication", value: Math.round(commSum / count) },
    { name: "Engagement", value: Math.round(engSum / count) },
    { name: "Instruction", value: Math.round(instSum / count) },
  ];
};

// Generate radar data for coaching skills
const generateCoachingRadarData = (feedbacks: Feedback[] = []) => {
  if (!feedbacks.length) return [];
  
  // Hard-coded coaching skills with initial values - in a real app this would come from actual detailed AI analysis
  return [
    { subject: 'Clarity', latest: 80, average: 65, fullMark: 100 },
    { subject: 'Enthusiasm', latest: 85, average: 75, fullMark: 100 },
    { subject: 'Technical Detail', latest: 70, average: 65, fullMark: 100 },
    { subject: 'Feedback Quality', latest: 75, average: 60, fullMark: 100 },
    { subject: 'Connection', latest: 90, average: 70, fullMark: 100 },
    { subject: 'Organization', latest: 65, average: 60, fullMark: 100 },
  ];
};

// Generate strength areas from feedback
const generateStrengthAreas = (feedbacks: Feedback[] = []) => {
  if (!feedbacks.length) return [];
  
  const latestFeedback = feedbacks[0];
  if (!latestFeedback || !latestFeedback.strengths) return [];
  
  try {
    const strengths = typeof latestFeedback.strengths === 'string' 
      ? JSON.parse(latestFeedback.strengths as string) 
      : latestFeedback.strengths;
      
    return strengths.map((strength: string) => ({ name: strength }));
  } catch (error) {
    // Error parsing strengths
    return [];
  }
};

// Generate improvement areas from feedback
const generateImprovementAreas = (feedbacks: Feedback[] = []) => {
  if (!feedbacks.length) return [];
  
  const latestFeedback = feedbacks[0];
  if (!latestFeedback || !latestFeedback.improvements) return [];
  
  try {
    const improvements = typeof latestFeedback.improvements === 'string' 
      ? JSON.parse(latestFeedback.improvements as string) 
      : latestFeedback.improvements;
      
    return improvements.map((improvement: string) => ({ name: improvement }));
  } catch (error) {
    // Error parsing improvements
    return [];
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Custom active shape for pie chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value 
  } = props;
  
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value}%`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default function AnalyticsDashboard({ progress, feedbacks = [], isLoading }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<string>("all");
  const [activeSkillIndex, setActiveSkillIndex] = useState<number>(0);
  
  // Filter feedbacks based on selected time range
  const filteredFeedbacks = (): Feedback[] => {
    if (timeRange === "all" || !feedbacks.length) return feedbacks;
    
    const now = new Date();
    let cutoff: Date;
    
    switch (timeRange) {
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
        return feedbacks;
    }
    
    return feedbacks.filter(feedback => {
      if (!feedback.createdAt) return false;
      return new Date(feedback.createdAt as Date | string) > cutoff;
    });
  };

  // Generate data for charts
  const timeSeriesData = generateTimeSeriesData(filteredFeedbacks());
  const skillDistribution = generateSkillDistribution(filteredFeedbacks());
  const coachingRadarData = generateCoachingRadarData(filteredFeedbacks());
  const strengthAreas = generateStrengthAreas(filteredFeedbacks());
  const improvementAreas = generateImprovementAreas(filteredFeedbacks());
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-dashboard">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coaching Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-3xl font-bold">{progress?.overallScoreAvg ? Math.round(progress.overallScoreAvg) : '--'}</div>
            <Progress value={progress?.overallScoreAvg || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Communication</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-3xl font-bold">{progress?.communicationScoreAvg ? Math.round(progress.communicationScoreAvg) : '--'}</div>
            <Progress value={progress?.communicationScoreAvg || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-3xl font-bold">{progress?.engagementScoreAvg ? Math.round(progress.engagementScoreAvg) : '--'}</div>
            <Progress value={progress?.engagementScoreAvg || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Instruction</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-3xl font-bold">{progress?.instructionScoreAvg ? Math.round(progress.instructionScoreAvg) : '--'}</div>
            <Progress value={progress?.instructionScoreAvg || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="performance">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="skills">Skill Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Performance Over Time</CardTitle>
              <CardDescription>
                Track how your coaching scores have changed across sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        tickMargin={20}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="overall" 
                        name="Overall Score"
                        stroke="#8884d8"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="communication" 
                        name="Communication"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        name="Engagement"
                        stroke="#ffc658"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="instruction" 
                        name="Instruction"
                        stroke="#ff8042"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Not enough data to display performance trends</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Analysis</CardTitle>
                <CardDescription>
                  Review coaching time distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {timeSeriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={timeSeriesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          tickMargin={20}
                        />
                        <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="overall" name="Overall Score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Not enough data to display session analysis</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skill Distribution</CardTitle>
                <CardDescription>
                  Breakdown of your coaching skill areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {skillDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeSkillIndex}
                          activeShape={renderActiveShape}
                          data={skillDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={(_, index) => setActiveSkillIndex(index)}
                        >
                          {skillDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Not enough data to display skill distribution</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Skills Radar</CardTitle>
              <CardDescription>
                Detailed breakdown of specific coaching competencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {coachingRadarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={150} data={coachingRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Latest Session"
                        dataKey="latest"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Your Average"
                        dataKey="average"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.6}
                      />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Not enough data to display coaching skills radar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Strengths</CardTitle>
                <CardDescription>
                  Areas where your coaching excels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strengthAreas.length > 0 ? (
                  <ul className="space-y-2">
                    {strengthAreas.map((strength: { name: string }, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>{strength.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No strength data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>
                  Opportunities to enhance your coaching
                </CardDescription>
              </CardHeader>
              <CardContent>
                {improvementAreas.length > 0 ? (
                  <ul className="space-y-2">
                    {improvementAreas.map((improvement: { name: string }, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span>{improvement.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No improvement data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Coaching Insights</CardTitle>
              <CardDescription>
                Key observations and recommendations from your sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Communication Style</h3>
                    <p className="text-muted-foreground">
                      Your communication is clear and well-structured. Continue to work on 
                      using varied tone and emphasis to maintain engagement during longer sessions.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Technical Delivery</h3>
                    <p className="text-muted-foreground">
                      Your technical instructions are precise and accurate. Consider adding more 
                      real-world applications and examples to help players understand concepts.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Engagement Tactics</h3>
                    <p className="text-muted-foreground">
                      Your player engagement is strong with good use of questions and interactive elements. 
                      Try incorporating more personalized feedback to individual players during group sessions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    No insights available yet. Upload more coaching sessions to receive AI-powered analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended Focus Areas</CardTitle>
              <CardDescription>
                Personalized coaching development suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Visual Demonstrations</span>
                      <span className="text-sm">High Priority</span>
                    </div>
                    <Progress value={35} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Add more visual demonstrations alongside verbal instructions
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pacing & Timing</span>
                      <span className="text-sm">Medium Priority</span>
                    </div>
                    <Progress value={60} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Improve session pacing to maintain energy throughout
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Player Feedback</span>
                      <span className="text-sm">Low Priority</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Continue your strong approach to individual player feedback
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No recommendations available yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}