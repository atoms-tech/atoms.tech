'use server';

import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';

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

    return <div className="relative flex-1">{children}</div>;
}
