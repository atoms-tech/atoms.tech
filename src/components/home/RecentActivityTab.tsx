'use client';

import { Activity, FileText, FolderPlus, Plus, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/lib/providers/user.provider';

export function RecentActivityTab() {
    const { user, profile } = useUser();

    // Determine greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Get display name
    const getDisplayName = () => {
        if (profile?.full_name) return profile.full_name;
        if (user?.email) {
            const emailUsername = user.email.split('@')[0];
            return emailUsername;
        }
        return '';
    };

    const displayName = getDisplayName();
    const greeting = getGreeting();

    // Mock activities for now
    const mockActivities: never[] = [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    {greeting}, {displayName}
                </h1>
                <p className="text-muted-foreground">
                    You have access to 3 projects across 3 organizations.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Create New Project
                </Button>
                <Button variant="outline" className="gap-2 border">
                    <FileText className="h-4 w-4" />
                    New Document
                </Button>
                <Button variant="outline" className="gap-2 border">
                    <Users className="h-4 w-4" />
                    Invite Team
                </Button>
            </div>

            {/* Recent Activity Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        <CardTitle>Recent Activity</CardTitle>
                    </div>
                    <CardDescription>
                        Your latest actions and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mockActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                            <p className="text-muted-foreground mb-4">
                                Start working on projects to see activity here
                            </p>
                            <Button variant="outline" className="gap-2">
                                <FolderPlus className="h-4 w-4" />
                                Browse Projects
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mockActivities.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    {/* Activity items would be rendered here */}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}