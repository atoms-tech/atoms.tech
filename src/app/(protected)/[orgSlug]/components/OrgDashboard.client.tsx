'use client';

import DashboardView, {
    Column,
    SupportedDataTypes,
} from '@/components/base/DashboardView';
import { Project } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { useContextStore } from '@/lib/store/context.store';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { ProjectSchema } from '@/types/validation/projects.validation';
import { useUser } from '@/lib/providers/user.provider';

export default function OrgDashboard() {
    // Navigation hooks
    const router = useRouter();
    const params = useParams<{ orgSlug: string }>();

    // User context hooks
    const { profile } = useUser();
    const { setCurrentProjectId } = useContextStore();

    // Local state
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch projects for current user in organization
    useEffect(() => {
        const projects = async () => {
            const { data: projectMemberData, error: memberError } =
                await supabase
                    .from('project_members')
                    .select('project_id')
                    .eq('user_id', profile?.id)
                    .eq('org_id', profile?.current_organization_id)
                    .eq('status', 'active');

            if (memberError) throw memberError;

            const projectIds = projectMemberData.map((pm) => pm.project_id);

            const { data: projectData, error } = await supabase
                .from('projects')
                .select('*')
                .eq('is_deleted', false)
                .in('id', projectIds);

            if (error) throw error;

            const parsedProjects = projectData.map((project) =>
                ProjectSchema.parse(project),
            );
            setProjects(parsedProjects);
            setIsLoading(false);
        };
        projects();
    }, [profile?.current_organization_id, profile?.id]);

    const columns: Column[] = [
        {
            header: 'Name',
            accessor: (item: SupportedDataTypes) => (item as Project).name,
        },
        {
            header: 'Status',
            accessor: (item: SupportedDataTypes) =>
                (item as Project).status || 'N/A',
        },
    ];

    const handleRowClick = (item: SupportedDataTypes) => {
        setCurrentProjectId((item as Project).id);
        router.push(`/${params.orgSlug}/${(item as Project).slug}`);
    };

    return (
        <DashboardView
            data={projects || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No projects found."
            onRowClick={handleRowClick}
        />
    );
}
