import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/fix-servers
 * Fix incorrectly configured MCP servers
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const supabase = await createServerClient();

        // Get servers that need fixing (HTTP servers incorrectly marked as stdio)
        const { data: serversToFix, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('id, namespace, server_url, url, homepage_url, transport_type, auth_type')
            .in('namespace', ['ai.klavis/strata', 'ai.mcpcap/mcpcap', 'ai.alpic.test/test-mcp-server'])
            .eq('transport_type', 'stdio');

        if (fetchError) {
            logger.error('Error fetching servers to fix', fetchError);
            return NextResponse.json({ error: 'Failed to fetch servers' }, { status: 500 });
        }

        if (!serversToFix || serversToFix.length === 0) {
            return NextResponse.json({ message: 'No servers need fixing' }, { status: 200 });
        }

        // Update each server
        const updates = serversToFix.map(server => {
            const hasHttpUrl = server.server_url?.startsWith('http') || 
                            server.url?.startsWith('http') || 
                            server.homepage_url?.startsWith('http');
            
            return {
                id: server.id,
                transport_type: hasHttpUrl ? 'http' : 'stdio',
                auth_type: 'none' // These marketplace servers don't require auth
            };
        });

        // Apply updates
        const { error: updateError } = await supabase
            .from('mcp_servers')
            .upsert(updates, { onConflict: 'id' });

        if (updateError) {
            logger.error('Error updating servers', updateError);
            return NextResponse.json({ error: 'Failed to update servers' }, { status: 500 });
        }

        return NextResponse.json({ 
            message: `Fixed ${serversToFix.length} servers`,
            updated: updates 
        }, { status: 200 });

    } catch (error) {
        logger.error('Fix servers error', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
