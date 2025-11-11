import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createSupabaseClientWithToken } from '@/lib/supabase/supabase-authkit';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/diagrams/[diagramId]
 *
 * Fetch a single diagram by ID with membership validation
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ diagramId: string }> },
) {
    try {
        const { diagramId } = await context.params;

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

        // Fetch diagram with project info for membership check
        const { data: diagram, error: diagramError } = await supabase
            .from('excalidraw_diagrams')
            .select('*')
            .eq('id', diagramId)
            .maybeSingle();

        if (diagramError) {
            console.error('Error fetching diagram:', diagramError);
            return NextResponse.json(
                { error: 'Failed to fetch diagram', details: diagramError.message },
                { status: 500 },
            );
        }

        if (!diagram) {
            return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
        }

        if (!diagram.project_id) {
            return NextResponse.json(
                { error: 'Diagram has no associated project' },
                { status: 400 },
            );
        }

        // Verify project membership
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', diagram.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ diagram });
    } catch (error) {
        console.error('Diagram API GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch diagram' }, { status: 500 });
    }
}

/**
 * PATCH /api/diagrams/[diagramId]
 *
 * Update diagram metadata (name, etc.) with membership validation
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ diagramId: string }> },
) {
    try {
        const { diagramId } = await context.params;
        const body = await request.json();

        // Authenticate via WorkOS
        const { user, accessToken } = await withAuth();
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

        // Get service role client for membership check
        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Fetch diagram to get project_id for membership check
        const { data: diagram, error: fetchError } = await supabase
            .from('excalidraw_diagrams')
            .select('project_id')
            .eq('id', diagramId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching diagram for update:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch diagram', details: fetchError.message },
                { status: 500 },
            );
        }

        if (!diagram) {
            return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
        }

        if (!diagram.project_id) {
            return NextResponse.json(
                { error: 'Diagram has no associated project' },
                { status: 400 },
            );
        }

        // Verify project membership
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', diagram.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Use user-scoped client for update operation
        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const userClient = createSupabaseClientWithToken(accessToken);
        const { data: updatedDiagram, error: updateError } = await userClient
            .from('excalidraw_diagrams')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
                updated_by: profile.id,
            })
            .eq('id', diagramId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating diagram:', updateError);
            return NextResponse.json(
                { error: 'Failed to update diagram', details: updateError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ diagram: updatedDiagram });
    } catch (error) {
        console.error('Diagram API PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update diagram' }, { status: 500 });
    }
}

/**
 * DELETE /api/diagrams/[diagramId]
 *
 * Delete a diagram with membership validation
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ diagramId: string }> },
) {
    try {
        const { diagramId } = await context.params;

        // Authenticate via WorkOS
        const { user, accessToken } = await withAuth();
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

        // Get service role client for membership check
        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Fetch diagram to get project_id for membership check
        const { data: diagram, error: fetchError } = await supabase
            .from('excalidraw_diagrams')
            .select('project_id')
            .eq('id', diagramId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching diagram for deletion:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch diagram', details: fetchError.message },
                { status: 500 },
            );
        }

        if (!diagram) {
            return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
        }

        if (!diagram.project_id) {
            return NextResponse.json(
                { error: 'Diagram has no associated project' },
                { status: 400 },
            );
        }

        // Verify project membership
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', diagram.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Use user-scoped client for delete operation
        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const userClient = createSupabaseClientWithToken(accessToken);
        const { error: deleteError } = await userClient
            .from('excalidraw_diagrams')
            .delete()
            .eq('id', diagramId);

        if (deleteError) {
            console.error('Error deleting diagram:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete diagram', details: deleteError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Diagram API DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete diagram' }, { status: 500 });
    }
}
