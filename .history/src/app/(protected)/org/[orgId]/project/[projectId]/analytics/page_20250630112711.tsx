import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
    getAuthUserServer,
    getOrganizationServer,
    getProjectByIdServer
} from '@/lib/db/server';

import { ProjectAnalyticsPageClient } from './ProjectAnalyticsPageClient';

interface ProjectAnalyticsPageProps {
    params: {
        orgId: string;
        projectId: string;
    };
    searchParams: {
        tab?: string;
        timeRange?: 'week' | 'month' | 'quarter' | 'year';
    };
}

export async function generateMetadata({ params }: ProjectAnalyticsPageProps): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const [organization, project] = await Promise.all([
            getOrganizationServer(resolvedParams.orgId),
            getProjectByIdServer(resolvedParams.projectId)
        ]);

        return {
            title: `Analytics - ${project.name} | ${organization.name} | Atoms`,
            description: `Analytics and activity history for ${project.name} project`,
        };
    } catch {
        return {
            title: 'Project Analytics | Atoms',
            description: 'Project analytics and activity history',
        };
    }
}

export default async function ProjectAnalyticsPage({
    params,
    searchParams
}: ProjectAnalyticsPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const { orgId, projectId } = resolvedParams;
    const { tab = 'dashboard', timeRange = 'month' } = resolvedSearchParams;

    try {
        // Verify user access
        const userResult = await getAuthUserServer();
        if (!userResult.user) {
            notFound();
        }

        // Get organization and project
        const [organization, project] = await Promise.all([
            getOrganizationServer(orgId),
            getProjectByIdServer(projectId)
        ]);

        if (!organization || !project) {
            notFound();
        }

        // Verify project belongs to organization
        if (project.organization_id !== orgId) {
            notFound();
        }

        return (
            <ProjectAnalyticsPageClient
                orgId={orgId}
                projectId={projectId}
                organization={organization}
                project={project}
                initialTab={tab}
                initialTimeRange={timeRange}
            />
        );
    } catch (error) {
        console.error('Error loading project analytics page:', error);
        notFound();
    }
}
