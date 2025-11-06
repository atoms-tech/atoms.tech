import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * PUT /api/mcp/profiles/[id]
 * Update an MCP profile
 */
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        // Authenticate user
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get or create user profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not provisioned' }, { status: 409 });
        }

        const body = await request.json();
        const { name, description, servers } = body;

        const supabase = getSupabaseServiceRoleClient() as { from: (table: string) => unknown; };

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        // Update profile
        const { data: updatedProfile, error } = await supabase
            .from('mcp_profiles')
            .update({
                name,
                description: description || '',
                servers,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', profile.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating MCP profile:', error);
            return NextResponse.json(
                { error: 'Failed to update profile', details: error.message },
                { status: 500 }
            );
        }

        if (!updatedProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            profile: updatedProfile,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('Error in PUT /api/mcp/profiles/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/mcp/profiles/[id]
 * Delete an MCP profile
 */
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        // Authenticate user
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get or create user profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not provisioned' }, { status: 409 });
        }

        const supabase = getSupabaseServiceRoleClient() as { from: (table: string) => unknown; };

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        // Delete profile
        const { error } = await supabase
            .from('mcp_profiles')
            .delete()
            .eq('id', id)
            .eq('user_id', profile.id);

        if (error) {
            console.error('Error deleting MCP profile:', error);
            return NextResponse.json(
                { error: 'Failed to delete profile', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Profile deleted successfully',
        });
    } catch (error) {
        console.error('Error in DELETE /api/mcp/profiles/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

