import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/servers/[id]/stop
 * Stop a server
 */
export async function POST(
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
        const supabase = await createServerClient();

        // Fetch server
        const { data: server, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Check access
        if (server.scope === 'user' && server.user_id !== profile.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // TODO: Implement actual server stop logic
        // For now, just disable the server
        const { data: updatedServer, error: updateError } = await supabase
            .from('mcp_servers')
            .update({
                enabled: false,
                updated_at: new Date().toISOString(),
                updated_by: profile.id,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            logger.error('Error stopping server', updateError, {
                route: '/api/mcp/servers/[id]/stop',
                serverId: id,
            });
            return NextResponse.json(
                { error: 'Failed to stop server', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            server: updatedServer,
            message: 'Server stopped successfully',
        });
    } catch (error) {
        logger.error('Stop server error', error, {
            route: '/api/mcp/servers/[id]/stop',
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

