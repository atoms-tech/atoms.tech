'use client';

import { motion } from 'framer-motion';
import {
    Clock,
    Edit,
    Eye,
    FileText,
    MessageSquare,
    Plus,
    Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard.types';

interface Activity {
    id: string;
    type: 'create' | 'edit' | 'delete' | 'view' | 'comment' | 'share';
    title: string;
    description: string;
    timestamp: Date | string | number;
    user?: string | { id: string; name: string; [key: string]: unknown };
    project?: string | { id: string; name: string; [key: string]: unknown };
    icon: React.ReactNode;
    color: string;
}

export function RecentActivityWidget({ instance, data }: WidgetProps) {
    // Get activities from data or use mock data
    const activities =
        (data as any)?.activities ||
        ([
            {
                id: '1',
                type: 'create',
                title: 'Created new requirement',
                description: 'REQ-001: System shall authenticate users',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                project: 'Authentication System',
                icon: <Plus className="h-4 w-4" />,
                color: 'text-green-400',
            },
            {
                id: '2',
                type: 'edit',
                title: 'Updated requirement',
                description: 'REQ-002: Modified acceptance criteria',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                project: 'User Management',
                icon: <Edit className="h-4 w-4" />,
                color: 'text-blue-400',
            },
            {
                id: '3',
                type: 'comment',
                title: 'Added comment',
                description: 'Clarified implementation details',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
                user: 'Sarah Chen',
                project: 'API Gateway',
                icon: <MessageSquare className="h-4 w-4" />,
                color: 'text-purple-400',
            },
            {
                id: '4',
                type: 'view',
                title: 'Reviewed requirements',
                description: 'Completed review of 5 requirements',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
                project: 'Security Module',
                icon: <Eye className="h-4 w-4" />,
                color: 'text-yellow-400',
            },
            {
                id: '5',
                type: 'share',
                title: 'Shared project',
                description: 'Invited 3 team members to collaborate',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                user: 'Michael Torres',
                project: 'Mobile App',
                icon: <Users className="h-4 w-4" />,
                color: 'text-orange-400',
            },
        ] as Activity[]);

    const formatTimeAgo = (timestamp: Date | string | number) => {
        const now = new Date();
        const date = new Date(timestamp);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Unknown';
        }

        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const getActivityTypeLabel = (type: Activity['type']) => {
        const labels = {
            create: 'Created',
            edit: 'Updated',
            delete: 'Deleted',
            view: 'Viewed',
            comment: 'Commented',
            share: 'Shared',
        };
        return labels[type];
    };

    const getActivityTypeColor = (type: Activity['type']) => {
        const colors = {
            create: 'bg-green-500/20 text-green-400',
            edit: 'bg-blue-500/20 text-blue-400',
            delete: 'bg-red-500/20 text-red-400',
            view: 'bg-yellow-500/20 text-yellow-400',
            comment: 'bg-purple-500/20 text-purple-400',
            share: 'bg-orange-500/20 text-orange-400',
        };
        return colors[type];
    };

    // Get display settings from config
    const maxItems = instance.config.maxItems || 5;
    const showProjects = instance.config.showProjects !== false;
    const showUsers = instance.config.showUsers !== false;
    const showTimestamps = instance.config.showTimestamps !== false;

    const displayedActivities = activities.slice(0, maxItems);

    return (
        <Card className="h-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
                <div className="space-y-3">
                    {displayedActivities.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent activity</p>
                            <p className="text-xs">
                                Start working on projects to see activity here
                            </p>
                        </div>
                    ) : (
                        displayedActivities.map(
                            (activity: Activity, index: number) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-black/30 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`${activity.color} mt-1`}
                                        >
                                            {activity.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-medium text-white truncate">
                                                    {activity.title}
                                                </h4>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getActivityTypeColor(activity.type)}`}
                                                >
                                                    {getActivityTypeLabel(
                                                        activity.type,
                                                    )}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                                {activity.description}
                                            </p>

                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    {showProjects &&
                                                        activity.project && (
                                                            <span className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                {typeof activity.project ===
                                                                'string'
                                                                    ? activity.project
                                                                    : (
                                                                          activity.project as {
                                                                              name: string;
                                                                          }
                                                                      ).name ||
                                                                      'Unknown Project'}
                                                            </span>
                                                        )}
                                                    {showUsers &&
                                                        activity.user && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {typeof activity.user ===
                                                                'string'
                                                                    ? activity.user
                                                                    : (
                                                                          activity.user as {
                                                                              name: string;
                                                                          }
                                                                      ).name ||
                                                                      'Unknown User'}
                                                            </span>
                                                        )}
                                                </div>
                                                {showTimestamps && (
                                                    <span>
                                                        {formatTimeAgo(
                                                            activity.timestamp,
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ),
                        )
                    )}
                </div>

                {activities.length > maxItems && (
                    <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" className="text-xs">
                            View All Activity (
                            {activities.length - Number(maxItems)} more)
                        </Button>
                    </div>
                )}

                {activities.length === 0 && (
                    <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" className="text-xs">
                            Start Your First Project
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
