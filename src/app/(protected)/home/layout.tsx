'use server';

import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';

// Loading component for the sidebar
function SidebarSkeleton() {
    return (
        <div className="w-64 h-screen bg-background border-r border-border animate-pulse">
            <div className="p-4 space-y-4">
                <div className="h-8 bg-muted rounded-md w-3/4"></div>
                <div className="space-y-2">
                    <div className="h-6 bg-muted rounded-md w-full"></div>
                    <div className="h-6 bg-muted rounded-md w-5/6"></div>
                    <div className="h-6 bg-muted rounded-md w-4/6"></div>
                </div>
            </div>
        </div>
    );
}

export default async function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = new QueryClient();
    const user = await getAuthUserServer();

    // Fetch organizations on the server side
    const organizations = await getUserOrganizationsServer(user.user.id);

    // Prefetch organizations for client components
    await queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.byMembership(user.user.id),
        queryFn: async () => {
            return organizations;
        },
    });

    // Add organizations to Next.js data for client components
    (
        queryClient as QueryClient & { organizations: typeof organizations }
    ).organizations = organizations;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
                <Suspense fallback={<SidebarSkeleton />}>
                    <Sidebar />
                </Suspense>
                <div className="relative flex-1 p-16">{children}</div>
                <VerticalToolbar />
            </SidebarProvider>
        </HydrationBoundary>
    );
}
