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

export default async function HomePageRoute() {
    try {
        const queryClient = new QueryClient();
        const user = await getAuthUserServer();
        const userId = user.user.id;

        // Only fetch essential data on server-side to prevent timeouts
        // Fetch organizations first as they're needed for navigation
        const organizations = await getUserOrganizationsServer(userId);

        // Prefetch organizations for client components
        await queryClient.prefetchQuery({
            queryKey: queryKeys.organizations.byMembership(userId),
            queryFn: async () => organizations,
        });

        // Set empty initial data - client will fetch these
        const projects: any[] = [];
        const recentActivityData = {
            activities: [],
            hasMore: false,
            nextCursor: undefined,
            total: 0, // Add missing total property
        };
        const onboardingProgress = {
            is_new_user: false,
            project_count: 0,
            requirement_count: 0,
            document_count: 0,
            has_invited_members: false,
            has_used_ai_analysis: false,
            completion_percentage: 0,
        };

        return (
            <LayoutView>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <Suspense fallback={<HomePageSkeleton />}>
                        <HomePage
                            initialProjects={projects}
                            initialRecentActivity={
                                recentActivityData.activities
                            }
                            initialRecentActivityData={recentActivityData}
                            initialOnboardingProgress={onboardingProgress}
                            organizations={organizations}
                            userId={userId}
                        />
                    </Suspense>
                </HydrationBoundary>
            </LayoutView>
        );
    } catch (error) {
        console.error('Home page error:', error);
        // Return a minimal error page
        return (
            <LayoutView>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-gray-600 mb-4">
                            We&apos;re having trouble loading your dashboard.
                            Please try refreshing the page.
                        </p>
                        <a
                            href="/home"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Refresh Page
                        </a>
                    </div>
                </div>
            </LayoutView>
        );
    }
}
