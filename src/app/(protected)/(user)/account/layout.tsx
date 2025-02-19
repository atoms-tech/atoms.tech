'use server';

import Sidebar from '@/components/base/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import {
    HydrationBoundary,
    dehydrate,
    QueryClient,
} from '@tanstack/react-query';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';
import { queryKeys } from '@/lib/constants/queryKeys';

export default async function AccountLayout({
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
