'use client';

import { File } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';

import DashboardView, { Column } from '@/components/base/DashboardView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useUserProjects } from '@/hooks/queries/useProject';
import { useUser } from '@/lib/providers/user.provider';
import { useContextStore } from '@/lib/store/context.store';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Project } from '@/types';

export default function OrgDashboard() {
    // Navigation hooks
    const router = useRouter();
    const params = useParams<{ orgId: string }>();

    // User context hooks
    const { profile } = useUser();
    const { setCurrentProjectId } = useContextStore();
    const { data: projects, isLoading: projectsLoading } = useUserProjects(
        profile?.id || '',
        profile?.current_organization_id || '',
    );

    const { data: documents, isLoading: documentsLoading } =
        useExternalDocumentsByOrg(params?.orgId || '');
    const { theme } = useTheme();

    const columns: Column<Project>[] = [
        {
            header: 'Name',
            accessor: (item: Project) => item.name,
        },
        {
            header: 'Status',
            accessor: (item: Project) => item.status || 'N/A',
        },
    ];

    const handleRowClick = (item: Project) => {
        setCurrentProjectId(item.id);
        router.push(`/org/${params?.orgId}/${item.id}`);
    };

    const handleExternalDocsClick = () => {
        router.push(`/org/${params?.orgId}/externalDocs`);
    };

    const openFile = async (documentId: string) => {
        if (!params?.orgId) {
            alert('Organization ID is missing. Cannot open file.');
            return;
        }

        const filePath = `${params.orgId}/${documentId}`;

        // Get a public URL for the file from Supabase storage
        const { data: publicUrl } = supabase.storage
            .from('external_documents')
            .getPublicUrl(filePath);

        // Open the file in a new tab
        if (publicUrl) {
            window.open(publicUrl.publicUrl, '_blank');
        } else {
            alert('Failed to get file URL. Please try again.');
        }
    };

    return (
        <div className="container p-6">
            <h1 className="text-xl font-medium">Projects</h1>
            <DashboardView
                data={projects || []}
                columns={columns}
                isLoading={projectsLoading}
                emptyMessage="No projects found."
                onRowClick={handleRowClick}
            />
            <div className="project-documents mt-8">
                <h2 className="text-xl font-medium mb-4">
                    Document Collection
                </h2>
                <div className="recent-documents mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-start">
                    {documentsLoading ? (
                        <p>Loading recent documents...</p>
                    ) : documents?.length ? (
                        documents
                            .sort(
                                (a, b) =>
                                    new Date(b.created_at).getTime() -
                                    new Date(a.created_at).getTime(),
                            )
                            .slice(0, 3)
                            .map((doc) => (
                                <Card
                                    key={doc.id}
                                    className={`border border-gray-300 ${
                                        theme === 'dark'
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
                            ))
                    ) : (
                        <p>No recent documents available.</p>
                    )}
                </div>
                <Button variant="secondary" onClick={handleExternalDocsClick}>
                    Go to External Docs
                </Button>
            </div>
        </div>
    );
}
