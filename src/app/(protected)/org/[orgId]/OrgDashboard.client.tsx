'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Brain,
    Building,
    FileBox,
    Folder,
    FolderArchive,
    ListTodo,
    PenTool,
} from 'lucide-react';
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
import { useSetOrgMemberCount } from '@/hooks/mutations/useOrgMemberMutation';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { supabase } from '@/lib/supabase/supabaseBrowser';
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
    const [activeTab, setActiveTab] = useState('projects');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState<string | null>(
        null,
    );
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [totalUsage, setTotalUsage] = useState(0); // Track total usage
    const { mutateAsync: setOrgMemberCount } = useSetOrgMemberCount();

    const [isAiAnalysisDialogOpen, setIsAiAnalysisDialogOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null,
    );
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
        null,
    );
    const [selectedRequirementId, setSelectedRequirementId] = useState<
        string | null
    >(null);

    const { data: documents } = useQuery({
        queryKey: ['documents', selectedProjectId],
        queryFn: async () => {
            if (!selectedProjectId) return [];
            const { data, error } = await supabase
                .from('documents')
                .select('id, name')
                .eq('project_id', selectedProjectId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedProjectId,
    });

    const { data: requirements } = useQuery({
        queryKey: ['requirements', selectedDocumentId],
        queryFn: async () => {
            if (!selectedDocumentId) return [];
            const { data, error } = await supabase
                .from('requirements')
                .select('id, name')
                .eq('document_id', selectedDocumentId);
            if (error) throw error;
            return data || [];
        },
        enabled: !!selectedDocumentId,
    });

    // Fetch external documents to calculate total usage
    const { data: externalDocuments } = useExternalDocumentsByOrg(
        props.orgId || '',
    );

    useEffect(() => {
        if (externalDocuments) {
            const usage = externalDocuments.reduce(
                (sum, file) => sum + (file.size || 0),
                0,
            );
            setTotalUsage(usage);
        }
    }, [externalDocuments]);

    useEffect(() => {
        if (props.orgId) {
            setOrgMemberCount(props.orgId).catch((error) => {
                console.error('Failed to refresh member count:', error);
            });
        }
    }, [props.orgId, setOrgMemberCount]);

    const handleCreateProject = () => {
        setIsCreatePanelOpen(true);
    };

    const handleGoToCanvas = () => {
        if (props.orgId) {
            window.location.href = `/org/${props.orgId}/canvas`;
        }
    };

    const handleGoToAiAnalysis = () => {
        setIsAiAnalysisDialogOpen(true);
    };

    const handleStartAnalysis = () => {
        if (selectedProjectId && selectedRequirementId) {
            window.location.href = `/org/${props.orgId}/project/${selectedProjectId}/requirements/${selectedRequirementId}`;
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
                defaultValue="projects"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList
                    className={`grid ${
                        props.organization?.type === 'enterprise'
                            ? 'grid-cols-4'
                            : 'grid-cols-3'
                    } w-full`}
                >
                    <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2"
                    >
                        <Building className="h-4 w-4" />
                        <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="projects"
                        className="flex items-center gap-2"
                    >
                        <FolderArchive className="h-4 w-4" />
                        <span>Projects</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2"
                    >
                        <FileBox className="h-4 w-4" />
                        <span>Requirements Documents</span>
                    </TabsTrigger>
                    {props.organization?.type === 'enterprise' && (
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
                                        Basic information about your
                                        organization
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
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Name:
                                                </span>
                                                <span className="font-medium">
                                                    {props.organization?.name}
                                                </span>
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
                                                    {props.organization
                                                        ?.member_count || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Plan:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        props.organization
                                                            ?.billing_plan
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Storage Usage</CardTitle>
                                    <CardDescription>
                                        Current storage utilization
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
                                            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                                                <div
                                                    className="bg-primary h-2.5 rounded-full"
                                                    style={{
                                                        width: `${Math.min(
                                                            (totalUsage /
                                                                (1000 *
                                                                    1024 *
                                                                    1024)) *
                                                                100, // Convert bytes to MB and calculate percentage
                                                            100,
                                                        )}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>
                                                    {(
                                                        totalUsage /
                                                        1024 /
                                                        1024
                                                    ).toFixed(2)}{' '}
                                                    MB used
                                                </span>
                                                <span>1000 MB total</span>
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
                    <div className="flex items-center space-x-2">
                        <div className="flex w-full md:w-auto space-x-2">
                            <Input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="w-9 h-9"
                                    >
                                        <FolderArchive className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                        onClick={() =>
                                            setVisibilityFilter(null)
                                        }
                                    >
                                        <span
                                            className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                visibilityFilter === null
                                                    ? 'bg-primary'
                                                    : 'bg-gray-200'
                                            }`}
                                        ></span>
                                        All Visibility
                                    </DropdownMenuItem>
                                    {[
                                        'private',
                                        'team',
                                        'organization',
                                        'public',
                                    ].map((visibility) => (
                                        <DropdownMenuItem
                                            key={visibility}
                                            onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                            onClick={() =>
                                                setVisibilityFilter(
                                                    visibilityFilter ===
                                                        visibility
                                                        ? null
                                                        : visibility,
                                                )
                                            }
                                        >
                                            <span
                                                className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                    visibilityFilter ===
                                                    visibility
                                                        ? 'bg-primary'
                                                        : 'bg-gray-200'
                                                }`}
                                            ></span>
                                            {visibility
                                                .charAt(0)
                                                .toUpperCase() +
                                                visibility.slice(1)}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                        onClick={() => setStatusFilter(null)}
                                    >
                                        <span
                                            className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                statusFilter === null
                                                    ? 'bg-primary'
                                                    : 'bg-gray-200'
                                            }`}
                                        ></span>
                                        All Status
                                    </DropdownMenuItem>
                                    {[
                                        'active',
                                        'archived',
                                        'draft',
                                        'deleted',
                                    ].map((status) => (
                                        <DropdownMenuItem
                                            key={status}
                                            onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                            onClick={() =>
                                                setStatusFilter(
                                                    statusFilter === status
                                                        ? null
                                                        : status,
                                                )
                                            }
                                        >
                                            <span
                                                className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                    statusFilter === status
                                                        ? 'bg-primary'
                                                        : 'bg-gray-200'
                                                }`}
                                            ></span>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Button
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                            onClick={handleCreateProject}
                        >
                            Create Project
                            <Folder className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                            onClick={handleGoToCanvas}
                        >
                            Canvas
                            <PenTool className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                            onClick={handleGoToAiAnalysis}
                        >
                            AI Analysis
                            <Brain className="w-4 h-4" />
                        </Button>
                        {props.organization?.type === 'personal' && (
                            <Button
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition"
                                onClick={props.onDemoClick}
                            >
                                Try Demo
                            </Button>
                        )}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {props.projects
                                .filter(
                                    (project) =>
                                        project.name
                                            .toLowerCase()
                                            .includes(
                                                searchQuery.toLowerCase(),
                                            ) &&
                                        (!visibilityFilter ||
                                            project.visibility ===
                                                visibilityFilter) &&
                                        (!statusFilter ||
                                            project.status === statusFilter),
                                )
                                .map((project) => (
                                    <Card
                                        key={project.id}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() =>
                                            props.onProjectClick(project)
                                        }
                                    >
                                        <CardHeader>
                                            <CardTitle>
                                                {project.name}
                                            </CardTitle>
                                            <CardDescription>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        project.status ===
                                                        'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : project.status ===
                                                                'archived'
                                                              ? 'bg-gray-100 text-gray-800'
                                                              : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {project.status}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                                        project.visibility ===
                                                        'private'
                                                            ? 'bg-red-100 text-red-800'
                                                            : project.visibility ===
                                                                'team'
                                                              ? 'bg-blue-100 text-blue-800'
                                                              : project.visibility ===
                                                                  'organization'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : project.visibility ===
                                                                    'public'
                                                                  ? 'bg-green-100 text-green-800'
                                                                  : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {project.visibility}
                                                </span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {project.description ||
                                                    'No description provided'}
                                            </p>
                                        </CardContent>
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
                    {props.organization?.type === 'enterprise' ? (
                        <OrgInvitations orgId={props.orgId} />
                    ) : null}
                </TabsContent>
            </Tabs>

            {/* AI Analysis Dialog */}
            {isAiAnalysisDialogOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border border-gray-300 dark:border-gray-700 rounded-lg">
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
                                                      (p) =>
                                                          p.id ===
                                                          selectedProjectId,
                                                  )?.name
                                                : 'Choose a project'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {props.projects?.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                onClick={() => {
                                                    setSelectedProjectId(
                                                        project.id,
                                                    );
                                                    setSelectedDocumentId(null); // Reset document selection
                                                    setSelectedRequirementId(
                                                        null,
                                                    ); // Reset requirement selection
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
                                                      (d) =>
                                                          d.id ===
                                                          selectedDocumentId,
                                                  )?.name
                                                : 'Choose a document'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {documents?.map((document) => (
                                            <DropdownMenuItem
                                                key={document.id}
                                                onClick={() => {
                                                    setSelectedDocumentId(
                                                        document.id,
                                                    );
                                                    setSelectedRequirementId(
                                                        null,
                                                    ); // Reset requirement selection
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
                                                          r.id ===
                                                          selectedRequirementId,
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
                                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
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
                                disabled={
                                    !selectedProjectId || !selectedRequirementId
                                }
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
