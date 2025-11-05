import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/supabase/supabaseServer';

/**
 * GET /api/mcp/servers/[id]
 * Get a specific MCP server configuration
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
    const supabase = await createClient();

    // Fetch the server
    const { data: server, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check access based on scope
    if (server.scope === 'user' && server.user_id !== profile.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (server.scope === 'organization') {
      if (!server.organization_id) {
        console.error('Organization-scoped server missing organization_id', { serverId: id });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      // Check if user is member of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', server.organization_id)
        .eq('user_id', profile.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // System scope servers are accessible to all users
    // But only platform admins can see full configuration

    if (server.scope === 'system') {
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        // Regular users can see system servers but with limited info
        const {
          auth_config: _authConfig,
          stdio_config: _stdioConfig,
          ...publicServer
        } = server;
        return NextResponse.json({ server: publicServer });
      }
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('MCP server GET error:', error);
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
 * PUT /api/mcp/servers/[id]
 * Update an MCP server configuration
 */
export async function PUT(
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
    const supabase = await createClient();

    // Fetch existing server
    const { data: existingServer, error: fetchError } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check update permissions based on scope
    if (existingServer.scope === 'user' && existingServer.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Only the owner can update this server' },
        { status: 403 }
      );
    }

    if (existingServer.scope === 'organization') {
      if (!existingServer.organization_id) {
        console.error('Organization-scoped server missing organization_id', { serverId: id });
        return NextResponse.json(
          { error: 'Only organization admins can update this server' },
          { status: 403 }
        );
      }
      // Check if user is admin of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', existingServer.organization_id)
        .eq('user_id', profile.id)
        .single();

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only organization admins can update this server' },
          { status: 403 }
        );
      }
    }

    if (existingServer.scope === 'system') {
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Only platform admins can update system servers' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      name,
      description,
      serverUrl,
      transport,
      authType,
      bearerToken,
      stdioCommand,
      environmentVariables,
      workingDirectory,
    } = body;

    // Validate transport restrictions
    if (existingServer.scope !== 'system' && transport === 'stdio') {
      return NextResponse.json(
        { error: 'STDIO transport is only available for system scope' },
        { status: 400 }
      );
    }

    // Validate auth requirements
    if (existingServer.scope !== 'system' && authType === 'none') {
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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (serverUrl !== undefined) updateData.server_url = serverUrl;
    if (transport !== undefined) updateData.transport = transport;
    if (authType !== undefined) updateData.auth_type = authType;

    // Update transport-specific configuration
    if (transport === 'stdio') {
      updateData.stdio_config = {
        command: stdioCommand,
        workingDirectory: workingDirectory || null,
        environmentVariables: environmentVariables || {},
      };
    } else if (existingServer.transport === 'stdio' && transport !== 'stdio') {
      // Clear stdio config if switching away from stdio
      updateData.stdio_config = null;
    }

    // Update auth-specific configuration
    if (authType === 'bearer') {
      updateData.auth_config = {
        bearerToken: bearerToken, // TODO: Encrypt this
      };
    } else if (authType === 'oauth') {
      // Preserve existing OAuth config if already configured
      const existingAuthConfig = existingServer.auth_config as Record<string, unknown> || {};
      updateData.auth_config = {
        ...existingAuthConfig,
        oauthConfigured: existingAuthConfig.oauthConfigured || false,
      };
    } else if (authType === 'none') {
      updateData.auth_config = null;
    }

    // Update server
    const { data: updatedServer, error: updateError } = await supabase
      .from('mcp_servers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating MCP server:', updateError);
      return NextResponse.json(
        { error: 'Failed to update server', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      server: updatedServer,
      message: 'MCP server updated successfully',
    });
  } catch (error) {
    console.error('MCP server PUT error:', error);
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
 * DELETE /api/mcp/servers/[id]
 * Soft delete an MCP server configuration
 */
export async function DELETE(
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
    const supabase = await createClient();

    // Fetch existing server
    const { data: existingServer, error: fetchError } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingServer) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check delete permissions based on scope
    if (existingServer.scope === 'user' && existingServer.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Only the owner can delete this server' },
        { status: 403 }
      );
    }

    if (existingServer.scope === 'organization') {
      if (!existingServer.organization_id) {
        console.error('Organization-scoped server missing organization_id', { serverId: id });
        return NextResponse.json(
          { error: 'Only organization admins can delete this server' },
          { status: 403 }
        );
      }
      // Check if user is admin of organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', existingServer.organization_id)
        .eq('user_id', profile.id)
        .single();

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only organization admins can delete this server' },
          { status: 403 }
        );
      }
    }

    if (existingServer.scope === 'system') {
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Only platform admins can delete system servers' },
          { status: 403 }
        );
      }
    }

    // Soft delete the server
    const { error: deleteError } = await supabase
      .from('mcp_servers')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: profile.id,
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting MCP server:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete server', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'MCP server deleted successfully',
    });
  } catch (error) {
    console.error('MCP server DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
