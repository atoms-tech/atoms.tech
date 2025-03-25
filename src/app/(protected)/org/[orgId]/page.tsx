'use client';

import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import OrgDashboard from '@/app/(protected)/org/components/OrgDashboard.client';
import { OrgDashboardSkeleton } from '@/components/custom/skeletons/OrgDashboardSkeleton';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useOrganization } from '@/hooks/queries/useOrganization';
import { useUserProjects } from '@/hooks/queries/useProject';
import { useOrganization as useOrgProvider } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { useContextStore } from '@/lib/store/context.store';
import { Organization, Project } from '@/types';

export default function OrgPage() {
    const router = useRouter();
    const params = useParams<{ orgId: string }>();
    const { profile } = useUser();
    const { setCurrentProjectId } = useContextStore();
    const { theme } = useTheme();

    // Validate orgId before using it
    const orgId = params?.orgId && params.orgId !== 'user' ? params.orgId : '';

    // Fetch organization data
    const { data: organization, isLoading: orgLoading } =
        useOrganization(orgId);
    const { setCurrentOrganization } = useOrgProvider();

    // Use useEffect to set the organization when it changes
    useEffect(() => {
        if (organization) {
            setCurrentOrganization(organization as Organization);
        }
    }, [organization, setCurrentOrganization]);

    // Fetch projects data
    const { data: projects, isLoading: projectsLoading } = useUserProjects(
        profile?.id || '',
        orgId,
    );

    const { data: externalDocuments, isLoading: documentsLoading } =
        useExternalDocumentsByOrg(params?.orgId || '');

    const handleProjectClick = (project: Project) => {
        setCurrentProjectId(project.id);
        router.push(`/org/${orgId}/${project.id}`);
    };

    const handleExternalDocsClick = () => {
        router.push(`/org/${params?.orgId}/externalDocs`);
    };

    return (
        <Suspense fallback={<OrgDashboardSkeleton />}>
            <OrgDashboard
                organization={organization}
                orgLoading={orgLoading}
                projects={projects}
                projectsLoading={projectsLoading}
                externalDocuments={externalDocuments}
                documentsLoading={documentsLoading}
                theme={theme}
                onProjectClick={handleProjectClick}
                onExternalDocsClick={handleExternalDocsClick}
                orgId={orgId}
            />
        </Suspense>
    );
}
