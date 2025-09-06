'use server';

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiServer } from '@/lib/atoms-api/server';

export default async function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = new QueryClient();
    const api = await atomsApiServer();
    const user = await api.auth.getUser();
    const organizations = await api.organizations.listForUser(user?.id || '');

    // Prefetch organizations for client components
    await queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.byMembership(user?.id || ''),
        queryFn: async () => {
            return organizations;
        },
    });

    // Make organizations available to client components
    (queryClient as QueryClient & { organizations: typeof organizations }).organizations =
        organizations;

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    );
}
