import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import { getAuthUserServer, getOrganizationServer } from '@/lib/db/server';

import { AnalyticsPageClient } from './AnalyticsPageClient';

interface AnalyticsPageProps {
    params: Promise<{
        orgId: string;
    }>;
    searchParams: Promise<{
        tab?: string;
        timeRange?: 'week' | 'month' | 'quarter' | 'year';
    }>;
}

export async function generateMetadata({
    params,
}: AnalyticsPageProps): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const organization = await getOrganizationServer(resolvedParams.orgId);

        return {
            title: `Analytics - ${organization.name} | Atoms`,
            description: `Analytics and activity history for ${organization.name}`,
        };
    } catch {
        return {
            title: 'Analytics | Atoms',
            description: 'Organization analytics and activity history',
        };
    }
}

export default async function AnalyticsPage({
    params,
    searchParams,
}: AnalyticsPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const { orgId } = resolvedParams;
    const { tab = 'dashboard', timeRange = 'month' } = resolvedSearchParams;

    try {
        // Verify user access
        const userResult = await getAuthUserServer();
        if (!userResult.user) {
            notFound();
        }

        // Get organization
        const organization = await getOrganizationServer(orgId);
        if (!organization) {
            notFound();
        }

        return (
            <AnalyticsPageClient
                orgId={orgId}
                organization={organization}
                initialTab={tab}
                initialTimeRange={timeRange}
            />
        );
    } catch (error) {
        console.error('Error loading analytics page:', error);
        notFound();
    }
}
