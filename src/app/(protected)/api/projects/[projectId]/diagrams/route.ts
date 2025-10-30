import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/projects/[projectId]/diagrams
 *
 * Fetch all diagrams for a project with membership validation
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> },
) {
    try {
        const { projectId } = await context.params;

        // Authenticate via WorkOS
        const { user } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get or create Supabase profile for WorkOS user
        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        // Get service role client for privileged operations
        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Verify project membership
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all diagrams for the project
        const { data: diagrams, error: diagramsError } = await supabase
            .from('excalidraw_diagrams')
            .select('id, name, thumbnail_url, updated_at, created_by, created_at')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });

        if (diagramsError) {
            console.error('Error fetching diagrams:', diagramsError);
            return NextResponse.json(
                { error: 'Failed to fetch diagrams', details: diagramsError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ diagrams: diagrams ?? [] });
    } catch (error) {
        console.error('Project diagrams API error:', error);
        return NextResponse.json({ error: 'Failed to fetch diagrams' }, { status: 500 });
    }
}
