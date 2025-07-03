'use client';

import { format } from 'date-fns';
import {
    Activity,
    Blocks,
    Calendar,
    FileText,
    RefreshCw,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAnalyticsMetrics } from '@/hooks/queries/useAnalytics';
import { AnalyticsDashboardProps } from '@/types/analytics.types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard({
    orgId,
    projectId,
    timeRange: initialTimeRange = 'month',
}: AnalyticsDashboardProps) {
    const [timeRange, setTimeRange] = useState<
        'week' | 'month' | 'quarter' | 'year'
    >(initialTimeRange);

    const {
        data: metrics,
        isLoading,
        error,
        refetch,
    } = useAnalyticsMetrics(orgId, projectId, timeRange);

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 text-red-500">
                Error loading analytics: {error.message}
            </div>
        );
    }

    if (isLoading || !metrics) {
        return (
            <div className="space-y-6">
                {/* Loading skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-64 bg-gray-200 rounded"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Analytics Dashboard
                    </h2>
                    <p className="text-muted-foreground">
                        {projectId ? 'Project-level' : 'Organization-level'}{' '}
                        activity insights
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={timeRange}
                        onValueChange={(value: any) => setTimeRange(value)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Last Week</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                            <SelectItem value="quarter">
                                Last Quarter
                            </SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="ml-2 text-sm font-medium">
                                Total Activities
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metrics.totalActivities.toLocaleString()}
                            </div>
                            {timeRange === 'month' &&
                                metrics.activitiesThisMonth > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        +{metrics.activitiesThisMonth} this
                                        month
                                    </p>
                                )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="ml-2 text-sm font-medium">
                                Active Users
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metrics.totalUsers}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                in selected period
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="ml-2 text-sm font-medium">
                                Documents
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metrics.totalDocuments}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                total documents
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Blocks className="h-4 w-4 text-muted-foreground" />
                            <span className="ml-2 text-sm font-medium">
                                Blocks
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metrics.totalBlocks}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                total blocks
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Activity Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={metrics.activityByDay}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) =>
                                        format(new Date(value), 'MMM dd')
                                    }
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) =>
                                        format(new Date(value), 'MMM dd, yyyy')
                                    }
                                    formatter={(value) => [value, 'Activities']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Activity by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={metrics.activityByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {metrics.activityByType.map(
                                        (entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                            />
                                        ),
                                    )}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Most Active Users */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Most Active Users
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {metrics.mostActiveUsers.length > 0 ? (
                        <div className="space-y-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                    data={metrics.mostActiveUsers.slice(0, 10)}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="user_name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar
                                        dataKey="activity_count"
                                        fill="#8884d8"
                                    />
                                </BarChart>
                            </ResponsiveContainer>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {metrics.mostActiveUsers
                                    .slice(0, 6)
                                    .map((user, index) => (
                                        <div
                                            key={user.user_id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center">
                                                <Badge
                                                    variant="outline"
                                                    className="mr-2"
                                                >
                                                    #{index + 1}
                                                </Badge>
                                                <span className="font-medium">
                                                    {user.user_name}
                                                </span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {user.activity_count} activities
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No user activity data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
