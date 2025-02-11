'use client';

import ProjectDashboard from '@/app/(protected)/project/components/ProjectDashboard.client';
import { useParams } from 'next/navigation';

export default function ProjectPage() {
    const { projectSlug } = useParams<{ projectSlug: string }>();

    return <ProjectDashboard projectSlug={projectSlug} />;
}
