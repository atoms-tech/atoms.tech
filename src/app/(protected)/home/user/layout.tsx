'use server';

import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';

export default async function UserDashboardLayout({
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

    // Make organizations available to client components
    (
        queryClient as QueryClient & { organizations: typeof organizations }
    ).organizations = organizations;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
        </HydrationBoundary>
    );
}
