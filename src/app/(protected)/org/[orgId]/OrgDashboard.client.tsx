'use client';

import { Building, File, FileBox, FolderArchive, ListTodo } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSetOrgMemberCount } from '@/hooks/mutations/useOrgMemberMutation';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { ExternalDocument } from '@/types/base/documents.types';
import { Organization } from '@/types/base/organizations.types';
import { Project } from '@/types/base/projects.types';

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
    orgId: string;
}

export default function OrgDashboard(props: OrgDashboardProps) {
    const [activeTab, setActiveTab] = useState('projects');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const { mutateAsync: setOrgMemberCount } = useSetOrgMemberCount();

    useEffect(() => {
        if (props.orgId) {
            setOrgMemberCount(props.orgId).catch((error) => {
                console.error('Failed to refresh member count:', error);
            });
        }
    }, [props.orgId, setOrgMemberCount]);

    console.log('projects: ', props.projects);

    const handleCreateProject = () => {
        setIsCreatePanelOpen(true);
    };

    const openFile = async (documentId: string) => {
        if (!props.orgId) {
            alert('Organization ID is missing. Cannot open file.');
            return;
        }

        const filePath = `${props.orgId}/${documentId}`;
        const { data: publicUrl } = supabase.storage
            .from('external_documents')
            .getPublicUrl(filePath);

        if (publicUrl) {
            window.open(publicUrl.publicUrl, '_blank');
        } else {
            alert('Failed to get file URL. Please try again.');
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
                            ? 'grid-cols-6'
                            : 'grid-cols-5'
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
                        <span>Documents</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="collections"
                        className="flex items-center gap-2"
                    >
                        <FileBox className="h-4 w-4" />
                        <span>Collections</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="tasks"
                        className="flex items-center gap-2"
                    >
                        <ListTodo className="h-4 w-4" />
                        <span>Tasks</span>
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
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div
                                                className="bg-primary h-2.5 rounded-full"
                                                style={{
                                                    width: `${Math.min(((props.organization?.storage_used || 0) / 1000) * 100, 100)}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {props.organization
                                                    ?.storage_used || 0}{' '}
                                                MB used
                                            </span>
                                            <span>1000 MB total</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <OrgMembers />
                    </div>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Projects</h2>
                        <button
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                            onClick={handleCreateProject}
                        >
                            Create Project
                        </button>
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
                            {props.projects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() =>
                                        props.onProjectClick(project)
                                    }
                                >
                                    <CardHeader>
                                        <CardTitle>{project.name}</CardTitle>
                                        <CardDescription>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    project.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : project.status ===
                                                            'archived'
                                                          ? 'bg-gray-100 text-gray-800'
                                                          : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {project.status}
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
                            <button
                                className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                                onClick={handleCreateProject}
                            >
                                Create Project
                            </button>
                        </div>
                    )}
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                            Organization Documents
                        </h2>
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Upload Document
                        </button>
                    </div>

                    {props.documentsLoading ? (
                        <div className="text-center py-12 border rounded-lg">
                            <FileBox className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                            <h3 className="mt-4 text-lg font-medium">
                                Loading documents...
                            </h3>
                        </div>
                    ) : props.externalDocuments?.length ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {props.externalDocuments
                                    .sort((a, b) => {
                                        const dateA = a.created_at
                                            ? new Date(a.created_at).getTime()
                                            : 0;
                                        const dateB = b.created_at
                                            ? new Date(b.created_at).getTime()
                                            : 0;
                                        return dateB - dateA;
                                    })
                                    .map((doc) => (
                                        <Card
                                            key={doc.id}
                                            className={`border border-gray-300 ${
                                                props.theme === 'dark'
                                                    ? 'hover:bg-accent'
                                                    : 'hover:bg-gray-200'
                                            } cursor-pointer`}
                                            onClick={() => openFile(doc.id)}
                                        >
                                            <div className="p-4 flex items-center">
                                                <File className="w-4 h-4 mr-4" />
                                                <div>
                                                    <h3 className="text-sm font-semibold">
                                                        {doc.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">
                                                        {doc.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={props.onExternalDocsClick}
                                >
                                    Go to External Docs
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg">
                            <FileBox className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">
                                No documents found
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Upload documents to share with your organization
                            </p>
                            <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                                Upload Document
                            </button>
                        </div>
                    )}
                </TabsContent>

                {/* Collections Tab */}
                <TabsContent value="collections" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                            File Collections
                        </h2>
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Create Collection
                        </button>
                    </div>

                    <div className="text-center py-12 border rounded-lg">
                        <FolderArchive className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                            No collections found
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create collections to organize your files
                        </p>
                        <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Create Collection
                        </button>
                    </div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">User Tasks</h2>
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Create Task
                        </button>
                    </div>

                    <div className="text-center py-12 border rounded-lg">
                        <ListTodo className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                            No tasks found
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Create tasks to track your work
                        </p>
                        <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
                            Create Task
                        </button>
                    </div>
                </TabsContent>

                <TabsContent value="invitations" className="space-y-6">
                    {props.organization?.type === 'enterprise' ? (
                        <OrgInvitations orgId={props.orgId} />
                    ) : null}
                </TabsContent>
            </Tabs>

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
