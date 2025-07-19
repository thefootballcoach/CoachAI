/**
 * Optimized chart components with lazy loading and tree shaking
 * These components reduce initial bundle size by loading charts only when needed
 */

import { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Chart loading skeleton
const ChartSkeleton = () => (
  <div className="w-full h-[300px] border rounded-lg p-4">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="grid grid-cols-7 gap-2 h-48">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex flex-col justify-end">
          <Skeleton className={`w-full mb-1`} style={{ height: `${Math.random() * 150 + 50}px` }} />
        </div>
      ))}
    </div>
    <div className="flex justify-center mt-4 space-x-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

// Optimize Recharts imports to reduce bundle size
const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, dataKey, color = "#8884d8", ...props }: any) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, dataKey, color = "#8884d8", ...props }: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyPieChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, dataKey, nameKey = "name", ...props }: any) => {
      const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } = module;
      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
      
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart {...props}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data?.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  }))
);

const LazyAreaChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, dataKey, color = "#8884d8", ...props }: any) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = module;
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} {...props}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Progress chart with circular design
const LazyProgressChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ value, maxValue = 100, color = "#8884d8", label, size = 120 }: any) => {
      const { PieChart, Pie, Cell, ResponsiveContainer } = module;
      
      const percentage = (value / maxValue) * 100;
      const data = [
        { name: 'progress', value: percentage },
        { name: 'remaining', value: 100 - percentage }
      ];
      
      return (
        <div className="relative">
          <ResponsiveContainer width={size} height={size}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={size * 0.3}
                outerRadius={size * 0.4}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                <Cell fill={color} />
                <Cell fill="#f3f4f6" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
              {label && <div className="text-xs text-muted-foreground">{label}</div>}
            </div>
          </div>
        </div>
      );
    }
  }))
);

// Wrapper components with Suspense
export const OptimizedLineChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const OptimizedBarChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const OptimizedPieChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyPieChart {...props} />
  </Suspense>
);

export const OptimizedAreaChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyAreaChart {...props} />
  </Suspense>
);

export const OptimizedProgressChart = (props: any) => (
  <Suspense fallback={<div className="w-[120px] h-[120px]"><Skeleton className="w-full h-full rounded-full" /></div>}>
    <LazyProgressChart {...props} />
  </Suspense>
);

// Chart factory for dynamic chart types
export const createOptimizedChart = (type: 'line' | 'bar' | 'pie' | 'area' | 'progress') => {
  const chartMap = {
    line: OptimizedLineChart,
    bar: OptimizedBarChart,
    pie: OptimizedPieChart,
    area: OptimizedAreaChart,
    progress: OptimizedProgressChart,
  };
  
  return chartMap[type];
};

// Preloader utility for charts
export const preloadCharts = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      import('recharts').catch(() => {});
    }, 2000); // Preload after 2 seconds
  }
};