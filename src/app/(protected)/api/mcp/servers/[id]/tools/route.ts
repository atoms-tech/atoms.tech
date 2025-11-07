import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { discoverTools, getToolNames, cacheDiscoveredTools } from '@/lib/services/mcp-tool-discovery';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers/[id]/tools
 * Get available tools for a server with actual discovery
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
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';

        const supabase = await createServerClient();

        // First, get user_mcp_server record to find the actual server_id
        const { data: userServer, error: userServerError } = await supabase
            .from('user_mcp_servers')
            .select('server_id')
            .eq('id', id)
            .eq('user_id', profile.id)
            .single();

        if (userServerError || !userServer) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Now fetch the actual server details
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

        // Check if we have cached tools and they're recent (unless refresh is requested)
        const metadata = (server.metadata as any) || {};
        const cachedTools = metadata.tools;
        const toolsDiscoveredAt = metadata.tools_discovered_at;

        if (!refresh && cachedTools && toolsDiscoveredAt) {
            const cacheAge = Date.now() - new Date(toolsDiscoveredAt).getTime();
            const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

            if (cacheAge < CACHE_TTL) {
                // Return cached tools
                return NextResponse.json({
                    tools: getToolNames(cachedTools),
                    toolDetails: cachedTools,
                    cached: true,
                    discoveredAt: toolsDiscoveredAt,
                });
            }
        }

        // Prepare server data for tool discovery with null handling
        const serverForTools = {
            ...server,
            transport_type: server.transport_type || 'stdio',
            url: server.url || undefined,
        };

        // Discover tools from the server
        const discoveredTools = await discoverTools(serverForTools);

        // Cache the discovered tools
        if (discoveredTools.length > 0) {
            await cacheDiscoveredTools(id, discoveredTools, supabase);
        }

        return NextResponse.json({
            tools: getToolNames(discoveredTools),
            toolDetails: discoveredTools,
            cached: false,
            discoveredAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Get tools error', error, {
            route: '/api/mcp/servers/[id]/tools',
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

