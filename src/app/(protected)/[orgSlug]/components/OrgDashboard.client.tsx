'use client';

import DashboardView, {
    Column,
    SupportedDataTypes,
} from '@/components/base/DashboardView';
import { Organization, Project } from '@/types';
import { useProjectsByMembershipForOrg } from '@/hooks/queries/useProject';
import { useRouter } from 'next/navigation';
import { useContextStore } from '@/lib/store/context.store';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { ProjectSchema } from '@/types/validation/projects.validation';
import { useUser } from '@/lib/providers/user.provider';

export default function OrgDashboard({
    orgId,
    userId,
}: {
    orgId: string;
    userId: string;
}) {
    const router = useRouter();
    const { profile } = useUser();
    // const { data: projects, isLoading } = useProjectsByMembershipForOrg(currentOrgId as string, currentUserId as string);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setCurrentProjectId } = useContextStore();
    useEffect(() => {
        const projects = async () => {
            const { data, error } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('org_id', profile?.current_organization_id)
                .eq('user_id', profile?.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            if (error) throw error;
            const projectIds = data.map((member) => member.project_id);
            console.log('Project IDs', projectIds);
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds)
                .eq('is_deleted', false);
            if (projectError) throw projectError;
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
        router.push(`/${(item as Project).slug}`);
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
