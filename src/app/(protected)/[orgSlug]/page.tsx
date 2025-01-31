'use client';

import { useContextStore } from '@/lib/store/context.store';
import OrgDashboard from './components/OrgDashboard.client';

export default function OrgPage() {
    const { currentOrgId, currentUserId } = useContextStore();
    return (
        <OrgDashboard
            orgId={currentOrgId as string}
            userId={currentUserId as string}
        />
    );
}
