import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/mcp/installed
 *
 * Fetches all MCP servers installed for the authenticated user.
 * Returns servers with their configuration, status, and metadata.
 */
export async function GET() {
    try {
        // Authenticate user
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get or create user profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 }
            );
        }

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Database client unavailable' },
                { status: 500 }
            );
        }

        // Fetch user's MCP servers
        // Note: Adjust the table name and columns based on your actual schema
        const { data: servers, error } = await supabase
            .from('user_mcp_servers')
            .select(`
                id,
                name,
                namespace,
                transport_type,
                auth_status,
                scope,
                enabled,
                config,
                created_at,
                updated_at,
                last_test_at,
                last_test_status,
                last_test_error
            `)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching MCP servers:', error);
            return NextResponse.json(
                {
                    error: 'Failed to fetch servers',
                    details: error.message
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            servers: servers || [],
            count: servers?.length || 0,
        });
    } catch (error) {
        console.error('API error in GET /api/mcp/installed:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch installed servers',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
