import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function OrgDashboardSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Organization Header Skeleton */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-96 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-24 bg-primary/10 animate-pulse rounded-full" />
            </div>

            {/* Tabs Skeleton */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                    {[
                        'Overview',
                        'Projects',
                        'Documents',
                        'Collections',
                        'Tasks',
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            disabled
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Organization Details Card Skeleton */}
                        <Card>
                            <CardHeader>
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between"
                                        >
                                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Storage Usage Card Skeleton */}
                        <Card>
                            <CardHeader>
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="w-full h-2.5 bg-muted animate-pulse rounded-full" />
                                    <div className="flex justify-between">
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Members Card Skeleton */}
                        <Card>
                            <CardHeader>
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                                </div>
                                            </div>
                                            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
