import { useEffect, useState } from "react";
import { Progress } from "@shared/schema";
import { BarChart2 } from "lucide-react";
import { Suspense, lazy } from "react";

// Lazy load chart components to reduce initial bundle size
const Area = lazy(() => import("recharts").then(module => ({ default: module.Area })));
const AreaChart = lazy(() => import("recharts").then(module => ({ default: module.AreaChart })));
const CartesianGrid = lazy(() => import("recharts").then(module => ({ default: module.CartesianGrid })));
const Legend = lazy(() => import("recharts").then(module => ({ default: module.Legend })));
const ResponsiveContainer = lazy(() => import("recharts").then(module => ({ default: module.ResponsiveContainer })));
const Tooltip = lazy(() => import("recharts").then(module => ({ default: module.Tooltip })));
const XAxis = lazy(() => import("recharts").then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import("recharts").then(module => ({ default: module.YAxis })));

// Loading component for charts
const ChartSkeleton = () => (
  <div className="h-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg"></div>
);

interface ProgressChartProps {
  progress?: Progress;
  isLoading: boolean;
}

export default function ProgressChart({ progress, isLoading }: ProgressChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Only display chart when we have authentic progress data
    if (!progress || isLoading || !progress.sessionsCount || progress.sessionsCount === 0) {
      setChartData([]);
      return;
    }

    // Create comprehensive chart data from authentic progress scores
    const data = [{
      name: "Current Progress",
      communication: progress.communicationScoreAvg || 0,
      engagement: progress.engagementScoreAvg || 0,
      instruction: progress.instructionScoreAvg || 0,
      overall: progress.overallScoreAvg || 0,
      // Additional metrics for enhanced analysis
      visualAnalysisCapable: true,
    }];
    
    setChartData(data);
  }, [progress, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <BarChart2 className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Progress Data Available</p>
        <p className="text-sm text-slate-400">Upload and analyze sessions to see your coaching progress</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <Suspense fallback={<ChartSkeleton />}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis 
              domain={[0, 100]} 
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "white", 
                borderColor: "#e2e8f0",
                borderRadius: "0.375rem",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              wrapperStyle={{
                paddingTop: "8px",
                fontSize: "12px"
              }}
            />
            <Area
              type="monotone"
              dataKey="overall"
              name="Overall Score"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1) / 0.2)"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="communication"
              name="Communication"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2) / 0.2)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="engagement"
              name="Engagement"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3) / 0.2)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="instruction"
              name="Instruction"
              stroke="hsl(var(--chart-4))"
              fill="hsl(var(--chart-4) / 0.2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Suspense>
    </div>
  );
}
