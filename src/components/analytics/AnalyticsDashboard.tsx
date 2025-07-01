'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar,
  Activity,
  Target,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalRequirements: number;
    completedRequirements: number;
    activeProjects: number;
    teamMembers: number;
    completionRate: number;
    avgTimeToComplete: number;
  };
  trends: {
    requirementsCreated: Array<{ date: string; count: number }>;
    requirementsCompleted: Array<{ date: string; count: number }>;
    projectActivity: Array<{ date: string; activity: number }>;
  };
  projects: Array<{
    id: string;
    name: string;
    requirementsCount: number;
    completedCount: number;
    completionRate: number;
    lastActivity: string;
    status: 'active' | 'completed' | 'on-hold';
  }>;
  team: Array<{
    id: string;
    name: string;
    role: string;
    requirementsAssigned: number;
    requirementsCompleted: number;
    productivity: number;
  }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would come from an API
      const mockData: AnalyticsData = {
        overview: {
          totalRequirements: 1247,
          completedRequirements: 892,
          activeProjects: 12,
          teamMembers: 8,
          completionRate: 71.5,
          avgTimeToComplete: 5.2,
        },
        trends: {
          requirementsCreated: [
            { date: '2025-06-01', count: 45 },
            { date: '2025-06-02', count: 52 },
            { date: '2025-06-03', count: 38 },
            { date: '2025-06-04', count: 61 },
            { date: '2025-06-05', count: 47 },
          ],
          requirementsCompleted: [
            { date: '2025-06-01', count: 32 },
            { date: '2025-06-02', count: 41 },
            { date: '2025-06-03', count: 29 },
            { date: '2025-06-04', count: 48 },
            { date: '2025-06-05', count: 35 },
          ],
          projectActivity: [
            { date: '2025-06-01', activity: 85 },
            { date: '2025-06-02', activity: 92 },
            { date: '2025-06-03', activity: 78 },
            { date: '2025-06-04', activity: 96 },
            { date: '2025-06-05', activity: 88 },
          ],
        },
        projects: [
          {
            id: '1',
            name: 'E-commerce Platform',
            requirementsCount: 156,
            completedCount: 124,
            completionRate: 79.5,
            lastActivity: '2025-06-30T10:30:00Z',
            status: 'active',
          },
          {
            id: '2',
            name: 'Mobile App Redesign',
            requirementsCount: 89,
            completedCount: 89,
            completionRate: 100,
            lastActivity: '2025-06-29T15:45:00Z',
            status: 'completed',
          },
          {
            id: '3',
            name: 'API Integration',
            requirementsCount: 67,
            completedCount: 45,
            completionRate: 67.2,
            lastActivity: '2025-06-30T09:15:00Z',
            status: 'active',
          },
        ],
        team: [
          {
            id: '1',
            name: 'Alice Johnson',
            role: 'Product Manager',
            requirementsAssigned: 45,
            requirementsCompleted: 38,
            productivity: 84.4,
          },
          {
            id: '2',
            name: 'Bob Smith',
            role: 'Business Analyst',
            requirementsAssigned: 52,
            requirementsCompleted: 47,
            productivity: 90.4,
          },
          {
            id: '3',
            name: 'Carol Davis',
            role: 'QA Engineer',
            requirementsAssigned: 38,
            requirementsCompleted: 35,
            productivity: 92.1,
          },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf' | 'excel') => {
    // Mock export functionality
    console.log(`Exporting analytics data as ${format}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to load analytics data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There was an error loading the analytics dashboard.
          </p>
          <Button onClick={fetchAnalyticsData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Comprehensive insights into your requirements management performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={timeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={timeRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('90d')}
                >
                  90 Days
                </Button>
                <Button
                  variant={timeRange === '1y' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('1y')}
                >
                  1 Year
                </Button>
              </div>
              
              <Button variant="outline" onClick={() => exportData('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                    Total Requirements
                  </p>
                  <p className="text-3xl font-bold">
                    {data.overview.totalRequirements.toLocaleString()}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    +12% from last month
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold">
                    {data.overview.completionRate}%
                  </p>
                  <p className="text-green-100 text-sm mt-1">
                    +5.2% from last month
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">
                    Active Projects
                  </p>
                  <p className="text-3xl font-bold">
                    {data.overview.activeProjects}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">
                    2 new this month
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">
                    Avg. Completion Time
                  </p>
                  <p className="text-3xl font-bold">
                    {data.overview.avgTimeToComplete} days
                  </p>
                  <p className="text-orange-100 text-sm mt-1">
                    -1.3 days improvement
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Projects
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Team Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-6">
              {data.projects.map((project) => (
                <Card key={project.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">{project.name}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          Last activity: {new Date(project.lastActivity).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={project.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          project.status === 'completed' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : project.status === 'active'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                        }
                      >
                        {project.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                          Progress: {project.completedCount} of {project.requirementsCount} requirements
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {project.completionRate}%
                        </span>
                      </div>
                      <Progress value={project.completionRate} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Total</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{project.requirementsCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Completed</p>
                          <p className="font-semibold text-green-600">{project.completedCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                          <p className="font-semibold text-orange-600">{project.requirementsCount - project.completedCount}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid gap-6">
              {data.team.map((member) => (
                <Card key={member.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{member.productivity}%</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Productivity</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Assigned</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{member.requirementsAssigned}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Completed</p>
                        <p className="font-semibold text-green-600">{member.requirementsCompleted}</p>
                      </div>
                    </div>
                    <Progress value={member.productivity} className="h-2 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Requirements Trends
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Track creation and completion trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chart visualization would be implemented here</p>
                    <p className="text-sm">Using libraries like Chart.js or Recharts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
