import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
    getAuthUserServer,
    getUserOrganizationsServer,
    getUserProjectsServer,
} from '@/lib/db/server';

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { orgId } = await params;

    if (!orgId) {
        notFound();
    }

    const queryClient = new QueryClient();
    const user = await getAuthUserServer();

    try {
        // Check if we already have organization data in the cache
        // If not, fetch it
        const orgQueryKey = queryKeys.organizations.detail(orgId);
        const organization = queryClient.getQueryData(orgQueryKey);

        if (!organization) {
            // Prefetch organization data
            await queryClient.prefetchQuery({
                queryKey: orgQueryKey,
                queryFn: async () => {
                    const organizations = await getUserOrganizationsServer(
                        user?.user.id || '',
                    );
                    const organization = organizations.find(
                        (org) => org.id === orgId,
                    );
                    if (!organization) notFound();
                    return organization;
                },
            });
        }

        // Check if we already have projects data in the cache
        // If not, fetch it
        const projectsQueryKey = queryKeys.projects.byOrganization(orgId);
        const projects = queryClient.getQueryData(projectsQueryKey);

        if (!projects) {
            // Prefetch projects data
            await queryClient.prefetchQuery({
                queryKey: projectsQueryKey,
                queryFn: async () => {
                    return await getUserProjectsServer(
                        user?.user.id || '',
                        orgId,
                    );
                },
            });
        }
    } catch (error) {
        console.error('Error prefetching data:', error);
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
                <Sidebar />
                <div className="relative flex-1 p-16">
                    {children}
                    <VerticalToolbar />
                </div>
            </SidebarProvider>
        </HydrationBoundary>
    );
}
