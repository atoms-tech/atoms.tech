import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/supabase/supabaseServer';
import { logger } from '@/lib/utils/logger';

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

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const organizationId = searchParams.get('organizationId');

    // Build query based on scope
    let query = supabase
      .from('mcp_servers')
      .select('*')
      .eq('is_deleted', false);

    if (scope === 'user') {
      query = query.eq('scope', 'user').eq('user_id', profile.id);
    } else if (scope === 'organization' && organizationId) {
      query = query.eq('scope', 'organization').eq('organization_id', organizationId);
    } else if (scope === 'system') {
      // Check if user is platform admin
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        // Regular users can see system servers but not filtered to just system
        query = query.eq('scope', 'system');
      } else {
        // Platform admins can see all system servers
        query = query.eq('scope', 'system');
      }
    } else {
      // Return all servers user has access to
      query = query.or(
        `and(scope.eq.user,user_id.eq.${profile.id}),scope.eq.system${
          organizationId ? `,and(scope.eq.organization,organization_id.eq.${organizationId})` : ''
        }`
      );
    }

    const { data: servers, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      logger.error('Error fetching MCP servers', error, {
        route: '/api/mcp/servers',
        scope,
        organizationId,
      });
      return NextResponse.json(
        { error: 'Failed to fetch servers', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ servers: servers || [] });
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

    const supabase = await createClient();

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
    const serverConfig: Record<string, unknown> = {
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
    };

    // Add transport-specific configuration
    if (transport === 'stdio') {
      serverConfig.stdio_config = {
        command: stdioCommand,
        workingDirectory: workingDirectory || null,
        environmentVariables: environmentVariables || {},
      };
    }

    // Add auth-specific configuration
    if (authType === 'bearer') {
      // In production, encrypt the bearer token before storing
      serverConfig.auth_config = {
        bearerToken: bearerToken, // TODO: Encrypt this
      };
    } else if (authType === 'oauth') {
      serverConfig.auth_config = {
        oauthConfigured: false,
        // OAuth configuration will be added separately
      };
    }

    // Insert server configuration
    const { data: server, error } = await supabase
      .from('mcp_servers')
    .insert([serverConfig])
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

    return NextResponse.json(
      { server, message: 'MCP server created successfully' },
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
