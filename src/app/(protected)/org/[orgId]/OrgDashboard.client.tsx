'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Brain,
    Building,
    Copy,
    FileBox,
    FolderArchive,
    GitBranch,
    ListTodo,
    MoreVertical,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import OrgMembers from '@/app/(protected)/org/[orgId]/OrgMembers.client';
import { CreatePanel } from '@/components/base/panels/CreatePanel';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
    useDeleteProject,
    useDuplicateProject,
} from '@/hooks/mutations/useProjectMutations';
import { useOrgMemberRole } from '@/hooks/queries/useOrgMember';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { OrganizationRole, hasOrganizationPermission } from '@/lib/auth/permissions';
import { useUser } from '@/lib/providers/user.provider';
import { ExternalDocument } from '@/types/base/documents.types';
import { Organization } from '@/types/base/organizations.types';
import { Project } from '@/types/base/projects.types';

import ExternalDocsPages from './(files)/externalDocs/ExternalDocs.client';
import OrgInvitations from './OrgInvitations.client';

interface OrgDashboardProps {
    organization: Organization | null | undefined;
    orgLoading: boolean;
    projects: Project[] | undefined;
    projectsLoading: boolean;
    externalDocuments: ExternalDocument[] | undefined;
    documentsLoading: boolean;
    theme: string | undefined;
    onProjectClick: (project: Project) => void;
    onExternalDocsClick: () => void;
    onDemoClick: () => void;
    orgId: string;
}

