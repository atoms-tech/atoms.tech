import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';
import type { Database } from '@/types/base/database.types';

/**
 * GET /api/mcp/installed
 *
 * Fetches all MCP servers installed for the authenticated user.
 * Returns servers with their configuration, status, and metadata.
 */
export async function GET() {
    try {
        type MCPServerSelection = Pick<
            Database['public']['Tables']['mcp_servers']['Row'],
            | 'id'
            | 'name'
            | 'description'
            | 'namespace'
            | 'transport'
            | 'transport_type'
            | 'auth_type'
            | 'enabled'
            | 'scope'
            | 'user_id'
            | 'organization_id'
            | 'created_at'
            | 'updated_at'
            | 'metadata'
            | 'env'
            | 'tags'
            | 'version'
            | 'source'
            | 'category'
            | 'repository_url'
            | 'homepage_url'
            | 'documentation_url'
            | 'stars'
            | 'install_count'
        >;

        const SERVER_COLUMNS = [
            'id',
            'name',
            'description',
            'namespace',
            'transport',
            'transport_type',
            'auth_type',
            'enabled',
            'scope',
            'user_id',
            'organization_id',
            'created_at',
            'updated_at',
            'metadata',
            'env',
            'tags',
            'version',
            'source',
            'category',
            'repository_url',
            'homepage_url',
            'documentation_url',
            'stars',
            'install_count',
        ].join(',');

        const isRecord = (value: unknown): value is Record<string, unknown> =>
            typeof value === 'object' && value !== null && !Array.isArray(value);

        const toRecord = (value: unknown): Record<string, unknown> =>
            isRecord(value) ? value : {};

        const toStringArray = (value: unknown): string[] =>
            Array.isArray(value) && value.every((item) => typeof item === 'string')
                ? (value as string[])
                : [];

        const getString = (value: unknown): string | undefined =>
            typeof value === 'string' && value.length > 0 ? value : undefined;

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

        const supabase = getServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Database client unavailable' },
                { status: 500 }
            );
        }

        const organizationsRaw = (profile as { organizations?: unknown })?.organizations;
        const organizationIds = Array.isArray(organizationsRaw)
            ? organizationsRaw
                  .map((org) => (isRecord(org) ? getString(org.id) : undefined))
                  .filter((id): id is string => typeof id === 'string')
            : [];

        const { data: userServersData, error: userServersError } = await supabase
            .from('mcp_servers')
            .select(SERVER_COLUMNS)
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (userServersError) {
            console.error('Error fetching MCP servers:', userServersError);
            return NextResponse.json(
                {
                    error: 'Failed to fetch servers',
                    details: userServersError.message,
                },
                { status: 500 },
            );
        }

        let allServers: MCPServerSelection[] = (userServersData ?? []) as unknown as MCPServerSelection[];

        if (organizationIds.length > 0) {
            const { data: orgServersData, error: orgServersError } = await supabase
                .from('mcp_servers')
                .select(SERVER_COLUMNS)
                .in('organization_id', organizationIds)
                .order('created_at', { ascending: false });

            if (orgServersError) {
                console.error('Error fetching organization MCP servers:', orgServersError);
                return NextResponse.json(
                    {
                        error: 'Failed to fetch organization servers',
                        details: orgServersError.message,
                    },
                    { status: 500 },
                );
            }

            if (orgServersData) {
                allServers = [
                    ...allServers,
                    ...(orgServersData as unknown as MCPServerSelection[]),
                ];
            }
        }

        const transportTypeFrom = (value: string | undefined): 'stdio' | 'sse' | 'http' | undefined => {
            if (!value) {
                return undefined;
            }

            if (value === 'stdio' || value === 'sse' || value === 'http') {
                return value;
            }

            return undefined;
        };

        const servers = allServers.map((server) => {
            const metadata = toRecord(server.metadata);
            const envConfig = toRecord(server.env);
            const transport = toRecord(server.transport);

            const transportTypeCandidate =
                transportTypeFrom(getString(transport.type)) ??
                transportTypeFrom(getString(server.transport_type));

            const tags = Array.isArray(server.tags) ? server.tags : toStringArray(metadata.tags);

            return {
                id: server.id,
                name: server.name ?? 'Unknown',
                namespace: server.namespace ?? '',
                transport_type: transportTypeCandidate ?? 'stdio',
                auth_status:
                    server.auth_type && server.auth_type !== 'none'
                        ? 'authenticated'
                        : 'needs_auth',
                scope: server.scope ?? 'user',
                enabled: server.enabled ?? true,
                config: envConfig,
                created_at: server.created_at ?? null,
                updated_at: server.updated_at ?? null,
                last_test_at: undefined as undefined,
                last_test_status: undefined as undefined,
                last_test_error: undefined as undefined,
                description: server.description ?? null,
                version: server.version ?? getString(metadata.version) ?? '1.0.0',
                tier: getString(metadata.tier),
                category: server.category ?? getString(metadata.category) ?? null,
                tags,
                repository_url: server.repository_url ?? getString(metadata.repository) ?? null,
                homepage_url: server.homepage_url ?? getString(metadata.homepage) ?? null,
                documentation_url: server.documentation_url ?? getString(metadata.documentation_url) ?? null,
            };
        });

        return NextResponse.json({
            servers,
            count: servers.length,
        });
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
