import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient as _createClient } from '@/lib/database';

/**
 * POST /api/mcp/configure-proxy
 * Configure proxy settings for an MCP server
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
    const { serverId, proxyConfig } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Fetch the server
    const { data: server, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', serverId)
      .eq('is_deleted', false)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check permissions based on scope
    if (server.scope === 'user' && server.user_id !== profile.id) {
      return NextResponse.json(
        { error: 'Only the owner can configure proxy settings' },
        { status: 403 }
      );
    }

    if ((server as { scope?: string }).scope === 'organization') {
      if (!(server as { organization_id?: string }).organization_id) {
        console.error('Server missing organization_id for organization scope', { serverId });
        return NextResponse.json(
          { error: 'Server organization is not configured' },
          { status: 500 }
        );
      }
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', server.organization_id)
        .eq('user_id', profile.id)
        .single();

      if (!membership || membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only organization admins can configure proxy settings' },
          { status: 403 }
        );
      }
    }

    if (server.scope === 'system') {
      const { data: adminCheck } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!adminCheck) {
        return NextResponse.json(
          { error: 'Only platform admins can configure system server proxies' },
          { status: 403 }
        );
      }
    }

    // Validate proxy configuration
    if (proxyConfig) {
      const { enabled, proxyUrl, proxyAuth, bypassList: _bypassList } = proxyConfig;

      if (enabled && !proxyUrl) {
        return NextResponse.json(
          { error: 'Proxy URL is required when proxy is enabled' },
          { status: 400 }
        );
      }

      if (proxyUrl) {
        try {
          new URL(proxyUrl);
        } catch {
          return NextResponse.json(
            { error: 'Invalid proxy URL format' },
            { status: 400 }
          );
        }
      }

      if (proxyAuth && (!proxyAuth.username || !proxyAuth.password)) {
        return NextResponse.json(
          { error: 'Proxy authentication requires username and password' },
          { status: 400 }
        );
      }
    }

    // Update server with proxy configuration
    const { data: updatedServer, error: updateError } = await supabase
      .from('mcp_servers')
      .update({
        proxy_config: proxyConfig || null,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serverId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating proxy configuration:', updateError);
      return NextResponse.json(
        { error: 'Failed to update proxy configuration', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      server: updatedServer,
      message: 'Proxy configuration updated successfully',
    });
  } catch (error) {
    console.error('Configure proxy error:', error);
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
 * GET /api/mcp/configure-proxy?serverId=xxx
 * Get proxy configuration for an MCP server
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

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Fetch the server
    const { data: server, error } = await supabase
      .from('mcp_servers')
      .select('id, scope, user_id, organization_id, proxy_config')
      .eq('id', serverId)
      .eq('is_deleted', false)
      .single();

    if (error || !server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Check access based on scope
    if ((server as { scope?: string }).scope === 'user' && (server as { user_id?: string }).user_id !== profile.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if ((server as { scope?: string }).scope === 'organization') {
      if (!(server as { organization_id?: string }).organization_id) {
        console.error('Server missing organization_id for organization scope', { serverId });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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

    return NextResponse.json({
      proxyConfig: server.proxy_config || null,
    });
  } catch (error) {
    console.error('Get proxy config error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