export default function OrgDashboard(props: OrgDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get current tab from URL params, default to 'projects' if not present
    const currentTabFromUrl = searchParams?.get('currentTab') || 'projects';
    const [activeTab, setActiveTab] = useState(currentTabFromUrl);
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [_totalUsage, setTotalUsage] = useState(0); // Track total usage

    const [isAiAnalysisDialogOpen, setIsAiAnalysisDialogOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(
        null,
    );

    const { user } = useUser();
    const { data: userRoleQuery } = useOrgMemberRole(props.orgId, user?.id || '');
    const userRole: OrganizationRole | null = userRoleQuery ?? null;
    const { toast } = useToast();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    // Project action mutations
    const { mutateAsync: duplicateProject } = useDuplicateProject();
    const { mutateAsync: deleteProject } = useDeleteProject();

    // State for project actions
    const [isEditingProject, setIsEditingProject] = useState<string | null>(null);
    const [editingProjectName, setEditingProjectName] = useState('');

    // State for organization name editing
    const [isEditingOrgName, setIsEditingOrgName] = useState(false);
    const [editingOrgName, setEditingOrgName] = useState('');

    const { data: documents } = useQuery({
        queryKey: ['documents', selectedProjectId],
        queryFn: async () => {
            if (!selectedProjectId) return [];
            const client = getClientOrThrow();
            const { data, error } = await client
                .from('documents')
                .select('id, name')
                .eq('project_id', selectedProjectId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedProjectId && !!supabase && !authLoading && !authError,
    });

    const { data: requirements } = useQuery({
        queryKey: ['requirements', selectedDocumentId],
        queryFn: async () => {
            if (!selectedDocumentId) return [];
            const client = getClientOrThrow();
            const { data, error } = await client
                .from('requirements')
                .select('id, name')
                .eq('document_id', selectedDocumentId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedDocumentId && !!supabase && !authLoading && !authError,
    });

    // Calculate total usage from external documents passed as props
    useEffect(() => {
        if (props.externalDocuments) {
            const usage = props.externalDocuments.reduce(
                (sum, file) => sum + (file.size || 0),
                0,
            );
            setTotalUsage(usage);
        }
    }, [props.externalDocuments]);

    const handleCreateProject = () => {
        setIsCreatePanelOpen(true);
    };

    const handleGoToAiAnalysis = () => {
        setIsAiAnalysisDialogOpen(true);
    };

    const handleStartAnalysis = () => {
        if (selectedProjectId && selectedRequirementId) {
            window.location.href = `/org/${props.orgId}/project/${selectedProjectId}/requirements/${selectedRequirementId}`;
        }
    };

    // Update URL when tab changes
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        const params = new URLSearchParams(searchParams || '');
        params.set('currentTab', newTab);
        // router.push(`?${params.toString()}`, { scroll: false });
    };

    // Sync tab state with URL params when they change
    useEffect(() => {
        const tabFromUrl = searchParams?.get('currentTab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    // Project action handlers
    const handleDuplicateProject = async (project: Project) => {
        if (!user?.id) return;

        try {
            await duplicateProject({
                projectId: project.id,
                userId: user.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: `Project "${project.name}" duplicated successfully`,
            });
        } catch (error) {
            console.error('Error duplicating project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to duplicate project. Please try again.',
            });
        }
    };

    const handleEditProject = (project: Project) => {
        setIsEditingProject(project.id);
        setEditingProjectName(project.name);
    };

    const handleSaveProjectEdit = async (project: Project) => {
        if (!user?.id || !editingProjectName.trim()) return;

        try {
            const client = getClientOrThrow();
            const { error } = await client
                .from('projects')
                .update({
                    name: editingProjectName.trim(),
                    updated_by: user.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', project.id)
                .select()
                .single();

            if (error) throw error;

            setIsEditingProject(null);
            setEditingProjectName('');

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Project updated successfully',
            });

            // TODO: Make it refetch projects rather than reloading page
            window.location.reload();
        } catch (error) {
            console.error('Error updating project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update project. Please try again.',
            });
        }
    };

    const handleCancelProjectEdit = () => {
        setIsEditingProject(null);
        setEditingProjectName('');
    };

    // Organization name editing handlers
    const handleEditOrgName = () => {
        setIsEditingOrgName(true);
        setEditingOrgName(props.organization?.name || '');
    };

    const handleSaveOrgNameEdit = async () => {
        if (!editingOrgName.trim()) return;

        try {
            // TODO: Add actual API call to update organization name
            // For now, just show success message
            setIsEditingOrgName(false);
            setEditingOrgName('');

            toast({
                variant: 'default',
                title: 'Success',
                description:
                    'Organization name updated successfully (UI only - functionality not implemented)',
            });
        } catch (error) {
            console.error('Error updating organization name:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update organization name. Please try again.',
            });
        }
    };

    const handleCancelOrgNameEdit = () => {
        setIsEditingOrgName(false);
        setEditingOrgName('');
    };

    const handleDeleteProject = async (project: Project) => {
        if (!user?.id) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
        );

        if (!confirmed) return;

        try {
            await deleteProject({
                projectId: project.id,
                userId: user.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: `Project "${project.name}" deleted successfully`,
            });
        } catch (error) {
            console.error('Error deleting project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete project. Please try again.',
            });
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Organization Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {props.organization?.name || 'Organization Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {props.organization?.description ||
                            'Manage your organization resources'}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {props.organization?.type && (
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                            {props.organization.type.charAt(0).toUpperCase() +
                                props.organization.type.slice(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs
                defaultValue={currentTabFromUrl}
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList
                    className={`grid ${
                        props.organization?.type === 'enterprise'
                            ? hasOrganizationPermission(userRole, 'invitePeople')
                                ? 'grid-cols-4'
                                : 'grid-cols-3'
                            : 'grid-cols-3'
                    } w-full`}
                >
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="flex items-center gap-2">
                        <FolderArchive className="h-4 w-4" />
                        <span>Projects</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileBox className="h-4 w-4" />
                        <span>Regulation Documents</span>
                    </TabsTrigger>
                    {props.organization?.type === 'enterprise' &&
                        hasOrganizationPermission(userRole, 'invitePeople') && (
                            <TabsTrigger
                                value="invitations"
                                className="flex items-center gap-2"
                            >
                                <ListTodo className="h-4 w-4" />
                                <span>Invitations</span>
                            </TabsTrigger>
                        )}
                </TabsList>

                {/* Organization Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Organization Details</CardTitle>
                                    <CardDescription>
                                        Basic information about your organization
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {props.orgLoading ? (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">
                                                    Name:
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {isEditingOrgName ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editingOrgName}
                                                                onChange={(e) =>
                                                                    setEditingOrgName(
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter'
                                                                    ) {
                                                                        handleSaveOrgNameEdit();
                                                                    } else if (
                                                                        e.key === 'Escape'
                                                                    ) {
                                                                        handleCancelOrgNameEdit();
                                                                    }
                                                                }}
                                                                className="font-medium text-sm w-48"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={
                                                                    handleSaveOrgNameEdit
                                                                }
                                                                className="text-xs h-7"
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={
                                                                    handleCancelOrgNameEdit
                                                                }
                                                                className="text-xs h-7"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group">
                                                            <span className="font-medium">
                                                                {props.organization?.name}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={
                                                                    handleEditOrgName
                                                                }
                                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Type:
                                                </span>
                                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                                    {props.organization?.type}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Members:
                                                </span>
                                                <span className="font-medium">
                                                    {props.organization?.member_count ||
                                                        0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Plan:
                                                </span>
                                                <span className="font-medium">
                                                    {props.organization?.billing_plan}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <OrgMembers />
                        </div>
                    </div>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-xs"
                        />
                        <div className="flex items-center space-x-2">
                            {hasOrganizationPermission(userRole, 'createProjects') && (
                                <Button
                                    variant="outline"
                                    className="transition-colors hover:bg-primary hover:text-primary-foreground"
                                    onClick={handleCreateProject}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Project
                                </Button>
                            )}
                            <Button
                                variant="default"
                                onClick={() =>
                                    router.push(`/org/${props?.orgId}/traceability`)
                                }
                            >
                                <GitBranch className="h-4 w-4" />
                                Traceability
                            </Button>
                            {props.organization?.type !== 'personal' &&
                                hasOrganizationPermission(userRole, 'goToAiAnalysis') && (
                                    <Button
                                        variant="default"
                                        onClick={handleGoToAiAnalysis}
                                    >
                                        <Brain className="w-4 h-4" />
                                        AI Analysis
                                    </Button>
                                )}
                            {props.organization?.type === 'personal' && (
                                <Button
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition"
                                    onClick={props.onDemoClick}
                                >
                                    Try Demo
                                </Button>
                            )}
                        </div>
                    </div>
                    {props.projectsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : props.projects && props.projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-6">
                            {props.projects
                                .filter((project) =>
                                    project.name
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()),
                                )
                                .map((project) => (
                                    <Card
                                        key={project.id}
                                        className="transition-colors hover:bg-card-hover cursor-pointer"
                                        onClick={() => props.onProjectClick(project)}
                                    >
                                        <CardHeader>
                                            <div className="grid grid-cols-12 items-center ">
                                                <div className="col-span-10 pr-2.5">
                                                    {isEditingProject === project.id ? (
                                                        <div className="space-y-2">
                                                            <Input
                                                                value={editingProjectName}
                                                                onChange={(e) =>
                                                                    setEditingProjectName(
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter'
                                                                    ) {
                                                                        handleSaveProjectEdit(
                                                                            project,
                                                                        );
                                                                    } else if (
                                                                        e.key === 'Escape'
                                                                    ) {
                                                                        handleCancelProjectEdit();
                                                                    }
                                                                }}
                                                                className="text-lg font-semibold"
                                                                autoFocus
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSaveProjectEdit(
                                                                            project,
                                                                        );
                                                                    }}
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCancelProjectEdit();
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <CardTitle className="text-md font-semibold truncate">
                                                            {project.name}
                                                        </CardTitle>
                                                    )}
                                                </div>

                                                {/* 3-dot menu */}
                                                <div className="col-span-2 self-start justify-self-end">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <MoreVertical className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateProject(
                                                                        project,
                                                                    );
                                                                }}
                                                            >
                                                                <Copy className="h-4 w-4 mr-2" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditProject(
                                                                        project,
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteProject(
                                                                        project,
                                                                    );
                                                                }}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {isEditingProject !== project.id && (
                                            <CardContent>
                                                <p className="text-sm line-clamp-3 break-words h-[3.75rem]">
                                                    {project.description ||
                                                        'No description provided'}
                                                </p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg">
                            <FolderArchive className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">
                                No projects found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Get started by creating your first project
                            </p>
                            <Button
                                className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                                onClick={handleCreateProject}
                            >
                                Create Project
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <ExternalDocsPages />
                </TabsContent>

                <TabsContent value="invitations" className="space-y-6">
                    {props.organization?.type === 'enterprise' &&
                        hasOrganizationPermission(userRole, 'invitePeople') && (
                            <OrgInvitations orgId={props.orgId} />
                        )}
                </TabsContent>
            </Tabs>

            {/* AI Analysis Dialog */}
            {isAiAnalysisDialogOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border rounded-lg">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                            Select Project, Document, and Requirement
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Project
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            {selectedProjectId
                                                ? props.projects?.find(
                                                      (p) => p.id === selectedProjectId,
                                                  )?.name
                                                : 'Choose a project'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {props.projects?.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                onClick={() => {
                                                    setSelectedProjectId(project.id);
                                                    setSelectedDocumentId(null); // Reset document selection
                                                    setSelectedRequirementId(null); // Reset requirement selection
                                                }}
                                            >
                                                {project.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Document
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            {selectedDocumentId
                                                ? documents?.find(
                                                      (d) => d.id === selectedDocumentId,
                                                  )?.name
                                                : 'Choose a document'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {documents?.map((document) => (
                                            <DropdownMenuItem
                                                key={document.id}
                                                onClick={() => {
                                                    setSelectedDocumentId(document.id);
                                                    setSelectedRequirementId(null); // Reset requirement selection
                                                }}
                                            >
                                                {document.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Requirement
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            {selectedRequirementId
                                                ? requirements?.find(
                                                      (r) =>
                                                          r.id === selectedRequirementId,
                                                  )?.name
                                                : 'Choose a requirement'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {requirements?.map((requirement) => (
                                            <DropdownMenuItem
                                                key={requirement.id}
                                                onClick={() =>
                                                    setSelectedRequirementId(
                                                        requirement.id,
                                                    )
                                                }
                                            >
                                                {requirement.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                            <Button
                                variant="outline"
                                className="hover:bg-gray-100 dark:hover:bg-muted"
                                onClick={() => {
                                    setIsAiAnalysisDialogOpen(false);
                                    setSelectedProjectId(null);
                                    setSelectedDocumentId(null);
                                    setSelectedRequirementId(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80"
                                onClick={handleStartAnalysis}
                                disabled={!selectedProjectId || !selectedRequirementId}
                            >
                                Start Analysis
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CreatePanel
                isOpen={isCreatePanelOpen}
                onClose={() => setIsCreatePanelOpen(false)}
                showTabs="project"
                initialTab="project"
                organizationId={props.orgId}
            />
        </div>
    );
}
