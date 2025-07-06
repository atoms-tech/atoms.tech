'use client';

import { motion } from 'framer-motion';
import { Activity, FileText, FolderPlus, Plus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/lib/providers/user.provider';

interface ActivityItem {
    id: string;
    type: 'document' | 'project' | 'organization' | 'requirement';
    title: string;
    description: string;
    timestamp: Date;
    icon: React.ReactNode;
}

export function RecentActivityTab() {
    const { user, profile } = useUser();
    const [greeting, setGreeting] = useState('');
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // Mock recent activities - in real implementation, fetch from API
    useEffect(() => {
        // This would be replaced with actual API call
        const mockActivities: ActivityItem[] = [
            // Currently empty - will be populated when activity tracking is implemented
        ];
        setActivities(mockActivities);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold tracking-tight">
                    {greeting},{' '}
                    {profile?.full_name || user?.email?.split('@')[0]}
                </h1>
                <p className="text-muted-foreground">
                    You have access to 3 projects across 3 organizations.
                </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-3"
            >
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                </Button>
                <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    New Document
                </Button>
                <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team
                </Button>
            </motion.div>

            {/* Recent Activity Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5" />
                            <CardTitle>Recent Activity</CardTitle>
                        </div>
                        <CardDescription>
                            Your latest actions and updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activities.length > 0 ? (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-4"
                            >
                                {activities.map((activity) => (
                                    <motion.div
                                        key={activity.id}
                                        variants={itemVariants}
                                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {activity.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {activity.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {activity.timestamp.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-12">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    No recent activity
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Start working on projects to see activity
                                    here
                                </p>
                                <Button>
                                    <FolderPlus className="h-4 w-4 mr-2" />
                                    Browse Projects
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
