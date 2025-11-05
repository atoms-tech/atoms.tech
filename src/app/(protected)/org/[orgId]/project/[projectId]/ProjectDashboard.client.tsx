'use client';

import {
    Beaker,
    Clock,
    Copy,
    FolderOpen,
    MoreVertical,
    PenTool,
    Pencil,
    Plus,
    PlusCircle,
    Trash,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import EditDocumentForm from '@/components/base/forms/EditDocumentForm';
import EditProjectForm from '@/components/base/forms/EditProjectForm';
import DuplicateDocumentModal from '@/components/base/modals/DuplicateDocumentModal';
import { Badge } from '@/components/ui/badge';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useDeleteProject } from '@/hooks/mutations/useProjectMutations';
import { useProjectDocuments } from '@/hooks/queries/useDocument';
import { useProjectMemberRole } from '@/hooks/queries/useProjectMember';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { ProjectRole, hasProjectPermission } from '@/lib/auth/permissions';
import { useProject } from '@/lib/providers/project.provider';
import { useUser } from '@/lib/providers/user.provider';
import { Document } from '@/types/base/documents.types';

import ProjectMembers from './ProjectMembers';

// Dynamically import the CreatePanel with no SSR
const CreatePanel = dynamic(
    () => import('@/components/base/panels/CreatePanel').then((mod) => mod.CreatePanel),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
                Loading...
            </div>
        ),
    },
);

