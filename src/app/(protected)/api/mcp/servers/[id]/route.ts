import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import type { Database } from '@/types/base/database.types';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/mcp/servers/[id]
 * Get details for a specific MCP server
 */
export async function GET(
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
        const supabase = await createServerClient();

        // Query user_mcp_servers with server details
        const { data: userServer, error } = await supabase
            .from('user_mcp_servers')
            .select(`
                id,
                enabled,
                installed_at,
                last_used_at,
                usage_count,
                organization_id,
                server:mcp_servers (
                    id,
                    namespace,
                    name,
                    description,
                    version,
                    tier,
                    category,
                    tags,
                    enabled,
                    transport,
                    transport_type,
                    transport_config,
                    auth_type,
                    auth_config,
                    scope,
                    url,
                    homepage_url,
                    env,
                    metadata,
                    status,
                    health_check_error,
                    last_health_check,
                    created_at,
                    updated_at
                )
            `)
            .eq('id', id)
            .eq('user_id', profile.id)
            .single();

        if (error || !userServer) {
            logger.error('Server not found', error, {
                route: '/api/mcp/servers/[id]',
                serverId: id,
                userId: profile.id,
                errorDetails: error,
            });
            return NextResponse.json({ error: 'Server not found' }, { status: 404 });
        }

        // Transform the data to match the expected interface
        const serverDetails = userServer.server;
        const transportType = serverDetails?.transport_type || 'stdio';
        const authType = serverDetails?.auth_type || 'none';



        return NextResponse.json({
            id: userServer.id,
            server_id: serverDetails?.id,
            user_id: profile.id,
            namespace: serverDetails?.namespace,
            name: serverDetails?.name || 'Unknown Server',
            description: serverDetails?.description,
            version: serverDetails?.version,
            url: serverDetails?.homepage_url || serverDetails?.url || 'stdio://local',
            transport: transportType,
            transport_config: serverDetails?.transport_config,
            auth: authType,
            auth_config: serverDetails?.auth_config,
            scope: serverDetails?.scope || 'user',
            organization_id: userServer.organization_id || undefined,
            env: serverDetails?.env,
            metadata: serverDetails?.metadata,
            tool_permissions: {}, // Empty permissions object
            status: serverDetails?.status || (userServer.enabled ? 'running' : 'stopped'),
            last_health_check: serverDetails?.last_health_check,
            health_check_error: serverDetails?.health_check_error,
            created_at: userServer.installed_at,
            updated_at: userServer.installed_at,
        });
    } catch (error) {
        logger.error('MCP server GET error', error, {
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

/**
 * DELETE /api/mcp/servers/[id]
 *
 * Uninstall an MCP server (removes from user_mcp_servers)
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
        const supabase = await createServerClient();

        // Delete from user_mcp_servers (uninstall for this user)
        // The [id] param is the user_mcp_servers.id, not mcp_servers.id
        const { error: deleteError } = await supabase
            .from('user_mcp_servers')
            .delete()
            .eq('id', id)
            .eq('user_id', profile.id);

        if (deleteError) {
            logger.error('Error uninstalling MCP server', deleteError, {
                route: '/api/mcp/servers/[id]',
                serverId: id,
            });
            return NextResponse.json(
                { error: 'Failed to uninstall server', details: deleteError.message },
                { status: 500 }
            );
        }

        logger.info('MCP server uninstalled', {
            route: '/api/mcp/servers/[id]',
            userServerId: id,
            userId: profile.id,
        });

        return NextResponse.json({
            message: 'Server uninstalled successfully',
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
