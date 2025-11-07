import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';

/**
 * GET /api/mcp/profiles
 * Fetch all MCP profiles for the current user
 */
export async function GET() {
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

        // Fetch user's preferences to get active profile
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', profile.id)
            .single();

        const preferences = (userProfile?.preferences as Record<string, any>) || {};
        const activeMcpProfileId = preferences.activeMcpProfileId;

        // Fetch user's MCP profiles
        const { data: profiles, error } = await supabase
            .from('mcp_profiles')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching MCP profiles:', error);
            return NextResponse.json(
                { error: 'Failed to fetch profiles', details: error.message },
                { status: 500 }
            );
        }

        // Mark the active profile
        const profilesWithActiveFlag = (profiles || []).map(p => ({
            ...p,
            isActive: p.id === activeMcpProfileId,
        }));

        return NextResponse.json({
            profiles: profilesWithActiveFlag,
            count: profilesWithActiveFlag.length,
        });
    } catch (error) {
        console.error('Error in GET /api/mcp/profiles:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/mcp/profiles
 * Create a new MCP profile
 */
export async function POST(request: Request) {
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

        const body = await request.json();
        const { name, description, servers } = body;

        if (!name || !servers || !Array.isArray(servers)) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const supabase = getServiceRoleClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        // Create profile
        // Note: is_active column doesn't exist in cloud schema
        const { data: newProfile, error } = await supabase
            .from('mcp_profiles')
            .insert({
                user_id: profile.id,
                name,
                description: description || '',
                servers,
                // Removed: is_active (doesn't exist in schema)
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating MCP profile:', error);
            return NextResponse.json(
                { error: 'Failed to create profile', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            profile: newProfile,
            message: 'Profile created successfully',
        });
    } catch (error) {
        console.error('Error in POST /api/mcp/profiles:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

