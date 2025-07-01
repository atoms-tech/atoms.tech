'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    bundleSize: number;
    memoryUsage: number;
    networkRequests: number;
    cacheHitRate: number;
}

interface PerformanceMonitorProps {
    enabled?: boolean;
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({ 
    enabled = process.env.NODE_ENV === 'development',
    onMetricsUpdate 
}: PerformanceMonitorProps) {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const measurePerformance = () => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');
            const resources = performance.getEntriesByType('resource');

            // Calculate load time
            const loadTime = navigation.loadEventEnd - navigation.navigationStart;

            // Calculate render time (First Contentful Paint)
            const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
            const renderTime = fcp ? fcp.startTime : 0;

            // Estimate bundle size from resource entries
            const bundleSize = resources
                .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
                .reduce((total, resource) => total + (resource.transferSize || 0), 0);

            // Memory usage (if available)
            const memoryInfo = (performance as any).memory;
            const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;

            // Network requests count
            const networkRequests = resources.length;

            // Cache hit rate estimation
            const cachedResources = resources.filter(resource => resource.transferSize === 0);
            const cacheHitRate = resources.length > 0 ? (cachedResources.length / resources.length) * 100 : 0;

            const newMetrics: PerformanceMetrics = {
                loadTime,
                renderTime,
                bundleSize,
                memoryUsage,
                networkRequests,
                cacheHitRate
            };

            setMetrics(newMetrics);
            onMetricsUpdate?.(newMetrics);

            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.group('🚀 Home Page Performance Metrics');
                console.log('Load Time:', `${loadTime.toFixed(2)}ms`);
                console.log('Render Time (FCP):', `${renderTime.toFixed(2)}ms`);
                console.log('Bundle Size:', `${(bundleSize / 1024).toFixed(2)}KB`);
                console.log('Memory Usage:', `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
                console.log('Network Requests:', networkRequests);
                console.log('Cache Hit Rate:', `${cacheHitRate.toFixed(1)}%`);
                console.groupEnd();
            }
        };

        // Measure after page load
        if (document.readyState === 'complete') {
            measurePerformance();
        } else {
            window.addEventListener('load', measurePerformance);
        }

        // Set up performance observer for ongoing monitoring
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'measure' && entry.name.includes('home-page')) {
                        console.log(`📊 ${entry.name}: ${entry.duration.toFixed(2)}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

            return () => {
                observer.disconnect();
                window.removeEventListener('load', measurePerformance);
            };
        }

        return () => {
            window.removeEventListener('load', measurePerformance);
        };
    }, [enabled, onMetricsUpdate]);

    // Performance markers for specific operations
    const markStart = (operation: string) => {
        if (enabled && typeof window !== 'undefined') {
            performance.mark(`home-page-${operation}-start`);
        }
    };

    const markEnd = (operation: string) => {
        if (enabled && typeof window !== 'undefined') {
            performance.mark(`home-page-${operation}-end`);
            performance.measure(
                `home-page-${operation}`,
                `home-page-${operation}-start`,
                `home-page-${operation}-end`
            );
        }
    };

    // Expose performance utilities
    useEffect(() => {
        if (enabled && typeof window !== 'undefined') {
            (window as any).homePagePerf = {
                markStart,
                markEnd,
                getMetrics: () => metrics,
                clearMarks: () => performance.clearMarks(),
                clearMeasures: () => performance.clearMeasures()
            };
        }
    }, [enabled, metrics]);

    // Don't render anything in production
    if (!enabled || !metrics) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
            <div className="space-y-1">
                <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
                <div>FCP: {metrics.renderTime.toFixed(0)}ms</div>
                <div>Bundle: {(metrics.bundleSize / 1024).toFixed(1)}KB</div>
                <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                <div>Requests: {metrics.networkRequests}</div>
                <div>Cache: {metrics.cacheHitRate.toFixed(0)}%</div>
            </div>
        </div>
    );
}
