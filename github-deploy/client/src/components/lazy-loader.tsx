import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/loading-skeleton';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyLoader({ children, fallback }: LazyLoaderProps) {
  return (
    <Suspense fallback={fallback || <PageSkeleton />}>
      {children}
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton variant="rectangular" height={200} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <Skeleton variant="rectangular" height={120} />
            <Skeleton lines={2} />
            <div className="flex justify-between">
              <Skeleton width={80} />
              <Skeleton width={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Factory function for creating optimized lazy components
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrappedComponent(props: React.ComponentProps<T>) {
    return (
      <LazyLoader fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoader>
    );
  };
}

// Pre-configured lazy components for common use cases
export const LazyDashboard = createLazyComponent(() => import('@/pages/dashboard-page'));
export const LazyFeedback = createLazyComponent(() => import('@/pages/feedback-page'));
export const LazyUpload = createLazyComponent(() => import('@/pages/upload-page'));
export const LazyProfile = createLazyComponent(() => import('@/pages/profile-page'));