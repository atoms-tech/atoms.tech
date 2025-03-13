// src/app/(protected)/org/[orgId]/layout.tsx
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { OrgDashboardSkeleton } from '@/components/custom/skeletons/OrgDashboardSkeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getQueryClient } from '@/lib/constants/queryClient';
import { getAuthUserServer } from '@/lib/db/server';
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
        await prefetchOrgPageData(
            orgId,
            userId ?? (await getAuthUserServer()).user.id,
            queryClient,
        );

        return (
            <SidebarProvider>
                <Sidebar />
                <div className="relative flex-1 p-16">
                    <Suspense fallback={<OrgDashboardSkeleton />}>
                        {children}
                    </Suspense>
                </div>
                <VerticalToolbar />
            </SidebarProvider>
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
