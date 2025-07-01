'use client';

import {
    BarChart3,
    Beaker,
    FileBox,
    FolderArchive,
    Pencil,
    PlusCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import EditDocumentForm from '@/components/base/forms/EditDocumentForm';
import EditProjectForm from '@/components/base/forms/EditProjectForm';
import DocumentActions from '@/components/custom/DocumentActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useDeleteProject } from '@/hooks/mutations/useProjectMutations';
import { useProjectDocuments } from '@/hooks/queries/useDocument';
import { useProject } from '@/lib/providers/project.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Document } from '@/types/base/documents.types';

import ProjectMembers from './ProjectMembers';

// Dynamically import the CreatePanel with no SSR
const CreatePanel = dynamic(
    () =>
        import('@/components/base/panels/CreatePanel').then(
            (mod) => mod.CreatePanel,
        ),
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
    const params = useParams<{ orgId: string; projectId: string }>();
    const { project } = useProject();
    const [activeTab, setActiveTab] = useState('documents');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDocumentPanel, setShowCreateDocumentPanel] =
        useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
        null,
    );
    const { user } = useUser();
    const [isDeleting, setIsDeleting] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const {
        data: documents,
        isLoading: documentsLoading,
        refetch,
    } = useProjectDocuments(project?.id || '');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { mutateAsync: deleteProject } = useDeleteProject();
    const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);

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

    useEffect(() => {
        const fetchUserRole = async () => {
            const projectId = params?.projectId || ''; // Extract project_id from the URL
            if (!projectId || !user?.id) return;

            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return;
            }

            setUserRole(data?.role || null);
        };

        fetchUserRole();
    }, [params?.projectId, user?.id]);

    const canPerformAction = (action: string) => {
        const rolePermissions = {
            owner: [
                'changeRole',
                'removeMember',
                'addDocument',
                'viewDocument',
                'deleteDocument',
                'editDocument',
                'editProject',
                'deleteProject',
            ],
            admin: [
                'removeMember',
                'addDocument',
                'viewDocument',
                'deleteDocument',
                'editDocument',
                'editProject',
            ],
            maintainer: ['addDocument', 'viewDocument', 'editDocument'],
            editor: ['addDocument', 'viewDocument', 'editDocument'],
            viewer: ['viewDocument'],
        };

        return rolePermissions[
            (userRole as keyof typeof rolePermissions) || 'viewer'
        ].includes(action);
    };

    const handleDocumentClick = (doc: Document) => {
        if (!canPerformAction('viewDocument')) {
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
        if (!canPerformAction('deleteDocument')) {
            return; // Do nothing if the user does not have permission
        }

        if (!documentToDelete) return;

        try {
            setIsDeleting(true);

            // Delete requirements associated with the document
            const { error: requirementsError } = await supabase
                .from('requirements')
                .delete()
                .eq('document_id', documentToDelete.id);

            if (requirementsError) {
                console.error(
                    'Error deleting requirements:',
                    requirementsError,
                );
                throw requirementsError;
            }

            // Delete the document
            const { error: documentError } = await supabase
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

    const handleGoToAnalytics = () => {
        router.push(
            `/org/${params?.orgId}/project/${params?.projectId}/analytics`,
        );
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
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="bg-secondary text-secondary-foreground text-sm hover:bg-secondary/90"
                        onClick={handleGoToAnalytics}
                    >
                        Analytics
                        <BarChart3 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs Menu */}
            <Tabs
                defaultValue="document"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2"
                    >
                        <FolderArchive className="h-4 w-4" />
                        <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2"
                    >
                        <FileBox className="h-4 w-4" />
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
                                    {canPerformAction('editProject') &&
                                        !isEditing && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                </CardHeader>
                                <CardContent>
                                    {isEditing && project ? (
                                        <EditProjectForm
                                            project={project}
                                            onSuccess={() =>
                                                setIsEditing(false)
                                            }
                                            onCancel={() => setIsEditing(false)}
                                            showDeleteConfirm={
                                                showDeleteConfirm
                                            }
                                            setShowDeleteConfirm={
                                                setShowDeleteConfirm
                                            }
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
                                                        project?.status ===
                                                        'active'
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
                            {canPerformAction('addDocument') && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setShowCreateDocumentPanel(true)
                                    }
                                    className="gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    New Requirement Document
                                </Button>
                            )}
                            <Button
                                variant="default"
                                onClick={() =>
                                    router.push(
                                        `/org/${params?.orgId}/project/${params?.projectId}/testbed`,
                                    )
                                }
                                className="gap-2"
                            >
                                <Beaker className="h-4 w-4" />
                                Access Testbed
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments?.map((doc) => (
                            <div
                                key={doc.id}
                                className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors relative group"
                            >
                                <div className="flex justify-between items-start">
                                    <div
                                        className="flex-1 min-w-0"
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <h3 className="font-medium truncate">
                                            {doc.name}
                                        </h3>
                                        {doc.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {doc.description}
                                            </p>
                                        )}
                                    </div>
                                    <DocumentActions
                                        document={doc}
                                        userRole={userRole || 'viewer'}
                                        onEdit={() => handleEditDocument(doc)}
                                        onDelete={() =>
                                            setDocumentToDelete(doc)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                        {filteredDocuments?.length === 0 &&
                            !documentsLoading && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No documents found
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
                        Are you sure you want to delete this project? This
                        action cannot be undone.
                    </p>
                    <div className="flex space-x-2">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                        >
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
                        <h2 className="text-xl font-semibold mb-4">
                            Delete Document
                        </h2>
                        <p>
                            Are you sure you want to delete &ldquo;
                            {documentToDelete.name}&rdquo;? This action cannot
                            be undone.
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
                    canDelete={canPerformAction('deleteDocument')}
                />
            )}
        </div>
    );
}
