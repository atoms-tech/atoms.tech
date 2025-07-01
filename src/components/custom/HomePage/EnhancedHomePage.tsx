'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Clock, 
  Users, 
  BarChart3,
  Star,
  ArrowRight,
  FileText,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  organizationName: string;
  requirementsCount: number;
  completedRequirements: number;
  lastActivity: string;
  status: 'active' | 'completed' | 'archived';
  isStarred: boolean;
  teamMembers: number;
  progress: number;
}

interface RecentActivity {
  id: string;
  type: 'requirement_created' | 'requirement_updated' | 'project_created' | 'team_joined';
  title: string;
  description: string;
  timestamp: string;
  projectName?: string;
  userName?: string;
}

interface QuickStats {
  totalProjects: number;
  totalRequirements: number;
  completedRequirements: number;
  activeTeamMembers: number;
  completionRate: number;
  weeklyProgress: number;
}

export function EnhancedHomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomePageData();
  }, []);

  const fetchHomePageData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would come from APIs
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Complete requirements for the new e-commerce platform including user management, product catalog, and payment processing.',
          organizationId: 'org1',
          organizationName: 'TechCorp Inc.',
          requirementsCount: 156,
          completedRequirements: 124,
          lastActivity: '2025-06-30T10:30:00Z',
          status: 'active',
          isStarred: true,
          teamMembers: 8,
          progress: 79.5,
        },
        {
          id: '2',
          name: 'Mobile App Redesign',
          description: 'UI/UX requirements for the mobile application redesign project.',
          organizationId: 'org1',
          organizationName: 'TechCorp Inc.',
          requirementsCount: 89,
          completedRequirements: 89,
          lastActivity: '2025-06-29T15:45:00Z',
          status: 'completed',
          isStarred: false,
          teamMembers: 5,
          progress: 100,
        },
        {
          id: '3',
          name: 'API Integration',
          description: 'Requirements for third-party API integrations and data synchronization.',
          organizationId: 'org2',
          organizationName: 'StartupXYZ',
          requirementsCount: 67,
          completedRequirements: 45,
          lastActivity: '2025-06-30T09:15:00Z',
          status: 'active',
          isStarred: true,
          teamMembers: 3,
          progress: 67.2,
        },
      ];

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'requirement_created',
          title: 'New requirement added',
          description: 'Payment gateway integration requirement',
          timestamp: '2025-06-30T10:30:00Z',
          projectName: 'E-commerce Platform',
          userName: 'Alice Johnson',
        },
        {
          id: '2',
          type: 'requirement_updated',
          title: 'Requirement updated',
          description: 'User authentication flow updated',
          timestamp: '2025-06-30T09:45:00Z',
          projectName: 'Mobile App Redesign',
          userName: 'Bob Smith',
        },
        {
          id: '3',
          type: 'project_created',
          title: 'New project created',
          description: 'API Integration project started',
          timestamp: '2025-06-29T16:20:00Z',
          projectName: 'API Integration',
          userName: 'Carol Davis',
        },
      ];

      const mockStats: QuickStats = {
        totalProjects: 12,
        totalRequirements: 1247,
        completedRequirements: 892,
        activeTeamMembers: 16,
        completionRate: 71.5,
        weeklyProgress: 8.3,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProjects(mockProjects);
      setRecentActivity(mockActivity);
      setQuickStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch home page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStarProject = (projectId: string) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, isStarred: !project.isStarred }
          : project
      )
    );
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const starredProjects = filteredProjects.filter(project => project.isStarred);
  const otherProjects = filteredProjects.filter(project => !project.isStarred);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Here's what's happening with your requirements management.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                      Total Projects
                    </p>
                    <p className="text-3xl font-bold">{quickStats.totalProjects}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-200" />
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
                    <p className="text-3xl font-bold">{quickStats.completionRate}%</p>
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
                      Team Members
                    </p>
                    <p className="text-3xl font-bold">{quickStats.activeTeamMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">
                      Weekly Progress
                    </p>
                    <p className="text-3xl font-bold">+{quickStats.weeklyProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Projects
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Starred Projects */}
            {starredProjects.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Starred Projects
                </h3>
                {starredProjects.map((project) => (
                  <Card key={project.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {project.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStarProject(project.id)}
                              className="p-1"
                            >
                              <Star className={`h-4 w-4 ${project.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                            </Button>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                            {project.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {project.requirementsCount} requirements
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {project.teamMembers} members
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(project.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={project.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              project.status === 'completed' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }
                          >
                            {project.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            Progress: {project.completedRequirements} of {project.requirementsCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {project.organizationName}
                        </span>
                        <Button variant="outline" size="sm">
                          Open Project
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Other Projects */}
            {otherProjects.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  All Projects
                </h3>
                {otherProjects.map((project) => (
                  <Card key={project.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {project.name}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStarProject(project.id)}
                              className="p-1"
                            >
                              <Star className={`h-4 w-4 ${project.isStarred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                            </Button>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                            {project.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {project.requirementsCount} requirements
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {project.teamMembers} members
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(project.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={project.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              project.status === 'completed' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }
                          >
                            {project.status.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            Progress: {project.completedRequirements} of {project.requirementsCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {project.organizationName}
                        </span>
                        <Button variant="outline" size="sm">
                          Open Project
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredProjects.length === 0 && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first project.'}
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Latest updates from your projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'requirement_created' ? 'bg-green-100 dark:bg-green-900/30' :
                      activity.type === 'requirement_updated' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'project_created' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {activity.type === 'requirement_created' && <Plus className="h-4 w-4 text-green-600" />}
                      {activity.type === 'requirement_updated' && <FileText className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'project_created' && <FolderOpen className="h-4 w-4 text-purple-600" />}
                      {activity.type === 'team_joined' && <Users className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {activity.projectName && (
                          <span>{activity.projectName}</span>
                        )}
                        {activity.userName && (
                          <span>• {activity.userName}</span>
                        )}
                        <span>• {new Date(activity.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
