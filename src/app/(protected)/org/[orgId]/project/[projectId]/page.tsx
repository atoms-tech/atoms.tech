import ProjectPage from '@/app/(protected)/org/[orgId]/project/[projectId]/ProjectDashboard.client';
import LayoutView from '@/components/views/LayoutView';

export default function ProjectPageWrapper() {
    return (
        <LayoutView>
            <ProjectPage />
        </LayoutView>
    );
}
