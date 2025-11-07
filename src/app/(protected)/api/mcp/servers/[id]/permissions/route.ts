import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { toolPermissionsSchema } from '@/lib/schemas/mcp-install';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers/[id]/permissions
 * Get tool permissions for a server
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

        // Get tool permissions from metadata or return empty object
        const toolPermissions = (server.metadata as any)?.tool_permissions || {};

        return NextResponse.json({ tool_permissions: toolPermissions });
    } catch (error) {
        logger.error('Get permissions error', error, {
            route: '/api/mcp/servers/[id]/permissions',
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
 * PATCH /api/mcp/servers/[id]/permissions
 * Update tool permissions for a server
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
        const { tool_permissions } = body;

        // Validate permissions
        const validatedPermissions = toolPermissionsSchema.parse(tool_permissions);

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

        // Update metadata with tool permissions
        const currentMetadata = (server.metadata as Record<string, any>) || {};
        const updatedMetadata = {
            ...currentMetadata,
            tool_permissions: validatedPermissions as any, // Cast to any to bypass type checking
        };

        const { data: updatedServer, error: updateError } = await supabase
            .from('mcp_servers')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            logger.error('Error updating permissions', updateError, {
                route: '/api/mcp/servers/[id]/permissions',
                serverId: id,
            });
            return NextResponse.json(
                { error: 'Failed to update permissions', details: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            server: updatedServer,
            message: 'Permissions updated successfully',
        });
    } catch (error) {
        logger.error('Update permissions error', error, {
            route: '/api/mcp/servers/[id]/permissions',
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

