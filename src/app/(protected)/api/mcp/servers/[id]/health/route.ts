import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { performHealthCheck } from '@/lib/services/mcp-health-check';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers/[id]/health
 * Get server health status with actual health check
 */
export async function GET(
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

        // First, get the user_mcp_server record to find the actual server_id
        const { data: userServer, error: userServerError } = await supabase
            .from('user_mcp_servers')
            .select('server_id')
            .eq('id', id)
            .eq('user_id', profile.id)
            .single();

        if (userServerError || !userServer) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Now fetch the actual server details using server_id
        const { data: server, error } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', userServer.server_id)
            .single();

        if (error || !server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Check access
        if (server.scope === 'user' && server.user_id !== profile.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Prepare server data for health check with null handling
        const serverForHealthCheck = {
            ...server,
            transport_type: server.transport_type || 'stdio',
            enabled: server.enabled ?? true,
            url: server.url || undefined,
        };

        // Perform actual health check
        const healthResult = await performHealthCheck(serverForHealthCheck);

        // Update server with health check results
        await supabase
            .from('mcp_servers')
            .update({
                status: healthResult.status,
                last_health_check: healthResult.last_check,
                health_check_error: healthResult.error || null,
            })
            .eq('id', id);

        return NextResponse.json(healthResult);
    } catch (error) {
        logger.error('Server health check error', error, {
            route: '/api/mcp/servers/[id]/health',
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

