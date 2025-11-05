import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/supabase/supabaseServer';
import { logger } from '@/lib/utils/logger';

/**
 * DELETE /api/mcp/servers/[id]
 *
 * Delete a custom MCP server (user scope only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;
        const supabase = await createClient();

        // Fetch server to verify ownership
        const { data: server, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();

        if (fetchError || !server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Only allow deletion of user-scoped servers by the owner
        if (server.scope !== 'user' || server.user_id !== profile.id) {
            return NextResponse.json(
                { error: 'You can only delete your own custom servers' },
                { status: 403 }
            );
        }

        // Soft delete
        const { error: deleteError } = await supabase
            .from('mcp_servers')
            .update({ is_deleted: true })
            .eq('id', id);

        if (deleteError) {
            logger.error('Error deleting MCP server', deleteError, {
                route: '/api/mcp/servers/[id]',
                serverId: id,
            });
            return NextResponse.json(
                { error: 'Failed to delete server', details: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Server deleted successfully',
        });
    } catch (error) {
        logger.error('MCP server DELETE error', error, {
            route: '/api/mcp/servers/[id]',
        });
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
