import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'text',
  width,
  height,
  lines = 1,
  ...props 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              "h-4",
              index === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
            )}
            style={{ width: typeof width === 'number' ? `${width}px` : width }}
          />
        ))}
      </div>
    );
  }
  
  const variantClasses = {
    text: "h-4 w-full",
    rectangular: "w-full h-32",
    circular: "w-12 h-12 rounded-full"
  };
  
  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton lines={2} />
      <div className="flex justify-between">
        <Skeleton width={100} />
        <Skeleton width={80} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <Skeleton width={40} />
          <Skeleton className="flex-1" />
          <Skeleton width={100} />
          <Skeleton width={80} />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" />
      <div className="space-y-2">
        <Skeleton width={120} />
        <Skeleton width={80} />
      </div>
    </div>
  );
}