import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import { queryKeys } from '@/lib/constants/queryKeys';
import {
    getProjectByIdServer,
    getProjectDocumentsServer,
} from '@/lib/db/server';
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
    const { projectId } = await params;

    if (!projectId) {
        notFound();
    }

    const queryClient = new QueryClient();
    let project: Project | null = null;

    try {
        project = await getProjectByIdServer(projectId);
        if (!project) {
            notFound();
        }

        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: queryKeys.projects.detail(project?.id || ''),
                queryFn: async () => project,
            }),
            queryClient.prefetchQuery({
                queryKey: queryKeys.documents.byProject(project?.id || ''),
                queryFn: async () => {
                    return await getProjectDocumentsServer(project?.id || '');
                },
            }),
        ]);
    } catch (error) {
        console.error('Error fetching project data:', error);
        notFound();
    }

    return (
        <ProjectProvider initialProject={project}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <div>{children}</div>
            </HydrationBoundary>
        </ProjectProvider>
    );
}
