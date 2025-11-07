import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/mcp/servers/[id]/auth
 * Update authentication configuration for an MCP server
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const { authType, authConfig } = body;

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
        }

        // Verify server exists and user has access
        const { data: server, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Check access (user owns or org member)
        if (server.scope === 'user' && server.user_id !== profile.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Update auth configuration
        const { error: updateError } = await supabase
            .from('mcp_servers')
            .update({
                auth_type: authType,
                auth_config: authConfig,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating server auth:', updateError);
            return NextResponse.json(
                { error: 'Failed to update auth config', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Auth configuration updated successfully',
            serverId: id,
        });
    } catch (error) {
        console.error('Error in PATCH /api/mcp/servers/[id]/auth:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
