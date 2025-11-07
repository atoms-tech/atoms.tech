import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';

/**
 * POST /api/mcp/profiles/[id]/activate
 * Activate an MCP profile (deactivates all others)
 */
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
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

        const supabase = getServiceRoleClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        const profileId = (await context.params).id;

        // Verify the profile exists and belongs to the user
        const { data: mcpProfile, error: profileError } = await supabase
            .from('mcp_profiles')
            .select('id')
            .eq('id', profileId)
            .eq('user_id', profile.id)
            .single();

        if (profileError || !mcpProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get current user preferences
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', profile.id)
            .single();

        const currentPreferences = (currentProfile?.preferences as Record<string, any>) || {};

        // Update user preferences to set active MCP profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                preferences: {
                    ...currentPreferences,
                    activeMcpProfileId: profileId,
                },
            })
            .eq('id', profile.id);

        if (updateError) {
            console.error('Error updating user preferences:', updateError);
            return NextResponse.json(
                { error: 'Failed to activate profile', details: updateError.message },
                { status: 500 }
            );
        }

        // Also update the profile timestamp
        await supabase
            .from('mcp_profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', profileId);

        return NextResponse.json({
            profileId,
            message: 'Profile activated successfully',
        });
    } catch (error) {
        console.error('Error in POST /api/mcp/profiles/[id]/activate:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

