import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProjectPageSkeleton() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Tabs Skeleton */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                    {['Overview', 'Documents', 'Members', 'Invitations'].map(
                        (tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                disabled
                            >
                                {tab}
                            </TabsTrigger>
                        ),
                    )}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                            className="flex justify-between"
                                        >
                                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="p-4 border rounded-lg bg-muted animate-pulse"
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </TabsContent>

                <TabsContent value="invitations" className="space-y-6">
                    <div className="text-center py-12 border rounded-lg">
                        <div className="h-12 w-12 mx-auto bg-muted animate-pulse rounded-full" />
                        <div className="h-6 w-48 mx-auto bg-muted animate-pulse rounded mt-4" />
                        <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded mt-2" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
