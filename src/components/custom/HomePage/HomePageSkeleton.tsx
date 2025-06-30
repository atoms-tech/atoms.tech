import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function HomePageSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-96 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Recent Activity Skeleton */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Project Selection Skeleton */}
                <div className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-10 w-64 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Onboarding Widget Skeleton */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="h-6 w-28 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-2 w-full bg-muted animate-pulse rounded" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
