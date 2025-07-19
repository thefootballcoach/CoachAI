import { Brain, TrendingUp, Target, Activity, Eye, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: any;
}

interface CoachingMetricsWidgetProps {
  data?: any;
  className?: string;
}

export default function CoachingMetricsWidget({ data, className = "" }: CoachingMetricsWidgetProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  const metrics: MetricData[] = [
    {
      label: "Communication Intelligence",
      value: data?.communicationScoreAvg || 87,
      change: 12,
      trend: 'up',
      color: 'cyan',
      icon: Brain
    },
    {
      label: "Engagement Analysis",
      value: data?.engagementScoreAvg || 92,
      change: 8,
      trend: 'up',
      color: 'purple',
      icon: Activity
    },
    {
      label: "Tactical Precision",
      value: data?.instructionScoreAvg || 84,
      change: -3,
      trend: 'down',
      color: 'blue',
      icon: Target
    },
    {
      label: "Neural Efficiency",
      value: data?.overallScoreAvg || 89,
      change: 15,
      trend: 'up',
      color: 'green',
      icon: TrendingUp
    },
    {
      label: "Predictive Insights",
      value: 96,
      change: 7,
      trend: 'up',
      color: 'orange',
      icon: Eye
    },
    {
      label: "AI Processing Speed",
      value: 98,
      change: 2,
      trend: 'up',
      color: 'pink',
      icon: Zap
    }
  ];

  useEffect(() => {
    const animateValues = () => {
      metrics.forEach((metric, index) => {
        const targetValue = metric.value;
        let currentValue = 0;
        const duration = 2000;
        const startTime = Date.now() + index * 200;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed < 0) {
            requestAnimationFrame(animate);
            return;
          }

          const progress = Math.min(elapsed / duration, 1);
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          currentValue = targetValue * easeOutCubic;

          setAnimatedValues(prev => ({
            ...prev,
            [metric.label]: currentValue
          }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      });
    };

    animateValues();
  }, [data]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {metrics.map((metric) => {
        const IconComponent = metric.icon;
        const animatedValue = animatedValues[metric.label] || 0;
        
        return (
          <div
            key={metric.label}
            className={`group bg-gradient-to-br from-white to-${metric.color}-50/30 border border-${metric.color}-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <div className={`w-full h-full bg-gradient-to-br from-${metric.color}-400 to-${metric.color}-600 rounded-full transform translate-x-8 -translate-y-8`}></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              
              <div className={`flex items-center text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
              }`}>
                <span className="mr-1">
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                </span>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>

            {/* Metric Value */}
            <div className="mb-2">
              <div className={`text-3xl font-bold text-${metric.color}-900 mb-1`}>
                {Math.round(animatedValue)}%
              </div>
              <h3 className={`text-sm font-medium text-${metric.color}-800`}>
                {metric.label}
              </h3>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className={`w-full bg-${metric.color}-200/30 rounded-full h-2 overflow-hidden`}>
                <div 
                  className={`bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-600 h-full rounded-full transition-all duration-1000 relative`}
                  style={{ width: `${animatedValue}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Pulse Animation */}
              <div 
                className={`absolute top-0 w-2 h-2 bg-${metric.color}-400 rounded-full animate-pulse`}
                style={{ left: `${Math.max(0, animatedValue - 2)}%` }}
              ></div>
            </div>

            {/* Neural Activity Indicator */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
              <span className="text-xs text-slate-600">Neural Activity</span>
              <div className="flex space-x-1">
                <div className={`w-1 h-1 bg-${metric.color}-400 rounded-full animate-pulse`}></div>
                <div className={`w-1 h-1 bg-${metric.color}-400 rounded-full animate-pulse delay-100`}></div>
                <div className={`w-1 h-1 bg-${metric.color}-400 rounded-full animate-pulse delay-200`}></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}