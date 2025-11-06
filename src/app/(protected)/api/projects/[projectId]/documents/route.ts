import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getProjectDocumentsServer } from '@/lib/db/server/documents.server';
import { getServiceRoleClient } from '@/lib/database';

export async function GET(
    _request: Request,
    context: { params: Promise<{ projectId: string }> },
) {
    try {
        const { projectId } = await context.params;

        if (!projectId) {
            return NextResponse.json(
                { error: 'Project ID is required' },
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

        const supabase = getServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
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

        const documents = await getProjectDocumentsServer(projectId);

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Project documents API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch project documents',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
