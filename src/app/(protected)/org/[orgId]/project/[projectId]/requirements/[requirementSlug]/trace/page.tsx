'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function TracePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const requirementId = params.requirementSlug as string;
    const projectId = params.projectId as string;
    const orgId = params.orgId as string;
    const documentId = searchParams.get('documentId') || '';

    useEffect(() => {
        // Redirect to the traceability page manage tab with the requirement context
        const queryParams = new URLSearchParams();
        queryParams.set('tab', 'manage');
        queryParams.set('projectId', projectId);
        queryParams.set('requirementId', requirementId);
        if (documentId) {
            queryParams.set('documentId', documentId);
        }

        router.replace(`/org/${orgId}/traceability?${queryParams.toString()}`);
    }, [orgId, projectId, requirementId, documentId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Redirecting to manage tab...</p>
        </div>
    );
}
