import { Suspense } from 'react';

import OrgDashboard from '@/app/(protected)/org/components/OrgDashboard.client';
import { OrgDashboardSkeleton } from '@/app/(protected)/org/components/OrgDashboardSkeleton';

export default function OrgPage() {
    return (
        <Suspense fallback={<OrgDashboardSkeleton />}>
            <OrgDashboard />
        </Suspense>
    );
}
