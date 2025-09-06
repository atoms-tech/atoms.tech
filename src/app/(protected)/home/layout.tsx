'use server';

import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiServer } from '@/lib/atoms-api/server';

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
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

    // Add organizations to Next.js data for client components
    (queryClient as QueryClient & { organizations: typeof organizations }).organizations =
        organizations;

    return <div className="relative flex-1">{children}</div>;
}
