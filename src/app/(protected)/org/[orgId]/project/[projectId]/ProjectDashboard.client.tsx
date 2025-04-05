'use client';

// import { useQuery } from '@tanstack/react-query';
// import { useCookies } from 'next-client-cookies';
import { PenTool } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { setCookie as _setCookie } from '@/app/(protected)/org/actions';
// import DashboardView, { Column } from '@/components/base/DashboardView';
import { CreatePanel } from '@/components/base/panels/CreatePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProjectDocuments } from '@/hooks/queries/useDocument';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useProject } from '@/lib/providers/project.provider';
// import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Document } from '@/types/base/documents.types';

// import { Requirement } from '@/types/base/requirements.types';

export default function ProjectPage() {
    const router = useRouter();
    // const _cookies = useCookies();
    const params = useParams<{ orgId: string; projectId: string }>();
    const { project } = useProject();
    const { currentOrganization: _currentOrganization } = useOrganization();
    const [showCreateDocumentPanel, setShowCreateDocumentPanel] =
        useState(false);
    const { data: documents, isLoading: documentsLoading } =
        useProjectDocuments(params.projectId);

    // const { data: requirements, isLoading: requirementsLoading } = useQuery({
    //     queryKey: ['requirements', params.projectId],
    //     queryFn: async () => {
    //         // Get all documents belonging to the project
    //         const { data: docIds } = await supabase
    //             .from('documents')
    //             .select('id')
    //             .eq('project_id', params.projectId);

    //         console.log('Documents', docIds);

    //         // If no documents found, return empty array
    //         if (!docIds?.length) {
    //             return [];
    //         }

    //         // Get last 5 modified requirements belonging to the documents
    //         const { data: requirements } = await supabase
    //             .from('requirements')
    //             .select('*')
    //             .in(
    //                 'document_id',
    //                 docIds.map((doc) => doc.id),
    //             )
    //             .order('updated_at', { ascending: false })
    //             .limit(5);

    //         console.log('Requirements', requirements);

    //         if (!requirements) {
    //             return [];
    //         }

    //         return requirements;
    //     },
    // });

    // const columns: Column<Requirement>[] = [
    //     {
    //         header: 'Name',
    //         accessor: (item: Requirement) => item.name,
    //     },
    //     {
    //         header: 'Priority',
    //         accessor: (item: Requirement) => item.priority,
    //         renderCell: (item: Requirement) => (
    //             <Badge
    //                 variant="outline"
    //                 className={
    //                     item.priority === 'high'
    //                         ? 'border-red-500 text-red-500'
    //                         : item.priority === 'medium'
    //                           ? 'border-yellow-500 text-yellow-500'
    //                           : 'border-blue-500 text-blue-500'
    //                 }
    //             >
    //                 {item.priority}
    //             </Badge>
    //         ),
    //     },
    //     {
    //         header: 'Status',
    //         accessor: (item: Requirement) => item.status,
    //         renderCell: (item: Requirement) => (
    //             <Badge
    //                 variant="outline"
    //                 className={
    //                     item.status === 'active'
    //                         ? 'border-green-500 text-green-500'
    //                         : item.status === 'draft'
    //                           ? 'border-gray-500 text-gray-500'
    //                           : 'border-yellow-500 text-yellow-500'
    //                 }
    //             >
    //                 {item.status}
    //             </Badge>
    //         ),
    //     },
    //     {
    //         header: 'Format',
    //         accessor: (item: Requirement) => item.format,
    //     },
    // ];

    // const handleRowClick = (item: Requirement) => {
    //     router.push(
    //         `/org/${params.orgId}/project/${params.projectId}/requirements/${item.id}`,
    //     );
    // };

    const handleGoToCanvas = () => {
        router.push(`/org/${params.orgId}/project/${params.projectId}/canvas`);
    };

    const handleDocumentClick = (doc: Document) => {
        router.push(
            `/org/${params.orgId}/project/${params.projectId}/documents/${doc.id}`,
        );
    };

    const isLoading = documentsLoading;

    return (
        <div className="p-6 space-y-8">
            {/* Project Details */}
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">{project?.name}</h1>
                {project?.description && (
                    <p className="text-muted-foreground">
                        {project.description}
                    </p>
                )}
                <div className="flex items-center gap-2">
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
                    <Badge variant="outline">{project?.visibility}</Badge>
                </div>
            </div>

            <div className="space-y-4">
                <Button
                    variant="outline"
                    className="bg-primary text-primary-foreground text-md hover:bg-primary/90"
                    onClick={handleGoToCanvas}
                >
                    Go to Canvas
                    <PenTool className="w-4 h-4 ml-2" />
                </Button>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Requirement Documents
                    </h2>
                    <Button
                        variant="outline"
                        onClick={() => setShowCreateDocumentPanel(true)}
                    >
                        Add Requirement Document
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents?.map((doc) => (
                        <div
                            key={doc.id}
                            className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                            onClick={() => handleDocumentClick(doc)}
                        >
                            <h3 className="font-medium truncate">{doc.name}</h3>
                            {doc.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {doc.description}
                                </p>
                            )}
                        </div>
                    ))}
                    {documents?.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            No documents found. Create a new requirement
                            document to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Requirements List */}
            {/* <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                    Recently Modified Requirements
                </h2>
                <DashboardView
                    data={requirements || []}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    emptyMessage="Create a new requirement document to get started"
                />
            </div> */}
            {showCreateDocumentPanel && (
                <CreatePanel
                    isOpen={showCreateDocumentPanel}
                    projectId={project?.id || ''}
                    onClose={() => setShowCreateDocumentPanel(false)}
                    showTabs="document"
                />
            )}
        </div>
    );
}
