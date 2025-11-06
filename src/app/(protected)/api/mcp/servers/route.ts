import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient as _createClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers
 * List MCP servers based on user's access level
 */
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
          namespace,
          name,
          description,
          version,
          tier,
          category,
          tags,
          enabled,
          repository_url,
          homepage_url,
          documentation_url
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

    // Transform the data to flatten server info
    const servers = (userServers || []).map((us: { [key: string]: unknown }) => ({
      id: us.id,
      namespace: us.server?.namespace,
      name: us.server?.name,
      description: us.server?.description,
      version: us.server?.version,
      tier: us.server?.tier,
      category: us.server?.category,
      tags: us.server?.tags,
      enabled: us.enabled,
      repository_url: us.server?.repository_url,
      homepage_url: us.server?.homepage_url,
      documentation_url: us.server?.documentation_url,
      installed_at: us.installed_at,
      last_used_at: us.last_used_at,
      usage_count: us.usage_count,
      organization_id: us.organization_id,
    }));

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

    // Prepare server configuration
    const serverConfig = {
      name,
      description: description || null,
      server_url: serverUrl || null,
      transport,
      auth_type: authType,
      scope,
      user_id: scope === 'user' ? profile.id : null,
      organization_id: scope === 'organization' ? organizationId : null,
      created_by: profile.id,
      updated_by: profile.id,
      stdio_config: transport === 'stdio' ? {
        command: stdioCommand,
        workingDirectory: workingDirectory || null,
        environmentVariables: environmentVariables || {},
      } : null,
      auth_config: authType === 'bearer' ? {
        bearerToken: bearerToken, // TODO: Encrypt this
      } : authType === 'oauth' ? {
        oauthConfigured: false,
        // OAuth configuration will be added separately
      } : null,
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

    if (server.transport === 'stdio') {
        const stdioConfig = server.stdio_config as { command?: string; args?: string[]; environmentVariables?: Record<string, string> } | null;
        mcpConfig = {
            [serverName]: {
                command: stdioConfig?.command || '',
                args: stdioConfig?.args || [],
                env: stdioConfig?.environmentVariables || {},
            },
        };
    } else if (server.transport === 'sse' || server.transport === 'http') {
        const config: Record<string, unknown> = {
            type: server.transport,
            url: server.server_url,
        };

        const headers: Record<string, string> = {};

        const authConfig = server.auth_config as { bearerToken?: string } | null;
        if (server.auth_type === 'bearer' && authConfig?.bearerToken) {
            headers['Authorization'] = `Bearer ${authConfig.bearerToken}`;
        } else if (server.auth_type === 'oauth') {
            // OAuth is now handled by MCP servers themselves
            // No proxy needed
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
