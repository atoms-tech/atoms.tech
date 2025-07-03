import dynamic from 'next/dynamic';

import { HomePageSkeleton } from './HomePageSkeleton';

// Lazy load heavy components for better initial bundle size
export const LazyRecentActivityWidget = dynamic(
    () =>
        import('./RecentActivityWidget').then((mod) => ({
            default: mod.RecentActivityWidget,
        })),
    {
        loading: () => (
            <div className="h-64 animate-pulse bg-muted rounded-lg" />
        ),
        ssr: false, // This component can be client-side only for better performance
    },
);

export const LazyProjectSelectionGrid = dynamic(
    () =>
        import('./ProjectSelectionGrid').then((mod) => ({
            default: mod.ProjectSelectionGrid,
        })),
    {
        loading: () => (
            <div className="space-y-4">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-48 bg-muted animate-pulse rounded-lg"
                        />
                    ))}
                </div>
            </div>
        ),
        ssr: true, // Keep SSR for SEO and initial content
    },
);

export const LazyVirtualizedProjectGrid = dynamic(
    () =>
        import('./VirtualizedProjectGrid').then((mod) => ({
            default: mod.VirtualizedProjectGrid,
        })),
    {
        loading: () => (
            <div className="space-y-4">
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
            </div>
        ),
        ssr: false, // Virtual scrolling is client-side only
    },
);

// OnboardingWidget removed - component no longer exists

// Main HomePage component with lazy loading
export const LazyHomePage = dynamic(() => import('./HomePage.client'), {
    loading: () => <HomePageSkeleton />,
    ssr: true, // Keep main component SSR for better SEO
});

// Bundle analyzer helper - removed due to missing package
// export const LazyBundleAnalyzer = dynamic(
//     () => import('@next/bundle-analyzer').then(mod => mod.default),
//     {
//         ssr: false,
//         loading: () => null
//     }
// );

// Performance monitoring component - only loads when needed
export const LazyPerformanceMonitor = dynamic(
    () =>
        import('./PerformanceMonitor').then((mod) => ({
            default: mod.PerformanceMonitor,
        })),
    {
        ssr: false,
        loading: () => null,
    },
);

// Export bundle information for optimization
export const bundleInfo = {
    chunks: [
        'HomePage.client',
        'RecentActivityWidget',
        'ProjectSelectionGrid',
        'VirtualizedProjectGrid',
    ],
    estimatedSizes: {
        'HomePage.client': '~8KB',
        RecentActivityWidget: '~4KB',
        ProjectSelectionGrid: '~6KB',
        VirtualizedProjectGrid: '~12KB',
    },
    loadingStrategy: {
        immediate: ['HomePage.client', 'ProjectSelectionGrid'],
        deferred: ['RecentActivityWidget'],
        conditional: ['VirtualizedProjectGrid'], // Only loads for large datasets
    },
};
