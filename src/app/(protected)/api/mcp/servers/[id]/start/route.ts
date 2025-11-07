import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/servers/[id]/start
 * Start a server
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

        // TODO: Implement actual server start logic
        // For now, just enable the server
        const { data: updatedServer, error: updateError } = await supabase
            .from('mcp_servers')
            .update({
                enabled: true,
                updated_at: new Date().toISOString(),
                updated_by: profile.id,
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            logger.error('Error starting server', updateError, {
                route: '/api/mcp/servers/[id]/start',
                serverId: id,
            });
            return NextResponse.json(
                { error: 'Failed to start server', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            server: updatedServer,
            message: 'Server started successfully',
        });
    } catch (error) {
        logger.error('Start server error', error, {
            route: '/api/mcp/servers/[id]/start',
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

