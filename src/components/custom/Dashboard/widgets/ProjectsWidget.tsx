'use client';

import { motion } from 'framer-motion';
import {
    Archive,
    Calendar,
    FolderOpen,
    MoreVertical,
    Plus,
    Settings,
    Star,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WidgetProps } from '@/types/dashboard.types';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'archived' | 'draft';
    lastModified: Date | string | number;
    memberCount?: number;
    requirementCount?: number;
    organization?: string | { id: string; name: string; [key: string]: any };
    isFavorite?: boolean;
}

export function ProjectsWidget({
    instance,
    data,
    onConfigChange,
}: WidgetProps) {
    const router = useRouter();

    // Get projects from data or use mock data
    const projects =
        data?.projects ||
        ([
            {
                id: '1',
                name: 'Authentication System',
                description:
                    'User authentication and authorization requirements',
                status: 'active',
                lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
                memberCount: 5,
                requirementCount: 23,
                organization: 'ATOMS Corp',
                isFavorite: true,
            },
            {
                id: '2',
                name: 'API Gateway',
                description: 'Microservices API gateway specifications',
                status: 'active',
                lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24),
                memberCount: 3,
                requirementCount: 15,
                organization: 'ATOMS Corp',
                isFavorite: false,
            },
            {
                id: '3',
                name: 'Mobile App Requirements',
                description: 'Cross-platform mobile application requirements',
                status: 'draft',
                lastModified: new Date(Date.now() - 1000 * 60 * 60 * 48),
                memberCount: 2,
                requirementCount: 8,
                organization: 'ATOMS Corp',
                isFavorite: false,
            },
        ] as Project[]);

    const organizations = data?.organizations || [];

    const formatTimeAgo = (timestamp: Date | string | number) => {
        const now = new Date();
        const date = new Date(timestamp);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Unknown';
        }

        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Recently';
    };

    const getStatusColor = (status: Project['status']) => {
        const colors = {
            active: 'bg-green-500/20 text-green-400',
            completed: 'bg-blue-500/20 text-blue-400',
            archived: 'bg-gray-500/20 text-gray-400',
            draft: 'bg-yellow-500/20 text-yellow-400',
        };
        return colors[status];
    };

    const getStatusLabel = (status: Project['status']) => {
        const labels = {
            active: 'Active',
            completed: 'Completed',
            archived: 'Archived',
            draft: 'Draft',
        };
        return labels[status];
    };

    const handleCreateProject = () => {
        if (organizations.length === 1) {
            router.push(`/org/${organizations[0].id}`);
        } else {
            router.push('/home/user');
        }
    };

    const handleProjectClick = (project: Project) => {
        // Navigate to project - this would depend on your routing structure
        router.push(`/project/${project.id}`);
    };

    // Get display settings from config
    const maxItems = instance.config.maxItems || 6;
    const showStats = instance.config.showStats !== false;
    const showOrganization = instance.config.showOrganization !== false;
    const viewMode = instance.config.viewMode || 'grid';

    const displayedProjects = projects.slice(0, maxItems);

    return (
        <Card className="h-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                        <FolderOpen className="h-5 w-5 text-blue-400" />
                        Projects
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={handleCreateProject}
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
                {displayedProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm mb-2">No projects yet</p>
                        <Button
                            size="sm"
                            onClick={handleCreateProject}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Your First Project
                        </Button>
                    </div>
                ) : (
                    <div
                        className={`space-y-3 ${
                            viewMode === 'list'
                                ? ''
                                : instance.size.width > 500
                                  ? 'grid grid-cols-2 gap-3 space-y-0'
                                  : ''
                        }`}
                    >
                        {displayedProjects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-black/30 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer group"
                                onClick={() => handleProjectClick(project)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                            {project.name}
                                        </h4>
                                        {project.isFavorite && (
                                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${getStatusColor(project.status)}`}
                                        >
                                            {getStatusLabel(project.status)}
                                        </Badge>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Star className="h-4 w-4 mr-2" />
                                                    {project.isFavorite
                                                        ? 'Remove from favorites'
                                                        : 'Add to favorites'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Project settings
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive project
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {project.description && (
                                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-3">
                                        {showStats &&
                                            project.requirementCount && (
                                                <span>
                                                    {project.requirementCount}{' '}
                                                    requirements
                                                </span>
                                            )}
                                        {showStats && project.memberCount && (
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {project.memberCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {showOrganization &&
                                            project.organization && (
                                                <span className="text-xs text-gray-500">
                                                    {typeof project.organization ===
                                                    'string'
                                                        ? project.organization
                                                        : project.organization
                                                              .name ||
                                                          'Unknown Org'}
                                                </span>
                                            )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatTimeAgo(
                                                project.lastModified,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {projects.length > maxItems && (
                    <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" className="text-xs">
                            View All Projects ({projects.length - maxItems}{' '}
                            more)
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