export default function ProjectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams<{ orgId: string; projectId: string }>();
    const { project } = useProject();

    // Get current tab from URL params, default to 'documents' if not present
    const currentTabFromUrl = searchParams?.get('currentTab') || 'documents';
    const [activeTab, setActiveTab] = useState(currentTabFromUrl);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDocumentPanel, setShowCreateDocumentPanel] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const { user } = useUser();
    const [isDeleting, setIsDeleting] = useState(false);
    const { data: userRoleQuery } = useProjectMemberRole(
        params.projectId,
        user?.id || '',
    );
    const userRole: ProjectRole | null = userRoleQuery ?? null;
    const {
        data: documents,
        isLoading: documentsLoading,
        refetch,
    } = useProjectDocuments(project?.id || '');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { mutateAsync: deleteProject } = useDeleteProject();
    const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
    const [documentToDuplicate, setDocumentToDuplicate] = useState<Document | null>(null);
    const { getClientOrThrow } = useAuthenticatedSupabase();

    console.log(userRole, 'userRole');

    useEffect(() => {
        // Trigger refetch of users in ProjectMembers when the dashboard loads
        const projectMembersComponent = document.querySelector(
            '[data-component="ProjectMembers"]',
        );
        if (projectMembersComponent) {
            projectMembersComponent.dispatchEvent(new CustomEvent('refetch'));
        }
    }, []);

    const handleDocumentClick = (doc: Document) => {
        if (!hasProjectPermission(userRole, 'viewDocument')) {
            return; // Do nothing if the user does not have permission
        }
        router.push(
            `/org/${params?.orgId}/project/${params?.projectId}/documents/${doc.id}`,
        );
    };

    const handleEditDocument = (doc: Document) => {
        setDocumentToEdit(doc);
    };

    const handleDeleteDocument = async () => {
        if (!hasProjectPermission(userRole, 'deleteDocument')) {
            return; // Do nothing if the user does not have permission
        }

        if (!documentToDelete) return;

        try {
            const client = getClientOrThrow();
            setIsDeleting(true);

            // Delete requirements associated with the document
            const { error: requirementsError } = await client
                .from('requirements')
                .delete()
                .eq('document_id', documentToDelete.id);

            if (requirementsError) {
                console.error('Error deleting requirements:', requirementsError);
                throw requirementsError;
            }

            // Delete the document
            const { error: documentError } = await client
                .from('documents')
                .delete()
                .eq('id', documentToDelete.id);

            if (documentError) {
                console.error('Error deleting document:', documentError);
                throw documentError;
            }

            // Refresh documents list
            await refetch(); // Refetch documents to reflect changes
            setDocumentToDelete(null);
            setIsDeleting(false);
        } catch (error) {
            console.error('Error deleting document and requirements:', error);
            setIsDeleting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!project || !user) return;

        try {
            await deleteProject({
                projectId: project.id,
                userId: user.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Project deleted successfully',
            });

            // Navigate back to organization dashboard
            router.push(`/org/${params?.orgId}`);
        } catch (error) {
            console.error('Error deleting project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete project. Please try again.',
            });
        }
    };

    const sortedDocuments = [...(documents || [])].sort(() => {
        return 0;
    });

    const filteredDocuments = sortedDocuments.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Project Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {project?.name || 'Project Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {project?.description ||
                            'Manage your project resources and details'}
                    </p>
                </div>
            </div>

            {/* Tabs Menu */}
            <Tabs
                defaultValue={currentTabFromUrl}
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="9" y1="9" x2="15" y2="9" />
                            <line x1="9" y1="13" x2="15" y2="13" />
                            <line x1="9" y1="17" x2="13" y2="17" />
                        </svg>
                        <span>Requirements Documents</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div>
                                        <CardTitle>Project Details</CardTitle>
                                        <CardDescription>
                                            Basic information about your project
                                        </CardDescription>
                                    </div>
                                    {hasProjectPermission(userRole, 'editProject') &&
                                        !isEditing && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                </CardHeader>
                                <CardContent>
                                    {isEditing && project ? (
                                        <EditProjectForm
                                            project={project}
                                            onSuccess={() => setIsEditing(false)}
                                            onCancel={() => setIsEditing(false)}
                                            showDeleteConfirm={showDeleteConfirm}
                                            setShowDeleteConfirm={setShowDeleteConfirm}
                                        />
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Name:
                                                </span>
                                                <span className="font-medium">
                                                    {project?.name}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Status:
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        project?.status === 'active'
                                                            ? 'border-green-500 text-green-500'
                                                            : 'border-gray-500 text-gray-500'
                                                    }
                                                >
                                                    {project?.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Visibility:
                                                </span>
                                                <span className="font-medium">
                                                    {project?.visibility}
                                                </span>
                                            </div>
                                            {project?.description && (
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        Description:
                                                    </span>
                                                    <p className="mt-1">
                                                        {project.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <ProjectMembers
                                projectId={project?.id || ''}
                                data-component="ProjectMembers"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="flex items-center justify-between w-full gap-4">
                        <Input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-xs"
                        />
                        <div className="flex items-center gap-2">
                            {hasProjectPermission(userRole, 'addDocument') && (
                                <Button
                                    variant="outline"
                                    className="transition-colors hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setShowCreateDocumentPanel(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Requirement Document
                                </Button>
                            )}
                            <Button
                                variant="default"
                                onClick={() =>
                                    router.push(
                                        `/org/${params?.orgId}/project/${params?.projectId}/canvas`,
                                    )
                                }
                            >
                                <PenTool className="w-4 h-4" />
                                Canvas
                            </Button>
                            <Button
                                variant="default"
                                onClick={() =>
                                    router.push(
                                        `/org/${params?.orgId}/project/${params?.projectId}/testbed`,
                                    )
                                }
                            >
                                <Beaker className="h-4 w-4" />
                                Testbed
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Documents Grid View */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-fr">
                            {filteredDocuments?.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="group bg-card border border-border rounded-lg hover:bg-card-hover transition-all duration-300 overflow-hidden relative aspect-square flex flex-col"
                                    style={{
                                        boxShadow:
                                            '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    {/* Document paper effect shadow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-800/30 pointer-events-none"></div>

                                    <div
                                        className="flex flex-col h-full p-3 relative z-10 cursor-pointer"
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        {/* Header with Title and Actions */}
                                        <div className="flex items-start justify-between mb-3">
                                            {/* Document Title - Top Left */}
                                            <h3 className="text-sm font-semibold text-foreground transition-colors line-clamp-2 leading-tight flex-1 pr-2">
                                                {doc.name}
                                            </h3>

                                            {/* Actions Menu */}
                                            {(hasProjectPermission(
                                                userRole,
                                                'editDocument',
                                            ) ||
                                                hasProjectPermission(
                                                    userRole,
                                                    'deleteDocument',
                                                )) && (
                                                <div className="flex-shrink-0">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                            >
                                                                <MoreVertical className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-44"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {hasProjectPermission(
                                                                userRole,
                                                                'editDocument',
                                                            ) && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleEditDocument(
                                                                            doc,
                                                                        )
                                                                    }
                                                                    className="gap-3 py-2.5"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                    Edit Document
                                                                </DropdownMenuItem>
                                                            )}
                                                            {hasProjectPermission(
                                                                userRole,
                                                                'addDocument',
                                                            ) && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setDocumentToDuplicate(
                                                                            doc,
                                                                        )
                                                                    }
                                                                    className="gap-3 py-2.5"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                    Duplicate Document
                                                                </DropdownMenuItem>
                                                            )}
                                                            {hasProjectPermission(
                                                                userRole,
                                                                'deleteDocument',
                                                            ) && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive gap-3 py-2.5"
                                                                    onClick={() =>
                                                                        setDocumentToDelete(
                                                                            doc,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                    Delete Document
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>

                                        {/* Document Info */}
                                        <div className="flex-1 flex flex-col">
                                            {doc.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                                                    {doc.description}
                                                </p>
                                            )}

                                            {/* Document Metadata - Bottom */}
                                            <div className="mt-auto space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {doc.updated_at
                                                            ? new Date(
                                                                  doc.updated_at,
                                                              ).toLocaleDateString(
                                                                  'en-US',
                                                                  {
                                                                      month: 'short',
                                                                      day: 'numeric',
                                                                  },
                                                              )
                                                            : doc.created_at
                                                              ? new Date(
                                                                    doc.created_at,
                                                                ).toLocaleDateString(
                                                                    'en-US',
                                                                    {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    },
                                                                )
                                                              : 'N/A'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        {/* Status dot and text removed as per request */}
                                                    </div>
                                                    {doc.tags && doc.tags.length > 0 && (
                                                        <div className="text-xs text-primary font-medium truncate">
                                                            +{doc.tags.length}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredDocuments?.length === 0 && !documentsLoading && (
                            <div className="text-center py-16">
                                <div className="relative mx-auto mb-6">
                                    {/* Stacked empty documents */}
                                    <div className="w-20 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border border-dashed rounded-lg flex items-center justify-center mx-auto">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="40"
                                            height="40"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-black dark:text-white"
                                        >
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                            <path d="M10 9H8" />
                                            <path d="M16 13H8" />
                                            <path d="M16 17H8" />
                                        </svg>
                                    </div>
                                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-18 h-22 bg-gradient-to-br from-gray-50 to-gray-150 dark:from-gray-700 dark:to-gray-600 border border-dashed rounded-lg -z-10 opacity-50"></div>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No documents found
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Get started by creating your first requirement
                                    document to organize and manage your project
                                    requirements
                                </p>
                                {hasProjectPermission(userRole, 'addDocument') && (
                                    <Button
                                        variant="default"
                                        onClick={() => setShowCreateDocumentPanel(true)}
                                        className="gap-2 px-6 py-2.5"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Create Your First Document
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {showCreateDocumentPanel && (
                <CreatePanel
                    isOpen={true}
                    projectId={project?.id || ''}
                    onClose={() => setShowCreateDocumentPanel(false)}
                    showTabs="document"
                />
            )}

            {showDeleteConfirm && (
                <div className="mt-4 space-y-2">
                    <p className="text-red-500">
                        Are you sure you want to delete this project? This action cannot
                        be undone.
                    </p>
                    <div className="flex space-x-2">
                        <Button variant="destructive" onClick={handleDeleteProject}>
                            Delete Project
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {documentToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-background p-6 rounded-lg max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4">Delete Document</h2>
                        <p>
                            Are you sure you want to delete &ldquo;
                            {documentToDelete.name}&rdquo;? This action cannot be undone.
                        </p>
                        <div className="mt-4 flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setDocumentToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteDocument}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {documentToEdit && (
                <EditDocumentForm
                    document={documentToEdit}
                    isOpen={true}
                    onClose={() => setDocumentToEdit(null)}
                    onDelete={() => {
                        setDocumentToDelete(documentToEdit);
                        setDocumentToEdit(null);
                    }}
                    canDelete={hasProjectPermission(userRole, 'deleteDocument')}
                />
            )}

            {documentToDuplicate && user?.id && params?.orgId && (
                <DuplicateDocumentModal
                    document={documentToDuplicate}
                    isOpen={true}
                    onClose={() => setDocumentToDuplicate(null)}
                    organizationId={params.orgId}
                    userId={user.id}
                />
            )}
        </div>
    );
}
