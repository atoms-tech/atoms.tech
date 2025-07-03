'use client';

import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    Building,
    Calendar,
    FolderOpen,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    OrganizationData,
    ProjectData,
    WidgetProps,
} from '@/types/dashboard.types';

interface Metric {
    label: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
}

export function AnalyticsWidget({ instance, data }: WidgetProps) {
    // Get data from props
    const organizations =
        ((data as any)?.organizations as OrganizationData[]) || [];
    const projects = ((data as any)?.projects as ProjectData[]) || [];
    const _userId = (data as any)?.userId;

    // Calculate metrics
    const totalOrganizations = organizations.length;
    const enterpriseOrgs = organizations.filter(
        (org) => org.type === 'enterprise',
    ).length;
    const _teamOrgs = organizations.filter((org) => org.type === 'team').length;
    const activeProjects = projects.filter(
        (project) => project.status === 'active',
    ).length;

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
            color: 'text-blue-400',
        },
        {
            label: 'Enterprise Organizations',
            value: enterpriseOrgs,
            change: enterpriseOrgs > 0 ? 25 : 0,
            icon: <Building className="h-4 w-4" />,
            color: 'text-purple-400',
        },
        {
            label: 'Active Projects',
            value: activeProjects,
            change: activeProjects > 0 ? 20 : 0,
            icon: <FolderOpen className="h-4 w-4" />,
            color: 'text-orange-400',
        },
        {
            label: 'Days Active',
            value: daysActive,
            change: 8,
            icon: <Calendar className="h-4 w-4" />,
            color: 'text-teal-400',
        },
        {
            label: 'Productivity Score',
            value: `${productivityScore}%`,
            change: 5,
            icon: <Target className="h-4 w-4" />,
            color: 'text-yellow-400',
        },
    ];

    // Get display mode from config
    const displayMode = instance.config.displayMode || 'detailed';
    const showTrends = instance.config.showTrends !== false;

    return (
        <Card className="h-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Analytics Dashboard
                </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto space-y-4">
                {/* Key Metrics */}
                <div
                    className={`grid gap-3 ${
                        instance.size.width > 500
                            ? 'grid-cols-3'
                            : instance.size.width > 350
                              ? 'grid-cols-2'
                              : 'grid-cols-1'
                    }`}
                >
                    {metrics
                        .slice(
                            0,
                            displayMode === 'compact' ? 3 : metrics.length,
                        )
                        .map((metric, index) => (
                            <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-black/30 rounded-lg p-3 border border-gray-700"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`${metric.color}`}>
                                        {metric.icon}
                                    </div>
                                    {showTrends &&
                                        metric.change !== undefined && (
                                            <div
                                                className={`flex items-center text-xs ${
                                                    metric.change >= 0
                                                        ? 'text-green-400'
                                                        : 'text-red-400'
                                                }`}
                                            >
                                                {metric.change >= 0 ? (
                                                    <TrendingUp className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3 mr-1" />
                                                )}
                                                {Math.abs(metric.change)}%
                                            </div>
                                        )}
                                </div>
                                <div className="text-xl font-bold text-white mb-1">
                                    {metric.value}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {metric.label}
                                </div>
                            </motion.div>
                        ))}
                </div>

                {/* Progress Tracking */}
                {displayMode !== 'compact' && (
                    <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-green-400" />
                            <h3 className="text-sm font-medium text-white">
                                Weekly Progress
                            </h3>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-300">
                                        Weekly Activity Goal
                                    </span>
                                    <span className="text-sm font-medium text-white">
                                        {weeklyGoalProgress}%
                                    </span>
                                </div>
                                <Progress
                                    value={weeklyGoalProgress}
                                    className="h-2"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {weeklyGoalProgress >= 70
                                        ? 'Great progress!'
                                        : 'Keep going!'}{' '}
                                    You&apos;re{' '}
                                    {weeklyGoalProgress >= 100
                                        ? 'ahead of'
                                        : 'on track for'}{' '}
                                    your weekly goal.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
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
                    </div>
                )}

                {/* Summary Stats */}
                {displayMode === 'detailed' && (
                    <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-purple-400" />
                            <h3 className="text-sm font-medium text-white">
                                Activity Summary
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-sm font-medium text-white">
                                    This Week
                                </div>
                                <div className="text-xs text-gray-400">
                                    {Math.floor(weeklyGoalProgress / 10)}{' '}
                                    actions completed
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">
                                    This Month
                                </div>
                                <div className="text-xs text-gray-400">
                                    {Math.floor(daysActive * 2.5)} total
                                    activities
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
