import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';
import { validateMCPServerURL } from '@/lib/utils/mcp-url-validation';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

interface CleanupResult {
    serverId: string;
    namespace: string;
    issue: string;
    action: 'deleted' | 'skipped';
    reason?: string;
}

/**
 * POST /api/platform/admin/cleanup-mcp-servers
 * 
 * Clean up misconfigured MCP servers
 * - Servers with invalid URLs (GitHub repos, placeholders, etc.)
 * - Servers with missing URLs for HTTP/SSE transport
 * - Duplicate servers
 * 
 * Only accessible by platform admins
 */
export async function POST(request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is platform admin
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        if (!isPlatformAdmin) {
            return NextResponse.json({ 
                error: 'Forbidden: Platform admin required',
                message: 'Only platform admins can run cleanup operations'
            }, { status: 403 });
        }

        const body = await request.json();
        const { dryRun = true } = body; // Default to dry run for safety

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
        }

        // Fetch all servers
        const { data: servers, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('id, namespace, name, transport_type, url, scope, enabled')
            .eq('enabled', true);

        if (fetchError) {
            logger.error('Failed to fetch MCP servers', fetchError, {
                route: '/api/platform/admin/cleanup-mcp-servers',
            });
            return NextResponse.json({ 
                error: 'Failed to fetch servers',
                details: fetchError.message 
            }, { status: 500 });
        }

        const results: CleanupResult[] = [];
        let deletedCount = 0;
        let skippedCount = 0;

        for (const server of servers || []) {
            let shouldDelete = false;
            let issue = '';

            // Check for invalid URLs in HTTP/SSE servers
            if (server.transport_type === 'http' || server.transport_type === 'sse') {
                const validation = validateMCPServerURL(server.url, server.transport_type);

                if (!validation.valid) {
                    shouldDelete = true;
                    issue = validation.error || 'Invalid URL';
                }
            }

            // Check for missing URLs
            if ((server.transport_type === 'http' || server.transport_type === 'sse') && !server.url) {
                shouldDelete = true;
                issue = 'Missing URL for HTTP/SSE transport';
            }

            if (shouldDelete) {
                if (dryRun) {
                    results.push({
                        serverId: server.id,
                        namespace: server.namespace,
                        issue,
                        action: 'skipped',
                        reason: 'Dry run mode',
                    });
                    skippedCount++;
                } else {
                    // Disable the server (soft delete)
                    const { error: deleteError } = await supabase
                        .from('mcp_servers')
                        .update({ enabled: false })
                        .eq('id', server.id);

                    if (deleteError) {
                        logger.error('Failed to disable misconfigured server', deleteError, {
                            route: '/api/platform/admin/cleanup-mcp-servers',
                            serverId: server.id,
                        });
                        results.push({
                            serverId: server.id,
                            namespace: server.namespace,
                            issue,
                            action: 'skipped',
                            reason: `Disable failed: ${deleteError.message}`,
                        });
                        skippedCount++;
                    } else {
                        results.push({
                            serverId: server.id,
                            namespace: server.namespace,
                            issue,
                            action: 'deleted',
                        });
                        deletedCount++;

                        logger.info('Disabled misconfigured MCP server', {
                            route: '/api/platform/admin/cleanup-mcp-servers',
                            serverId: server.id,
                            namespace: server.namespace,
                            issue,
                        });
                    }
                }
            }
        }

        return NextResponse.json({
            message: dryRun ? 'Dry run completed' : 'Cleanup completed',
            dryRun,
            summary: {
                total: servers?.length || 0,
                deleted: deletedCount,
                skipped: skippedCount,
            },
            results,
        });
    } catch (error) {
        logger.error('Error cleaning up MCP servers', error, {
            route: '/api/platform/admin/cleanup-mcp-servers',
        });
        return NextResponse.json(
            {
                error: 'Failed to cleanup servers',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

