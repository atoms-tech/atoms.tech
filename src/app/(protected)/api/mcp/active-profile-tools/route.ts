import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';

/**
 * GET /api/mcp/active-profile-tools
 *
 * Returns all enabled tools from the active MCP profile
 * Used by the chat agent to dynamically load MCP tools
 */
export async function GET() {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not provisioned' }, { status: 409 });
        }

        const supabase = getServiceRoleClient();

        if (!supabase) {
            return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
        }

        // Get the active MCP profile ID from user preferences
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', profile.id)
            .single();

        const preferences = (userProfile?.preferences as Record<string, any>) || {};
        const activeMcpProfileId = preferences.activeMcpProfileId;

        if (!activeMcpProfileId) {
            // No active profile
            return NextResponse.json({
                tools: [],
                servers: [],
                message: 'No active MCP profile',
            });
        }

        // Fetch the active profile with its servers
        const { data: mcpProfile, error: profileError } = await supabase
            .from('mcp_profiles')
            .select('*')
            .eq('id', activeMcpProfileId)
            .eq('user_id', profile.id)
            .single();

        if (profileError || !mcpProfile) {
            console.error('Error fetching active MCP profile:', profileError);
            return NextResponse.json({
                tools: [],
                servers: [],
                message: 'Active profile not found',
            });
        }

        const servers = (mcpProfile.servers as any[]) || [];

        // Collect all enabled tools from all enabled servers
        const allTools: Array<{
            name: string;
            description?: string;
            serverId: string;
            serverName: string;
            namespace: string;
        }> = [];

        for (const server of servers) {
            if (server.enabled && Array.isArray(server.tools)) {
                const enabledTools = server.tools
                    .filter((tool: any) => tool.enabled)
                    .map((tool: any) => ({
                        name: tool.name,
                        description: tool.description,
                        serverId: server.serverId,
                        serverName: server.serverName,
                        namespace: server.namespace,
                    }));

                allTools.push(...enabledTools);
            }
        }

        // Get server details for connection info
        const serverIds = servers
            .filter(s => s.enabled)
            .map(s => s.serverId);

        const { data: serverDetails } = await supabase
            .from('mcp_servers')
            .select('id, name, namespace, transport_type, transport, server_url, auth_type, auth_config')
            .in('id', serverIds);

        return NextResponse.json({
            profileId: activeMcpProfileId,
            profileName: mcpProfile.name,
            tools: allTools,
            servers: serverDetails || [],
            count: allTools.length,
        });
    } catch (error) {
        console.error('Error in GET /api/mcp/active-profile-tools:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
