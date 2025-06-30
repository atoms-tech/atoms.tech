'use client';

import { motion } from 'framer-motion';
import { 
    TrendingUp, 
    TrendingDown, 
    Building, 
    FolderOpen, 
    Calendar,
    Target,
    Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Organization } from '@/types/base/organizations.types';
import { ProjectWithOrg } from '@/lib/db/server/home.server';

interface DashboardAnalyticsProps {
    organizations: Organization[];
    projects: ProjectWithOrg[];
    userId: string;
}

interface Metric {
    label: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
}

export function DashboardAnalytics({ organizations, projects, userId }: DashboardAnalyticsProps) {
    // Calculate metrics
    const totalOrganizations = organizations.length;
    const enterpriseOrgs = organizations.filter(org => org.type === 'enterprise').length;
    const teamOrgs = organizations.filter(org => org.type === 'team').length;
    const activeProjects = projects.filter(project => project.status === 'active').length;
    
    // Mock data for demonstration - in real app, this would come from analytics
    const daysActive = 13;
    const productivityScore = 92;
    const weeklyGoalProgress = 70;

    const metrics: Metric[] = [
        {
            label: 'Total Organizations',
            value: totalOrganizations,
            change: totalOrganizations > 1 ? 15 : 0,
            icon: <Building className="h-4 w-4" />,
            color: 'text-blue-400'
        },
        {
            label: 'Enterprise Organizations',
            value: enterpriseOrgs,
            change: enterpriseOrgs > 0 ? 25 : 0,
            icon: <Building className="h-4 w-4" />,
            color: 'text-purple-400'
        },
        {
            label: 'Team Organizations',
            value: teamOrgs,
            change: teamOrgs > 0 ? 10 : -5,
            icon: <Building className="h-4 w-4" />,
            color: 'text-green-400'
        },
        {
            label: 'Active Projects',
            value: activeProjects,
            change: activeProjects > 0 ? 20 : 0,
            icon: <FolderOpen className="h-4 w-4" />,
            color: 'text-orange-400'
        },
        {
            label: 'Days Active',
            value: daysActive,
            change: 8,
            icon: <Calendar className="h-4 w-4" />,
            color: 'text-teal-400'
        },
        {
            label: 'Productivity Score',
            value: `${productivityScore}%`,
            change: 5,
            icon: <Target className="h-4 w-4" />,
            color: 'text-yellow-400'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Activity className="h-5 w-5 text-blue-400" />
                        Dashboard Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {metrics.map((metric, index) => (
                            <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-black/30 rounded-lg p-4 border border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`${metric.color}`}>
                                        {metric.icon}
                                    </div>
                                    {metric.change !== undefined && (
                                        <div className={`flex items-center text-xs ${
                                            metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {metric.change >= 0 ? (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                            )}
                                            {Math.abs(metric.change)}%
                                        </div>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {metric.value}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {metric.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Progress Tracking */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Target className="h-5 w-5 text-green-400" />
                        Weekly Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">Weekly Activity Goal</span>
                                <span className="text-sm font-medium text-white">{weeklyGoalProgress}%</span>
                            </div>
                            <Progress value={weeklyGoalProgress} className="h-2" />
                            <p className="text-xs text-gray-400 mt-1">
                                {weeklyGoalProgress >= 70 ? 'Great progress!' : 'Keep going!'} 
                                {' '}You're {weeklyGoalProgress >= 100 ? 'ahead of' : 'on track for'} your weekly goal.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                            <div className="text-center">
                                <div className="text-lg font-bold text-white">
                                    {Math.floor(daysActive * 0.8)}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Requirements Created
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-white">
                                    {Math.floor(daysActive * 0.3)}
                                </div>
                                <div className="text-xs text-gray-400">
                                    AI Analyses Run
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
