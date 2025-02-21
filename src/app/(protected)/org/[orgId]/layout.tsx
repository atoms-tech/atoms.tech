import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { notFound } from 'next/navigation';

import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserProjectsServer } from '@/lib/db/server';

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
        await queryClient.prefetchQuery({
            queryKey: queryKeys.projects.byOrganization(orgId),
            queryFn: async () => {
                return await getUserProjectsServer(user?.user.id || '', orgId);
            },
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
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
