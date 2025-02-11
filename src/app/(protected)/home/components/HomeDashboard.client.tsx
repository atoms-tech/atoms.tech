'use client';

import DashboardView, {
    Column,
    SupportedDataTypes,
} from '@/components/base/DashboardView';
import RenderCounter from '@/components/RerenderCount';
import { useOrganizationsByMembership } from '@/hooks/queries/useOrganization';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { useContextStore } from '@/lib/store/context.store';
import { Organization } from '@/types';
import { useRouter } from 'next/navigation';

export default function HomeDashboard() {
    const { user } = useUser();
    const router = useRouter();
    const { setCurrentUserId, setCurrentOrgId } = useContextStore();
    const { setOrganization } = useOrganization();
    const { data: organizations, isLoading } = useOrganizationsByMembership(
        user?.id || '',
    );

    const columns: Column[] = [
        {
            header: 'Name',
            accessor: (item: SupportedDataTypes) => (item as Organization).name,
        },
        {
            header: 'Type',
            accessor: (item: SupportedDataTypes) => (item as Organization).type,
        },
        {
            header: 'Status',
            accessor: (item: SupportedDataTypes) =>
                (item as Organization).status || 'N/A',
        },
        {
            header: 'Members',
            accessor: (item: SupportedDataTypes) =>
                (item as Organization).member_count?.toString() || '0',
        },
    ];

    const handleRowClick = (item: SupportedDataTypes) => {
        setCurrentUserId(user?.id || '');
        setOrganization(item as Organization);
        router.push(`/org/${(item as Organization).slug}`);
    };

    return (
        <>
            <DashboardView
                data={organizations || []}
                columns={columns}
                isLoading={isLoading}
                emptyMessage="No organizations found."
                onRowClick={handleRowClick}
            />
            <RenderCounter />
        </>
    );
}
