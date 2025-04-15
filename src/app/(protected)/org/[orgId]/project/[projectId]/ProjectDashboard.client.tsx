'use client';

// Dynamic import to avoid loading the CreatePanel until needed
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProjectDocuments } from '@/hooks/queries/useDocument';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useProject } from '@/lib/providers/project.provider';
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
    const { currentOrganization: _currentOrganization } = useOrganization();
    const [showCreateDocumentPanel, setShowCreateDocumentPanel] =
        useState(false);
    const { data: documents, isLoading: documentsLoading } =
        useProjectDocuments(params.projectId);

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
                            No documents found
                        </div>
                    )}
                </div>
            </div>

            {/* Project Management */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Project Management</h2>
                <ProjectMembers projectId={params.projectId} />
            </div>
            {showCreateDocumentPanel && (
                <CreatePanel
                    isOpen={true}
                    projectId={project?.id || ''}
                    onClose={() => setShowCreateDocumentPanel(false)}
                    showTabs="document"
                />
            )}
        </div>
    );
}
