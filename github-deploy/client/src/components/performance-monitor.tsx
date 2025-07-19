import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  connectionType: string;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Monitor performance metrics
    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      const connection = (navigator as any).connection;

      setMetrics({
        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
        memoryUsage: memory ? memory.usedJSHeapSize : 0,
        connectionType: connection ? connection.effectiveType : 'unknown'
      });
    };

    // Update metrics on load
    if (document.readyState === 'complete') {
      updateMetrics();
    } else {
      window.addEventListener('load', updateMetrics);
    }

    // Reduced frequency to prevent Chrome flickering
    const interval = setInterval(updateMetrics, 120000); // Every 2 minutes

    return () => {
      window.removeEventListener('load', updateMetrics);
      clearInterval(interval);
    };
  }, []);

  return metrics;
}

// Preload critical resources
export function preloadCriticalResources() {
  useEffect(() => {
    const criticalAPIs = [
      '/api/user',
      '/api/videos',
      '/api/feedback'
    ];

    criticalAPIs.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }, []);
}

// Memory cleanup utility - reduced frequency to prevent Chrome flickering
export function useMemoryCleanup() {
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Force garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }, 300000); // Every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);
}