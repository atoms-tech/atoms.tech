'use client';

import { FileBox, FolderArchive, Trash } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
            ],
            admin: [
                'removeMember',
                'addDocument',
                'viewDocument',
                'deleteDocument',
                'editDocument',
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
                        <span>Documents</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Details</CardTitle>
                                    <CardDescription>
                                        Basic information about your project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
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
                    <div className="flex items-center space-x-2">
                        <div className="flex w-full md:w-auto space-x-2">
                            <Input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                            />
                            {canPerformAction('addDocument') && (
                                <Button
                                    variant="default"
                                    onClick={() =>
                                        setShowCreateDocumentPanel(true)
                                    }
                                >
                                    Add Requirement Document
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="default"
                            onClick={() => setShowCreateDocumentPanel(true)}
                        >
                            Add Requirement Document
                        </Button>
                        <Button
                            variant="default"
                            onClick={() =>
                                router.push(
                                    `/org/${params?.orgId}/project/${params?.projectId}/testbed`,
                                )
                            }
                        >
                            Access Testbed
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments?.map((doc) => (
                            <div
                                key={doc.id}
                                className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors relative"
                            >
                                <h3
                                    className="font-medium truncate"
                                    onClick={() => handleDocumentClick(doc)}
                                >
                                    {doc.name}
                                </h3>
                                {doc.description && (
                                    <p
                                        className="text-sm text-muted-foreground line-clamp-2 mt-1"
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        {doc.description}
                                    </p>
                                )}
                                {canPerformAction('deleteDocument') && (
                                    <button
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                                        onClick={() => setDocumentToDelete(doc)}
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                )}
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

            {/* Delete Confirmation Modal */}
            {documentToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border border-gray-300 dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                            Confirm Deletion
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Are you sure you want to delete the document{' '}
                            <span className="font-medium">
                                {documentToDelete.name}
                            </span>
                            ? This will also delete all requirements associated
                            with this document.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                                onClick={() => setDocumentToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-500 text-white hover:bg-red-600"
                                onClick={handleDeleteDocument}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
