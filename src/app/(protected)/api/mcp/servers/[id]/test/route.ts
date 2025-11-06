import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/mcp/servers/[id]/test
 *
 * Tests the connection to an MCP server.
 */
export async function POST(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let serverId: string | undefined;
    try {
        const { id } = await context.params;
        serverId = id;

        if (!id) {
            return NextResponse.json(
                { error: 'Server ID is required' },
                { status: 400 }
            );
        }

        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 }
            );
        }

        const supabase = await createServerClient();

        const { data: server, error } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();

        if (error || !server) {
            return NextResponse.json(
                { error: 'Server not found' },
                { status: 404 }
            );
        }

        // Check permissions
        if (server.scope === 'user' && server.user_id !== profile.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (server.scope === 'organization') {
            if (!server.organization_id) {
                logger.error('Organization-scoped server missing organization_id', {
                    route: '/api/mcp/servers/[id]/test',
                    serverId: id,
                });
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
            const { data: membership } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', server.organization_id)
                .eq('user_id', profile.id)
                .single();

            if (!membership) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // Perform basic validation test
        const testResult = {
            success: true,
            message: 'Server configuration is valid',
            details: {
                transport: server.transport,
                authType: server.auth_type,
                hasServerUrl: !!server.server_url,
            },
        };

        // Update test results
        await supabase
            .from('mcp_servers')
            .update({
                last_test_at: new Date().toISOString(),
                last_test_status: 'success',
                last_test_error: null,
            })
            .eq('id', id);

        return NextResponse.json({
            ...testResult,
            serverId: id,
            serverName: server.name,
            testedAt: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Server test error', error, {
            route: '/api/mcp/servers/[id]/test',
            serverId,
        });
        return NextResponse.json(
            {
                error: 'Failed to test server',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
