import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { OrgDashboardSkeleton } from '@/components/custom/skeletons/OrgDashboardSkeleton';
import { getQueryClient } from '@/lib/constants/queryClient';
import { prefetchOrgPageData } from '@/lib/db/utils/prefetchData';

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const queryClient = getQueryClient();
    const { orgId } = await params;

    // Validate orgId
    if (!orgId || orgId === 'user') {
        console.error('Invalid orgId:', orgId);
        notFound();
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    // Validate userId
    if (!userId) {
        console.error('No user_id found in cookies');
        notFound();
    }

    try {
        await prefetchOrgPageData(orgId, userId, queryClient);

        return (
            <div className="relative flex-1">
                <Suspense fallback={<OrgDashboardSkeleton />}>{children}</Suspense>
            </div>
        );
    } catch (error: unknown) {
        // Enhanced error logging for better debugging
        console.error('Error in organization layout:', {
            error,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            orgId,
            userId,
        });

        // Handle not found or permission errors
        if (
            error &&
            typeof error === 'object' &&
            'status' in error &&
            (error as { status?: number }).status === 404
        ) {
            return notFound();
        }

        // Handle other errors with better error display
        return (
            <div className="error-container p-4 text-center">
                <h2 className="text-lg font-semibold text-red-600 mb-2">
                    Error Loading Organization
                </h2>
                <p className="text-sm text-gray-600">
                    {error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred while loading the organization.'}
                </p>
                <p className="text-xs text-gray-500 mt-2">Organization ID: {orgId}</p>
            </div>
        );
    }
}
