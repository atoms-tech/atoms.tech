import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import type { Database } from '@/types/base/database.types';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers
 * List MCP servers based on user's access level
 */
type UserMcpServerWithDetails = Database['public']['Tables']['user_mcp_servers']['Row'] & {
  server: Pick<
    Database['public']['Tables']['mcp_servers']['Row'],
    | 'id'
    | 'name'
    | 'homepage_url'
    | 'transport_type'
    | 'auth_type'
    | 'scope'
  > | null;
};

type MCPServerInsert = Database['public']['Tables']['mcp_servers']['Insert'];

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Query user's installed servers from user_mcp_servers junction table
    let query = supabase
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
          name,
          homepage_url,
          transport_type,
          auth_type,
          scope
        )
      `)
      .eq('user_id', profile.id)
      .eq('enabled', true);

    // Filter by organization if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: userServers, error } = await query.order('installed_at', {
        ascending: false,
      });

    if (error) {
      logger.error('Error fetching MCP servers', error, {
        route: '/api/mcp/servers',
        organizationId,
      });
      return NextResponse.json(
        { error: 'Failed to fetch servers', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match the expected MCPServer interface
      const typedServers = (userServers ?? []) as UserMcpServerWithDetails[];

      // Filter out servers where the join failed (server is null)
      const validServers = typedServers.filter((userServer) => {
        if (!userServer.server) {
          logger.warn('Server join failed - orphaned user_mcp_servers record', {
            route: '/api/mcp/servers',
            userServerId: userServer.id,
            userId: profile.id,
          });
          return false;
        }
        return true;
      });

      const servers = validServers.map((userServer) => {
        const serverDetails = userServer.server!;

        return {
          id: userServer.id,
          user_id: profile.id,
          name: serverDetails.name ?? 'Unknown Server',
          url: serverDetails.homepage_url || 'stdio://local',
          transport: serverDetails.transport_type || 'stdio',
          auth: serverDetails.auth_type || 'none',
          scope: serverDetails.scope || 'user',
          organization_id: userServer.organization_id || undefined,
          tool_permissions: {}, // Empty permissions object
          status: userServer.enabled ? 'running' : 'stopped',
          last_health_check: null,
          health_check_error: null,
          created_at: userServer.installed_at,
          updated_at: userServer.installed_at, // Using installed_at as updated_at
        };
      });

    logger.info('Fetched MCP servers', {
      route: '/api/mcp/servers',
      userId: profile.id,
      serverCount: servers.length,
      filteredCount: typedServers.length - validServers.length,
      serverIds: servers.map(s => s.id),
    });

    return NextResponse.json({ servers });
  } catch (error) {
    logger.error('MCP servers GET error', error, { route: '/api/mcp/servers' });
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
 * POST /api/mcp/servers
 * Create a new MCP server configuration
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

    const body = await request.json();
    const {
      name,
      description,
      serverUrl,
      transport,
      authType,
      scope,
      bearerToken,
      stdioCommand,
      environmentVariables,
      workingDirectory,
      organizationId,
    } = body;

    // Validate required fields
    if (!name || !transport || !authType || !scope) {
      return NextResponse.json(
        { error: 'Missing required fields: name, transport, authType, scope' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Check if user is platform admin for system scope
    if (scope === 'system') {
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Only platform admins can create system-scoped servers' },
          { status: 403 }
        );
      }
    }

    // Validate transport restrictions
    if (scope !== 'system' && transport === 'stdio') {
      return NextResponse.json(
        { error: 'STDIO transport is only available for system scope' },
        { status: 400 }
      );
    }

    // Validate auth requirements
    if (scope !== 'system' && authType === 'none') {
      return NextResponse.json(
        { error: 'User and organization scopes require authentication' },
        { status: 400 }
      );
    }

    // Validate URL for non-stdio transports
    if (transport !== 'stdio' && !serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required for SSE and HTTP transports' },
        { status: 400 }
      );
    }

    // Validate command for stdio transport
    if (transport === 'stdio' && !stdioCommand) {
      return NextResponse.json(
        { error: 'Command is required for STDIO transport' },
        { status: 400 }
      );
    }

    // Validate bearer token if using bearer auth
    if (authType === 'bearer' && !bearerToken) {
      return NextResponse.json(
        { error: 'Bearer token is required for bearer authentication' },
        { status: 400 }
      );
    }

    // Validate organization access if org scope
    if (scope === 'organization') {
      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID is required for organization scope' },
          { status: 400 }
        );
      }

      // Check if user is member of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', profile.id)
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this organization' },
          { status: 403 }
        );
      }
    }

      const now = new Date().toISOString();
      const slugify = (value: string) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60);

      const namespace = `user:${profile.id}:${slugify(name) || 'server'}`;

      const transportConfig =
        transport === 'stdio'
          ? {
              type: 'stdio',
              command: stdioCommand,
              args: [],
              env: environmentVariables ?? {},
              cwd: workingDirectory ?? null,
            }
          : {
              type: transport,
              url: serverUrl,
            };

      const authTypeNormalized = authType === 'none' ? null : authType;

      const authConfig =
        authType === 'bearer'
          ? { bearerToken }
          : authType === 'oauth'
            ? { oauthConfigured: false }
            : null;

      const stdioConfig =
        transport === 'stdio'
          ? {
              command: stdioCommand,
              workingDirectory: workingDirectory ?? null,
              environmentVariables: environmentVariables ?? {},
            }
          : null;

      const serverConfig: MCPServerInsert = {
        namespace,
        name,
        description: description ?? null,
        version: '1.0.0',
        transport_type:
          transportConfig.type === 'http' || transportConfig.type === 'sse' ? transportConfig.type : 'stdio',
        transport: JSON.stringify(transportConfig),
        source: 'custom',
        tier: 'community',
        enabled: true,
        url: serverUrl || 'stdio://local',
        auth_type: authTypeNormalized,
        auth_config: authConfig,
        tags: [],
        category: null,
        scope,
        user_id: scope === 'user' ? profile.id : null,
        organization_id: scope === 'organization' ? organizationId ?? null : null,
        project_id: null,
        created_by: profile.id,
        created_at: now,
        updated_at: now,
        metadata: null,
        env: transport === 'stdio' ? (environmentVariables ?? {}) : null,
        transport_config: stdioConfig,
      };

      // Insert server configuration
      const { data: server, error } = await supabase
        .from('mcp_servers')
        .insert(serverConfig)
        .select()
        .single();

  if (error) {
      logger.error('Error creating MCP server', error, {
        route: '/api/mcp/servers',
        scope,
      });
      return NextResponse.json(
        { error: 'Failed to create server', details: error.message },
        { status: 500 }
      );
  }

      // Generate MCP configuration
      const serverName = server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      let mcpConfig: Record<string, unknown> = {};

      const serverTransport = server.transport as Record<string, unknown> | null;
      const serverTransportType = (() => {
        if (typeof server.transport_type === 'string' && server.transport_type.length > 0) {
          return server.transport_type;
        }

        if (typeof serverTransport?.type === 'string') {
          return serverTransport.type;
        }

        return 'stdio';
      })() as 'stdio' | 'sse' | 'http';

      if (serverTransportType === 'stdio') {
        const transportConfig = server.transport_config as {
          command?: string;
          args?: string[];
          environmentVariables?: Record<string, string>;
        } | null;

        mcpConfig = {
          [serverName]: {
            command: transportConfig?.command || '',
            args: transportConfig?.args || [],
            env: transportConfig?.environmentVariables || {},
          },
        };
      } else if (serverTransportType === 'sse' || serverTransportType === 'http') {
        const config: Record<string, unknown> = {
          type: serverTransportType,
          url:
            (typeof serverTransport?.url === 'string' && serverTransport.url.length > 0
              ? serverTransport.url
              : server.url) ?? null,
        };

        const headers: Record<string, string> = {};

        const authConfig = server.auth_config as { bearerToken?: string } | null;
        if (server.auth_type === 'bearer' && authConfig?.bearerToken) {
          headers['Authorization'] = `Bearer ${authConfig.bearerToken}`;
        }

        if (Object.keys(headers).length > 0) {
          config.headers = headers;
        }

        mcpConfig = {
          [serverName]: config,
        };
      }

    // Note: mcp_config is not a column in the database
    // MCP configuration is generated on-the-fly from server settings

    return NextResponse.json(
      { 
        server: { ...server, mcp_config: mcpConfig },
        mcpConfig,
        message: 'MCP server created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('MCP servers POST error', error, { route: '/api/mcp/servers' });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
