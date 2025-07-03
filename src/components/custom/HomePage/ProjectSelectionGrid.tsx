'use client';

import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Building,
    Calendar,
    Filter,
    FolderOpen,
    Plus,
    Search,
    Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LazyImage } from '@/components/ui/lazy-image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { ProjectWithOrg } from '@/lib/db/server/home.server';
import { Organization } from '@/types/base/organizations.types';

interface ProjectSelectionGridProps {
    projects: ProjectWithOrg[];
    organizations: Organization[];
    onCreateProject: () => void;
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export function ProjectSelectionGrid({
    projects,
    organizations,
    onCreateProject,
}: ProjectSelectionGridProps) {
    const router = useRouter();
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');

    // Use debounced search hook for better performance
    const { searchQuery, setSearchQuery, debouncedQuery, isSearching } =
        useDebounceSearch();

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            // Use debounced query for better performance
            const matchesSearch =
                debouncedQuery === '' ||
                project.name
                    .toLowerCase()
                    .includes(debouncedQuery.toLowerCase()) ||
                project.description
                    ?.toLowerCase()
                    .includes(debouncedQuery.toLowerCase()) ||
                project.organization.name
                    .toLowerCase()
                    .includes(debouncedQuery.toLowerCase());

            const matchesOrg =
                selectedOrgFilter === 'all' ||
                project.organization.id === selectedOrgFilter;

            return matchesSearch && matchesOrg;
        });
    }, [projects, debouncedQuery, selectedOrgFilter]);

    const handleProjectClick = (project: ProjectWithOrg) => {
        router.push(`/org/${project.organization.id}/project/${project.id}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'archived':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-xl font-semibold">Your Projects</h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Search with loading indicator */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full sm:w-64"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Organization Filter */}
                    <Select
                        value={selectedOrgFilter}
                        onValueChange={setSelectedOrgFilter}
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Organizations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All Organizations
                            </SelectItem>
                            {organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <Card className="p-8">
                    <div className="text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">
                            {debouncedQuery || selectedOrgFilter !== 'all'
                                ? 'No projects found'
                                : 'No projects yet'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {debouncedQuery || selectedOrgFilter !== 'all'
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by creating your first project.'}
                        </p>
                        <Button onClick={onCreateProject}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                        </Button>
                    </div>
                </Card>
            ) : (
                <motion.div
                    variants={{
                        show: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {filteredProjects.map((project) => (
                        <motion.div key={project.id} variants={itemVariants}>
                            <Card
                                className="cursor-pointer hover:shadow-md transition-all duration-300 h-full"
                                onClick={() => handleProjectClick(project)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">
                                                {project.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Building className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground truncate">
                                                    {project.organization.name}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            className={getStatusColor(
                                                project.status,
                                            )}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {project.description ||
                                            'No description available'}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                <span>
                                                    {project.member_count || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {project.last_accessed
                                                        ? formatDistanceToNow(
                                                              new Date(
                                                                  project.last_accessed,
                                                              ),
                                                              {
                                                                  addSuffix: true,
                                                              },
                                                          )
                                                        : 'Never accessed'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
