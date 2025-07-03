'use client';

import {
    Activity,
    ArrowLeft,
    BarChart3,
    Download,
    FolderOpen,
    History,
    Settings,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AnalyticsDataGrid } from '@/components/analytics/AnalyticsDataGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnalyticsMetrics } from '@/hooks/queries/useAnalytics';
import { Organization, Project } from '@/types';

interface ProjectAnalyticsPageClientProps {
    orgId: string;
    projectId: string;
    organization: Organization;
    project: Project;
    initialTab: string;
    initialTimeRange: 'week' | 'month' | 'quarter' | 'year';
}

export function ProjectAnalyticsPageClient({
    orgId,
    projectId,
    organization,
    project,
    initialTab,
    initialTimeRange,
}: ProjectAnalyticsPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(initialTab);

    // Fetch analytics metrics for quick stats
    const { data: metrics, isLoading: metricsLoading } = useAnalyticsMetrics(
        orgId,
        projectId,
        initialTimeRange,
    );

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(
            `/org/${orgId}/project/${projectId}/analytics?${params.toString()}`,
        );
    };

    const handleExportData = () => {
        // TODO: Implement data export functionality
        console.log('Export project analytics data');
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Navigation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href={`/org/${orgId}`} className="hover:text-foreground">
                    {organization.name}
                </Link>
                <span>/</span>
                <Link
                    href={`/org/${orgId}/project/${projectId}`}
                    className="hover:text-foreground"
                >
                    {project.name}
                </Link>
                <span>/</span>
                <span className="text-foreground">Analytics</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/org/${orgId}/project/${projectId}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Project
                        </Link>
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <FolderOpen className="h-8 w-8" />
                            Project Analytics
                        </h1>
                        <p className="text-muted-foreground">
                            Activity insights and version history for{' '}
                            {project.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                        {project.status} Project
                    </Badge>

                    <Button variant="outline" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="ml-2 text-sm font-medium">
                                Total Activities
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metricsLoading
                                    ? '...'
                                    : metrics?.totalActivities.toLocaleString() ||
                                      '0'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="ml-2 text-sm font-medium">
                                This Month
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metricsLoading
                                    ? '...'
                                    : metrics?.activitiesThisMonth.toLocaleString() ||
                                      '0'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <History className="h-4 w-4 text-purple-500" />
                            <span className="ml-2 text-sm font-medium">
                                Contributors
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metricsLoading
                                    ? '...'
                                    : metrics?.totalUsers || '0'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 text-orange-500" />
                            <span className="ml-2 text-sm font-medium">
                                Documents
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl font-bold">
                                {metricsLoading
                                    ? '...'
                                    : metrics?.totalDocuments || '0'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                        value="dashboard"
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="flex items-center gap-2"
                    >
                        <Activity className="h-4 w-4" />
                        Activity Log
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        Version History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                Project Analytics Dashboard
                            </CardTitle>
                            <CardDescription>
                                Visual insights into project activity and
                                contributor engagement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnalyticsDashboard
                                orgId={orgId}
                                projectId={projectId}
                                timeRange={initialTimeRange}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="h-5 w-5 mr-2" />
                                Project Activity Log
                            </CardTitle>
                            <CardDescription>
                                Complete history of all activities within this
                                project
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnalyticsDataGrid
                                orgId={orgId}
                                projectId={projectId}
                                height={700}
                                enableExport={true}
                                enableRestore={true}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <History className="h-5 w-5 mr-2" />
                                Project Version History
                            </CardTitle>
                            <CardDescription>
                                Track changes and restore previous versions of
                                project documents and blocks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-2">
                                        Version History
                                    </h3>
                                    <p className="text-sm max-w-md mx-auto">
                                        Select a specific document or block from
                                        the activity log to view its version
                                        history and restore previous versions.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setActiveTab('activity')}
                                    >
                                        View Activity Log
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Info */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span>Project: {project.name}</span>
                            <span>•</span>
                            <span>
                                Last updated: {new Date().toLocaleString()}
                            </span>
                            <span>•</span>
                            <span>Data retention: 90 days</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Analytics Settings</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
