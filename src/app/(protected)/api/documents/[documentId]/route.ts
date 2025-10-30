import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function GET(
    _request: Request,
    context: { params: Promise<{ documentId: string }> },
) {
    try {
        const { documentId } = await context.params;

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 },
            );
        }

        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const documents = await getDocumentDataServer(documentId);

        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const document = documents[0];

        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', document.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError) {
            return NextResponse.json(
                {
                    error: 'Failed to verify project membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Also resolve organization_id for consumers that need org context (e.g., requirement ID gen)
        const { data: projectRow, error: projectErr } = await supabase
            .from('projects')
            .select('organization_id')
            .eq('id', document.project_id)
            .maybeSingle();

        if (projectErr) {
            return NextResponse.json(
                {
                    error: 'Failed to resolve project',
                    details: projectErr.message,
                },
                { status: 500 },
            );
        }

        const organizationId = projectRow?.organization_id ?? null;

        return NextResponse.json({ document, organizationId });
    } catch (error) {
        console.error('Document API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch document',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
