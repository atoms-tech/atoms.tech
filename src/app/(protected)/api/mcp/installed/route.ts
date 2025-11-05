import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/mcp/installed
 *
 * Fetches all MCP servers installed for the authenticated user.
 * Returns servers with their configuration, status, and metadata.
 */
export async function GET() {
    try {
        // Authenticate user
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get or create user profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 }
            );
        }

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Database client unavailable' },
                { status: 500 }
            );
        }

        // Fetch user's MCP servers directly from mcp_servers table
        // Query servers where user_id matches or organization_id matches
        let query = supabase
            .from('mcp_servers')
            .select(`
                id,
                name,
                description,
                namespace,
                transport,
                auth_type,
                enabled,
                scope,
                user_id,
                organization_id,
                created_at,
                updated_at,
                metadata,
                env,
                tags,
                version,
                source,
                category,
                repository_url,
                homepage_url,
                documentation_url,
                stars,
                install_count
            `)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        const organizations: Array<{ id: string }> = Array.isArray((profile as any)?.organizations)
            ? (profile as any).organizations
            : [];

        // Also get organization servers if user has organizations
        if (organizations.length > 0) {
            const { data: orgServers } = await supabase
                .from('mcp_servers')
                .select(`
                    id,
                    name,
                    description,
                    namespace,
                    transport,
                    auth_type,
                    enabled,
                    scope,
                    user_id,
                    organization_id,
                    created_at,
                    updated_at,
                    metadata,
                    env,
                    tags,
                    version,
                    source,
                    category,
                    repository_url,
                    homepage_url,
                    documentation_url,
                    stars,
                    install_count
                `)
                .in('organization_id', organizations.map((o) => o.id))
                .order('created_at', { ascending: false });

            const { data: userServers, error } = await query;
            
            if (error) {
                console.error('Error fetching MCP servers:', error);
                return NextResponse.json(
                    {
                        error: 'Failed to fetch servers',
                        details: error.message
                    },
                    { status: 500 }
                );
            }

            // Combine user and organization servers
            const allServers = [...(userServers || []), ...(orgServers || [])];
            
            // Transform the data to match the expected format
            const servers = allServers.map((server: any) => ({
                id: server.id,
                name: server.name || 'Unknown',
                namespace: server.namespace || '',
                transport_type: server.transport || 'stdio',
                auth_status: server.auth_type && server.auth_type !== 'none' ? 'authenticated' : 'needs_auth',
                scope: server.scope || 'user',
                enabled: server.enabled !== false,
                config: server.env || {},
                created_at: server.created_at,
                updated_at: server.updated_at,
                last_test_at: undefined,
                last_test_status: undefined,
                last_test_error: undefined,
                // Additional server info from metadata and columns
                description: server.description,
                version: server.version || server.metadata?.version,
                tier: server.metadata?.tier,
                category: server.category || server.metadata?.category,
                tags: server.tags || server.metadata?.tags || [],
                repository_url: server.repository_url || server.metadata?.repository,
                homepage_url: server.homepage_url || server.metadata?.homepage,
                documentation_url: server.documentation_url || server.metadata?.documentation_url,
            }));

            return NextResponse.json({
                servers,
                count: servers.length,
            });
        } else {
            const { data: userServers, error } = await query;
            
            if (error) {
                console.error('Error fetching MCP servers:', error);
                return NextResponse.json(
                    {
                        error: 'Failed to fetch servers',
                        details: error.message
                    },
                    { status: 500 }
                );
            }

            // Transform the data to match the expected format
            const servers = (userServers || []).map((server: any) => ({
                id: server.id,
                name: server.name || 'Unknown',
                namespace: server.namespace || '',
                transport_type: server.transport || 'stdio',
                auth_status: server.auth_type && server.auth_type !== 'none' ? 'authenticated' : 'needs_auth',
                scope: server.scope || 'user',
                enabled: server.enabled !== false,
                config: server.env || {},
                created_at: server.created_at,
                updated_at: server.updated_at,
                last_test_at: undefined,
                last_test_status: undefined,
                last_test_error: undefined,
                // Additional server info from metadata and columns
                description: server.description,
                version: server.version || server.metadata?.version,
                tier: server.metadata?.tier,
                category: server.category || server.metadata?.category,
                tags: server.tags || server.metadata?.tags || [],
                repository_url: server.repository_url || server.metadata?.repository,
                homepage_url: server.homepage_url || server.metadata?.homepage,
                documentation_url: server.documentation_url || server.metadata?.documentation_url,
            }));

            return NextResponse.json({
                servers,
                count: servers.length,
            });
        }
    } catch (error) {
        console.error('API error in GET /api/mcp/installed:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch installed servers',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
