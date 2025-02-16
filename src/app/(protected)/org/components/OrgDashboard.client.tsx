'use client';

import DashboardView, {
    Column,
} from '@/components/base/DashboardView';
import { Project } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { useContextStore } from '@/lib/store/context.store';
import { useUser } from '@/lib/providers/user.provider';
import { useUserProjects } from '@/hooks/queries/useProject';

export default function OrgDashboard() {
    // Navigation hooks
    const router = useRouter();
    const params = useParams<{ orgId: string }>();

    // User context hooks
    const { profile } = useUser();
    const { setCurrentProjectId } = useContextStore();
    const { data, isLoading: projectsLoading } = useUserProjects(profile?.id || '', profile?.current_organization_id || '');

    const columns: Column<Project>[] = [
        {
            header: 'Name',
            accessor: (item: Project) => item.name,
        },
        {
            header: 'Status',
            accessor: (item: Project) => item.status || 'N/A',
        },
    ];

    const handleRowClick = (item: Project) => {
        setCurrentProjectId(item.id);
        router.push(`/org/${params.orgId}/${item.id}`);
    };

    return (
        <DashboardView
            data={data || []}
            columns={columns}
            isLoading={projectsLoading}
            emptyMessage="No projects found."
            onRowClick={handleRowClick}
        />
    );
}
