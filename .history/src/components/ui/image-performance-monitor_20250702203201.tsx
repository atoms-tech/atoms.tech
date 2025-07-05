'use client';

import { useEffect, useState, useRef } from 'react';
import type { ImagePerformanceMetrics } from '@/lib/utils/imageOptimization';

interface ImagePerformanceMonitorProps {
    enabled?: boolean;
    sampleRate?: number; // Percentage of images to monitor (0-100)
    onMetrics?: (metrics: ImagePerformanceMetrics & { url: string }) => void;
}

interface PerformanceData {
    url: string;
    metrics: ImagePerformanceMetrics;
    timestamp: number;
}

/**
 * Performance monitoring component for image loading
 * Tracks loading times, formats, and cache hits across the application
 */
export function ImagePerformanceMonitor({
    enabled = process.env.NODE_ENV === 'development',
    sampleRate = 100,
    onMetrics,
}: ImagePerformanceMonitorProps) {
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const observerRef = useRef<PerformanceObserver | null>(null);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Set up PerformanceObserver to track resource loading
        if ('PerformanceObserver' in window) {
            observerRef.current = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach((entry) => {
                    // Only monitor image resources
                    if (entry.initiatorType === 'img' || entry.initiatorType === 'image') {
                        // Sample based on rate
                        if (Math.random() * 100 > sampleRate) return;
                        
                        const resourceEntry = entry as PerformanceResourceTiming;
                        const metrics: ImagePerformanceMetrics = {
                            loadTime: resourceEntry.duration,
                            format: getFormatFromUrl(resourceEntry.name),
                            size: resourceEntry.transferSize || 0,
                            fromCache: resourceEntry.transferSize === 0,
                        };

                        const data: PerformanceData = {
                            url: resourceEntry.name,
                            metrics,
                            timestamp: Date.now(),
                        };

                        setPerformanceData(prev => {
                            // Keep only last 100 entries to avoid memory issues
                            const updated = [...prev, data].slice(-100);
                            return updated;
                        });

                        onMetrics?.({ ...metrics, url: resourceEntry.name });
                    }
                });
            });

            observerRef.current.observe({ entryTypes: ['resource'] });
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [enabled, sampleRate, onMetrics]);

    // Helper function to determine image format from URL
    const getFormatFromUrl = (url: string): string => {
        const urlObj = new URL(url, window.location.origin);
        const pathname = urlObj.pathname.toLowerCase();
        
        if (pathname.includes('.avif')) return 'avif';
        if (pathname.includes('.webp')) return 'webp';
        if (pathname.includes('.png')) return 'png';
        if (pathname.includes('.jpg') || pathname.includes('.jpeg')) return 'jpeg';
        if (pathname.includes('.gif')) return 'gif';
        
        // Check Next.js image optimization parameters
        const format = urlObj.searchParams.get('f');
        if (format) return format;
        
        return 'unknown';
    };

    // Performance analytics
    const analytics = {
        totalImages: performanceData.length,
        averageLoadTime: performanceData.reduce((sum, item) => sum + item.metrics.loadTime, 0) / performanceData.length || 0,
        cacheHitRate: (performanceData.filter(item => item.metrics.fromCache).length / performanceData.length) * 100 || 0,
        formatDistribution: performanceData.reduce((acc, item) => {
            acc[item.metrics.format] = (acc[item.metrics.format] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        slowImages: performanceData.filter(item => item.metrics.loadTime > 1000), // Images taking more than 1s
    };

    // Only render in development
    if (!enabled || process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm max-w-sm z-50">
            <div className="font-bold mb-2">Image Performance Monitor</div>
            
            <div className="space-y-1">
                <div>Images Loaded: {analytics.totalImages}</div>
                <div>Avg Load Time: {analytics.averageLoadTime.toFixed(0)}ms</div>
                <div>Cache Hit Rate: {analytics.cacheHitRate.toFixed(1)}%</div>
                
                {analytics.slowImages.length > 0 && (
                    <div className="text-yellow-400">
                        Slow Images: {analytics.slowImages.length}
                    </div>
                )}
                
                <div className="mt-2">
                    <div className="font-semibold">Formats:</div>
                    {Object.entries(analytics.formatDistribution).map(([format, count]) => (
                        <div key={format} className="text-xs">
                            {format}: {count}
                        </div>
                    ))}
                </div>
                
                {analytics.slowImages.length > 0 && (
                    <details className="mt-2">
                        <summary className="cursor-pointer text-yellow-400">
                            Slow Images ({analytics.slowImages.length})
                        </summary>
                        <div className="mt-1 max-h-32 overflow-y-auto">
                            {analytics.slowImages.map((item, index) => (
                                <div key={index} className="text-xs text-gray-300 truncate">
                                    {item.metrics.loadTime.toFixed(0)}ms - {item.url.split('/').pop()}
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}

// Hook for accessing performance data
export function useImagePerformance() {
    const [metrics, setMetrics] = useState<(ImagePerformanceMetrics & { url: string })[]>([]);

    const addMetric = (metric: ImagePerformanceMetrics & { url: string }) => {
        setMetrics(prev => [...prev.slice(-49), metric]); // Keep last 50 metrics
    };

    return {
        metrics,
        addMetric,
        averageLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length || 0,
        cacheHitRate: (metrics.filter(m => m.fromCache).length / metrics.length) * 100 || 0,
    };
}