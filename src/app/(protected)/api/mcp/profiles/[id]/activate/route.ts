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

        const supabase = getServiceRoleClient() as { from: (table: string) => unknown; };

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        // Deactivate all profiles for this user
        await supabase
            .from('mcp_profiles')
            .update({ is_active: false })
            .eq('user_id', profile.id);

        // Activate the selected profile
        const { data: activatedProfile, error } = await supabase
            .from('mcp_profiles')
            .update({
                is_active: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', (await context.params).id)
            .eq('user_id', profile.id)
            .select()
            .single();

        if (error) {
            console.error('Error activating MCP profile:', error);
            return NextResponse.json(
                { error: 'Failed to activate profile', details: error.message },
                { status: 500 }
            );
        }

        if (!activatedProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            profile: activatedProfile,
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

