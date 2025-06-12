'use server';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import React from 'react';

import LayoutManager from '@/components/base/LayoutManager';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AgentInterface } from '@/components/custom/AgentChat/AgentInterface';
import { getQueryClient } from '@/lib/constants/queryClient';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserProjectsServer } from '@/lib/db/server';
import { prefetchUserDashboard } from '@/lib/db/utils/prefetchData';
import { OrganizationProvider } from '@/lib/providers/organization.provider';
import { UserProvider } from '@/lib/providers/user.provider';
import { Organization } from '@/types/base/organizations.types';

function RootLayoutSkeleton() {
    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
}

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = getQueryClient();
    const cookieStore = await cookies();
    const preferredOrgId = cookieStore.get('preferred_org_id')?.value;

    try {
        // Parallel fetch all critical user data at once
        const { user, profile, organizations } =
            await prefetchUserDashboard(queryClient);

        // Only prefetch data for preferred org (if we know it)
        // This prevents overfetching for ALL organizations
        if (preferredOrgId) {
            const preferredOrg = organizations.find(
                (org: Organization) => org.id === preferredOrgId,
            );
            if (preferredOrg) {
                await queryClient.prefetchQuery({
                    queryKey: queryKeys.projects.byOrg(preferredOrgId),
                    queryFn: () =>
                        getUserProjectsServer(user.id, preferredOrgId),
                    staleTime: 1000 * 60 * 5, // 5 minutes
                });
            }
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                <UserProvider initialUser={user} initialProfile={profile}>
                    <OrganizationProvider initialOrganizations={organizations}>
                        <div className="flex h-screen w-full">
                            {/* Main Content */}
                            <div className="flex-1 relative">
                                <LayoutManager>
                                    <Suspense fallback={<RootLayoutSkeleton />}>
                                        {children}
                                    </Suspense>
                                </LayoutManager>
                                {/* Agent Interface (client component) */}
                                <AgentInterface />
                            </div>
                        </div>
                    </OrganizationProvider>
                </UserProvider>
            </HydrationBoundary>
        );
    } catch (error) {
        console.error('Error in protected layout:', error);
        // Handle authentication errors
        return (
            <div className="error-container">
                <p>Session expired. Please log in again.</p>
                <Button onClick={() => redirect('/login')}>Login</Button>
            </div>
        );
    }
}
