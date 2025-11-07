import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/database';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * POST /api/mcp/fix-transport-types
 *
 * One-time fix to update transport types for servers from the new registry format
 * Only accessible by platform admins
 */
export async function POST() {
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
                message: 'Only platform admins can run this maintenance operation'
            }, { status: 403 });
        }

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
        }

        // Fetch registry data
        const registryUrl = 'https://registry.modelcontextprotocol.io/v0.1/servers';
        let response;

        try {
            response = await fetch(registryUrl);
        } catch (fetchError) {
            console.error('Failed to fetch registry:', fetchError);
            return NextResponse.json({
                error: 'Failed to fetch registry',
                details: fetchError instanceof Error ? fetchError.message : 'Network error'
            }, { status: 500 });
        }

        if (!response.ok) {
            console.error('Registry returned error:', response.status, response.statusText);
            return NextResponse.json({
                error: 'Failed to fetch registry',
                details: `Registry returned ${response.status}`
            }, { status: 500 });
        }

        let registryData;
        try {
            registryData = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse registry JSON:', jsonError);
            return NextResponse.json({
                error: 'Invalid registry response',
                details: 'Could not parse JSON'
            }, { status: 500 });
        }

        const servers = registryData.servers || [];

        // Get all MCP servers in the database
        const { data: dbServers, error: fetchError } = await supabase
            .from('mcp_servers')
            .select('id, namespace, transport_type, url');

        if (fetchError) {
            console.error('Failed to fetch servers from database:', fetchError);
            return NextResponse.json({
                error: 'Failed to fetch servers',
                details: fetchError.message
            }, { status: 500 });
        }

        if (!dbServers || dbServers.length === 0) {
            return NextResponse.json({
                message: 'No servers found in database',
                updates: [],
                count: 0
            });
        }

        console.log(`Processing ${dbServers.length} servers from database`);

        const updates: Array<{ id: string; namespace: string; old: string; new: string; url: string | null }> = [];

        for (const dbServer of dbServers || []) {
            // Find matching server in registry
            const registryServer = servers.find((s: any) => s.server?.name === dbServer.namespace);

            if (!registryServer?.server) {
                continue;
            }

            const server = registryServer.server;

            // Check if server has remotes (new format)
            if (server.remotes && Array.isArray(server.remotes) && server.remotes.length > 0) {
                const remote = server.remotes[0];
                const remoteType = remote.type;
                const serverUrl = remote.url || null;

                let correctTransportType: 'http' | 'sse' | 'stdio' = 'stdio';

                if (remoteType === 'streamable-http' || remoteType === 'http') {
                    correctTransportType = 'http';
                } else if (remoteType === 'sse') {
                    correctTransportType = 'sse';
                }

                // Check if current URL is invalid (empty, JSON object, or GitHub URL)
                let needsUpdate = dbServer.transport_type !== correctTransportType;

                if (dbServer.url) {
                    const currentUrl = String(dbServer.url);
                    const isInvalid =
                        currentUrl === '{}' ||
                        currentUrl.startsWith('{"url":') ||
                        currentUrl.includes('github.com') ||
                        currentUrl.includes('gitlab.com');

                    if (isInvalid) {
                        needsUpdate = true;
                    }
                } else {
                    needsUpdate = true; // No URL set
                }

                // Update if transport type is wrong or URL is invalid/missing
                if (needsUpdate) {
                    try {
                        const { error: updateError } = await supabase
                            .from('mcp_servers')
                            .update({
                                transport_type: correctTransportType,
                                url: serverUrl, // Use 'url' column, not 'server_url'
                            })
                            .eq('id', dbServer.id);

                        if (updateError) {
                            console.error(`Failed to update server ${dbServer.namespace}:`, updateError);
                        } else {
                            updates.push({
                                id: dbServer.id,
                                namespace: dbServer.namespace,
                                old: dbServer.transport_type || 'unknown',
                                new: correctTransportType,
                                url: serverUrl,
                            });
                            console.log(`✅ Updated ${dbServer.namespace}: ${dbServer.transport_type} → ${correctTransportType}`);
                        }
                    } catch (updateError) {
                        console.error(`Exception updating server ${dbServer.namespace}:`, updateError);
                    }
                }
            }
        }

        return NextResponse.json({
            message: 'Transport types updated',
            updates,
            count: updates.length,
        });
    } catch (error) {
        console.error('Error fixing transport types:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
