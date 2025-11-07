import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers/[id]/logs
 * Get server logs with pagination and filtering
 * Uses authenticated client with RLS policies
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
        const level = searchParams.get('level');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Use authenticated client - RLS will handle permissions
        const supabase = await createServerClient();

        // First get user_mcp_server record to find the actual server_id
        // The [id] param is user_mcp_servers.id, not mcp_servers.id
        const { data: userServer, error: userServerError } = await supabase
            .from('user_mcp_servers')
            .select('server_id')
            .eq('id', id)
            .eq('user_id', profile.id)
            .single();

        if (userServerError || !userServer) {
            return NextResponse.json({ error: 'Server not found or access denied' }, { status: 404 });
        }

        const serverId = userServer.server_id;

        // Query logs - RLS policy will filter to user's logs automatically
        let query = supabase
            .from('mcp_server_usage_logs')
            .select('*', { count: 'exact' })
            .eq('server_id', serverId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (level && level !== 'all') {
            query = query.eq('level', level);
        }

        const { data: logs, error: logsError, count } = await query;

        if (logsError) {
            // If RLS policy not applied yet, provide helpful message
            logger.warn('Server logs query failed (may need RLS policy)', {
                serverId: id,
                error: logsError.message,
                code: (logsError as any).code,
            });
            return NextResponse.json({
                logs: [],
                total: 0,
                message: 'Logs unavailable - apply RLS policies from fix_mcp_rls_policies.sql',
            });
        }

        return NextResponse.json({
            logs: logs || [],
            total: count || 0,
        });
    } catch (error) {
        logger.error('Server logs error', error, {
            route: '/api/mcp/servers/[id]/logs',
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

