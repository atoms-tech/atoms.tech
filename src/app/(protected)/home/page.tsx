import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import HomePage from '@/components/custom/HomePage/HomePage.client';
import { HomePageSkeleton } from '@/components/custom/HomePage/HomePageSkeleton';
import LayoutView from '@/components/views/LayoutView';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getAuthUserServer, getUserOrganizationsServer } from '@/lib/db/server';
import {
    getUserProjectsAcrossOrgsServer,
    getUserRecentActivityPaginatedServer,
    getUserRecentActivityServer,
} from '@/lib/db/server/home.server';

export default async function HomePageRoute() {
    const queryClient = new QueryClient();
    const user = await getAuthUserServer();
    const userId = user.user.id;

    // Fetch all data in parallel for better performance
    const [organizations, projects, recentActivityData] =
        await Promise.all([
            getUserOrganizationsServer(userId),
            getUserProjectsAcrossOrgsServer(userId),
            getUserRecentActivityPaginatedServer(userId, 8), // Start with 8 items
        ]);

    // Prefetch data for client components
    await queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.byMembership(userId),
        queryFn: async () => organizations,
    });

    await queryClient.prefetchQuery({
        queryKey: ['home', 'projects', userId],
        queryFn: async () => projects,
    });

    await queryClient.prefetchQuery({
        queryKey: ['home', 'recent-activity', userId],
        queryFn: async () => recentActivityData,
    });


    return (
        <LayoutView>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<HomePageSkeleton />}>
                    <HomePage
                        initialProjects={projects}
                        initialRecentActivity={recentActivityData.activities}
                        initialRecentActivityData={recentActivityData}
                        organizations={organizations}
                        userId={userId}
                    />
                </Suspense>
            </HydrationBoundary>
        </LayoutView>
    );
}
