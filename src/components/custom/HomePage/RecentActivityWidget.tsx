'use client';

import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import {
    FileText,
    FolderOpen,
    ListTodo,
    Clock,
    ExternalLink,
    Activity,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecentActivity, PaginatedRecentActivity } from '@/lib/db/server/home.server';

interface RecentActivityWidgetProps {
    activities: RecentActivity[];
    userId: string;
    totalCount?: number;
    hasMore?: boolean;
}

const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
        case 'project':
            return <FolderOpen className="h-4 w-4" />;
        case 'document':
            return <FileText className="h-4 w-4" />;
        case 'requirement':
            return <ListTodo className="h-4 w-4" />;
        default:
            return <Activity className="h-4 w-4" />;
    }
};

const getActivityDescription = (activity: RecentActivity) => {
    const { action, entity_type, entity_name } = activity;
    
    switch (action) {
        case 'create':
            return `Created ${entity_type} "${entity_name}"`;
        case 'update':
            return `Updated ${entity_type} "${entity_name}"`;
        case 'delete':
            return `Deleted ${entity_type} "${entity_name}"`;
        case 'view':
            return `Viewed ${entity_type} "${entity_name}"`;
        default:
            return `${action} ${entity_type} "${entity_name}"`;
    }
};

const getNavigationPath = (activity: RecentActivity) => {
    const { entity_type, entity_id, project_name, organization_name } = activity;
    
    // This is a simplified navigation - you may need to adjust based on your routing structure
    switch (entity_type) {
        case 'project':
            return `/org/${entity_id}`; // Assuming entity_id is project id
        case 'document':
            return `/org/${entity_id}/document/${entity_id}`; // You'll need org context
        case 'requirement':
            return `/org/${entity_id}/requirement/${entity_id}`; // You'll need org context
        default:
            return null;
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
};

export function RecentActivityWidget({
    activities: initialActivities,
    userId,
    totalCount = 0,
    hasMore: initialHasMore = false
}: RecentActivityWidgetProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<RecentActivity[]>(initialActivities);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>();

    const handleActivityClick = (activity: RecentActivity) => {
        const path = getNavigationPath(activity);
        if (path) {
            router.push(path);
        }
    };

    const handleViewAllActivity = () => {
        // Navigate to a dedicated activity page (to be implemented)
        router.push('/activity');
    };

    const loadMoreActivities = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            // This would typically be an API call to your backend
            const response = await fetch(`/api/activity/paginated?userId=${userId}&cursor=${nextCursor}&limit=10`);
            const data: PaginatedRecentActivity = await response.json();

            setActivities(prev => [...prev, ...data.activities]);
            setHasMore(data.hasMore);
            setNextCursor(data.nextCursor);
        } catch (error) {
            console.error('Failed to load more activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, nextCursor, hasMore, isLoading]);

    return (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs">Start working on projects to see activity here</p>
                    </div>
                ) : (
                    <>
                        <motion.div
                            variants={{
                                show: {
                                    transition: {
                                        staggerChildren: 0.05,
                                    },
                                },
                            }}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                        >
                            {activities.map((activity) => (
                                <motion.div
                                    key={activity.id}
                                    variants={itemVariants}
                                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => handleActivityClick(activity)}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getActivityIcon(activity.entity_type, activity.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {getActivityDescription(activity)}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>
                                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            </span>
                                            {activity.organization_name && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">{activity.organization_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Load More Button */}
                        {hasMore && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadMoreActivities}
                                disabled={isLoading}
                                className="w-full mt-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-2" />
                                        Load More ({totalCount - activities.length} remaining)
                                    </>
                                )}
                            </Button>
                        )}

                        {/* View All Activity Button */}
                        {totalCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleViewAllActivity}
                                className="w-full mt-2"
                            >
                                View All Activity
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
