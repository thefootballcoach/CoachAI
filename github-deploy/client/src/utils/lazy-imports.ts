/**
 * Centralized lazy import utilities for optimal code splitting
 * This module provides utilities for dynamic imports with proper loading states
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Loading component cache to avoid recreation
const loadingComponents = new Map<string, React.ComponentType>();

/**
 * Create a cached loading component
 */
function createLoadingComponent(name: string): React.ComponentType {
  if (!loadingComponents.has(name)) {
    const LoadingComponent = () => (
      <div className="flex items-center justify-center min-h-[200px] p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-sm text-muted-foreground">Loading {name}...</p>
        </div>
      </div>
    );
    loadingComponents.set(name, LoadingComponent);
  }
  return loadingComponents.get(name)!;
}

/**
 * Enhanced lazy loading with retry capability
 */
export function createLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): LazyExoticComponent<ComponentType<T>> {
  const LazyComponent = lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn(`Failed to load ${componentName}:`, error);
      
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        return await importFn();
      } catch (retryError) {
        console.error(`Failed to load ${componentName} after retry:`, retryError);
        
        // Return a fallback component
        return {
          default: (() => (
            <div className="flex items-center justify-center min-h-[200px] p-8 border border-red-200 rounded-lg">
              <div className="text-center">
                <p className="text-red-600 mb-2">Failed to load {componentName}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )) as ComponentType<T>
        };
      }
    }
  });

  // Add display name for debugging
  LazyComponent.displayName = `Lazy(${componentName})`;
  
  return LazyComponent;
}

/**
 * Preload a component for better UX
 */
export function preloadComponent(importFn: () => Promise<any>): void {
  // Only preload if we're not in SSR
  if (typeof window !== 'undefined') {
    // Preload on next tick to avoid blocking initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('Preload failed:', error);
      });
    }, 100);
  }
}

/**
 * Conditional lazy loading based on feature flags or conditions
 */
export function createConditionalLazyComponent<T = any>(
  condition: () => boolean,
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallbackComponent: ComponentType<T>,
  componentName: string
): LazyExoticComponent<ComponentType<T>> {
  return lazy(async () => {
    if (condition()) {
      return await importFn();
    } else {
      return { default: fallbackComponent };
    }
  });
}

// Pre-configured lazy components for heavy libraries
export const LazyRecharts = createLazyComponent(
  () => import('recharts').then(module => ({ default: module.ResponsiveContainer })),
  'Recharts'
);

export const LazyDatePicker = createLazyComponent(
  () => import('react-day-picker').then(module => ({ default: module.DayPicker })),
  'DatePicker'
);

export const LazyImageCrop = createLazyComponent(
  () => import('react-easy-crop').then(module => ({ default: module.default })),
  'ImageCrop'
);

// Heavy component categories
export const LazyAnalytics = {
  Charts: createLazyComponent(() => import('@/components/analytics/charts'), 'AnalyticsCharts'),
  Dashboard: createLazyComponent(() => import('@/components/analytics/dashboard'), 'AnalyticsDashboard'),
  Reports: createLazyComponent(() => import('@/components/analytics/reports'), 'AnalyticsReports'),
};

export const LazyMedia = {
  VideoPlayer: createLazyComponent(() => import('@/components/media/video-player'), 'VideoPlayer'),
  AudioPlayer: createLazyComponent(() => import('@/components/media/audio-player'), 'AudioPlayer'),
  FileUpload: createLazyComponent(() => import('@/components/media/file-upload'), 'FileUpload'),
};

export const LazyAdmin = {
  Dashboard: createLazyComponent(() => import('@/components/admin/dashboard'), 'AdminDashboard'),
  UserManagement: createLazyComponent(() => import('@/components/admin/user-management'), 'UserManagement'),
  SystemLogs: createLazyComponent(() => import('@/components/admin/system-logs'), 'SystemLogs'),
};

/**
 * Route-based lazy loading with prefetching
 */
export function createRouteComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  routeName: string,
  prefetchRoutes: string[] = []
): LazyExoticComponent<ComponentType<T>> {
  const LazyRoute = createLazyComponent(importFn, routeName);
  
  // Prefetch related routes when this component loads
  if (prefetchRoutes.length > 0 && typeof window !== 'undefined') {
    // Use intersection observer to prefetch when component is likely to be used
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          prefetchRoutes.forEach(route => {
            // This would need to be connected to your routing system
            console.log(`Prefetching route: ${route}`);
          });
          observer.disconnect();
        }
      });
    });
  }
  
  return LazyRoute;
}

/**
 * Bundle analysis helper
 */
export function getBundleInfo() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    return {
      loadTime: performance.now(),
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
      navigation: performance.getEntriesByType('navigation')[0],
    };
  }
  return null;
}