'use server';

import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';

import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = new QueryClient();
    const user = await getAuthUserServer();
    await queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.all,
        queryFn: async () => {
            return await getUserOrganizationsServer(user.user.id);
        },
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SidebarProvider>
                <Sidebar />
                <div className="relative flex-1 p-16">{children}</div>
                <VerticalToolbar />
            </SidebarProvider>
        </HydrationBoundary>
    );
}
