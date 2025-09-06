import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { OrgDashboardSkeleton } from '@/components/custom/skeletons/OrgDashboardSkeleton';
import { atomsApiServer } from '@/lib/atoms-api/server';
import { getQueryClient } from '@/lib/constants/queryClient';
import { prefetchOrgPageData } from '@/lib/db/utils/prefetchData';

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const queryClient = getQueryClient();
    const { orgId } = await params;
    if (!orgId) notFound();

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    try {
        const fallbackUserId =
            userId || (await (await atomsApiServer()).auth.getUser())?.id || '';
        await prefetchOrgPageData(orgId, fallbackUserId, queryClient);

        return (
            <div className="relative flex-1">
                <Suspense fallback={<OrgDashboardSkeleton />}>{children}</Suspense>
            </div>
        );
    } catch (error: unknown) {
        console.error('Error in organization layout:', error);

        // Handle not found or permission errors
        if ((error as { status?: number }).status === 404) {
            return notFound();
        }

        // Handle other errors
        return (
            <div className="error-container">
                <p>Error loading organization: {(error as Error).message}</p>
            </div>
        );
    }
}
