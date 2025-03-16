import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ProjectPageSkeleton } from '@/components/custom/skeletons/ProjectPageSkeleton';
import { getQueryClient } from '@/lib/constants/queryClient';
import { fetchProjectData } from '@/lib/db/utils/prefetchData';
import { ProjectProvider } from '@/lib/providers/project.provider';
import { Project } from '@/types';

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        orgId: string;
        projectId: string;
    }>;
}

export default async function ProjectLayout({
    children,
    params,
}: ProjectLayoutProps) {
    const { orgId, projectId } = await params;

    if (!projectId) notFound();

    const queryClient = getQueryClient(); // Same instance as previous layouts

    try {
        // Fetch project data, documents, etc.
        const { project, documents } = await fetchProjectData(
            orgId,
            projectId,
            queryClient,
        );
        console.log('documents', documents);

        if (!project) notFound();

        return (
            <ProjectProvider initialProject={project as Project}>
                <Suspense fallback={<ProjectPageSkeleton />}>
                    {children}
                </Suspense>
            </ProjectProvider>
        );
    } catch (error) {
        console.error('Error in project layout:', error);
        return notFound();
    }
}
