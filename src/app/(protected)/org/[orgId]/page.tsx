'use client';

import { useTheme } from 'next-themes';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import OrgDashboard from '@/app/(protected)/org/[orgId]/OrgDashboard.client';
import { OrgDashboardSkeleton } from '@/components/custom/skeletons/OrgDashboardSkeleton';
import LayoutView from '@/components/views/LayoutView';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useOrganization as useOrgQuery } from '@/hooks/queries/useOrganization';
import { useProjectsByMembershipForOrg } from '@/hooks/queries/useProject';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { useContextStore } from '@/lib/store/context.store';
import { Project } from '@/types/base/projects.types';

export default function OrgPage() {
    const router = useRouter();

    const { user } = useUser();
    const params = useParams<{ orgId: string }>();
    const { setCurrentProjectId } = useContextStore();
    const { theme } = useTheme();
    const { setCurrentOrganization } = useOrganization();

    // Validate orgId before using it
    const orgId = params?.orgId && params.orgId !== 'user' ? params.orgId : '';

    // Fetch organization data
    const { data: organization, isLoading: orgLoading } = useOrgQuery(orgId);

    // Use useEffect to set the organization when it changes
    useEffect(() => {
        if (organization) {
            setCurrentOrganization(organization);
        } else {
            setCurrentOrganization(null);
        }
    }, [organization, setCurrentOrganization]);

    // Fetch projects data
    const { data: projects, isLoading: projectsLoading } =
        useProjectsByMembershipForOrg(orgId, user?.id || '');
    const { data: externalDocuments, isLoading: documentsLoading } =
        useExternalDocumentsByOrg(params?.orgId || '');

    const handleProjectClick = (project: Project) => {
        setCurrentProjectId(project.id);
        router.push(`/org/${orgId}/project/${project.id}`);
    };

    const handleExternalDocsClick = () => {
        router.push(`/org/${params?.orgId}/externalDocs`);
    };

    const handleDemoClick = () => {
        router.push(`/org/${params?.orgId}/demo`);
    };

    return (
        <LayoutView>
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
                    onDemoClick={handleDemoClick}
                    orgId={orgId}
                />
            </Suspense>
        </LayoutView>
    );
}
