'use client';

import DashboardView, { Column } from '@/components/base/DashboardView';
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
    const { setCurrentUserId } = useContextStore();
    const { setOrganization } = useOrganization();
    const { data: organizations, isLoading } = useOrganizationsByMembership(
        user?.id || '',
    );

    const columns: Column<Organization>[] = [
        {
            header: 'Name',
            accessor: (item: Organization) => item.name,
        },
        {
            header: 'Type',
            accessor: (item: Organization) => item.type,
        },
        {
            header: 'Status',
            accessor: (item: Organization) => item.status || 'N/A',
        },
        {
            header: 'Members',
            accessor: (item: Organization) =>
                item.member_count?.toString() || '0',
        },
    ];

    const handleRowClick = (item: Organization) => {
        setCurrentUserId(user?.id || '');
        setOrganization(item);
        router.push(`/org/${item.slug}`);
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
