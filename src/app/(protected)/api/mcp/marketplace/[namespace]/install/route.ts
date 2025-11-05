/**
 * MCP Marketplace Server Installation API Route
 *
 * POST /api/mcp/marketplace/[namespace]/install
 * - Validates server before installation
 * - Installs server to user or organization scope
 * - Stores configuration in database
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    namespace: string;
  }>;
}

interface InstallRequest {
  scope: 'user' | 'organization';
  organizationId?: string;
  config?: {
    name?: string;
    enabled?: boolean;
    env?: Record<string, string>;
  };
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { namespace } = await params;
    const decodedNamespace = decodeURIComponent(namespace);

    // Parse request body
    const body: InstallRequest = await request.json();
    const { scope, organizationId, config } = body;

    // Get user from WorkOS auth
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
        { status: 401 }
      );
    }

    // Get or create Supabase profile
    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_ERROR',
            message: 'Failed to get user profile',
          },
        },
        { status: 500 }
      );
    }

    const userId = profile.id;

    // Fetch all servers from registry and find the matching one
    const registryUrl = 'https://registry.modelcontextprotocol.io/v0.1/servers';
    const registryResponse = await fetch(registryUrl);

    if (!registryResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRY_ERROR',
            message: 'Failed to fetch from registry',
          },
        },
        { status: 500 }
      );
    }

    const registryData = await registryResponse.json();
    const servers = registryData.servers || [];

    // Find server by namespace (name field in registry)
    const serverEntry = servers.find((s: any) => s.server?.name === decodedNamespace);

    if (!serverEntry || !serverEntry.server) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `Server ${decodedNamespace} not found in registry`,
          },
        },
        { status: 404 }
      );
    }

    const server = serverEntry.server;

    // Basic validation - just check if server has required fields
    if (!server.name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Server validation failed - missing required fields',
          },
        },
        { status: 400 }
      );
    }

    // Get transport info
    const transport = server.packages?.[0]?.transport || server.transport || { type: 'stdio' };

    // Prepare server configuration
    const serverConfig: any = {
      name: config?.name || server.name,
      description: server.description || '',
      namespace: decodedNamespace,
      version: server.version || '1.0.0',
      transport_type: transport.type || 'stdio',
      enabled: config?.enabled !== false,
      config: config || {},
      user_id: userId,
      scope: scope || 'user',
      organization_id: scope === 'organization' ? organizationId : null,
    };

    // Use service role client for admin operations
    const supabase = getSupabaseServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database client unavailable',
          },
        },
        { status: 500 }
      );
    }

    // Check if server already exists for this user
    const { data: existing } = await supabase
      .from('user_mcp_servers')
      .select('id')
      .eq('user_id', userId)
      .eq('server_id', decodedNamespace)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_INSTALLED',
            message: 'Server is already installed',
          },
        },
        { status: 409 }
      );
    }

    // Normalize auth_type: database only allows 'oauth' or 'bearer'
    // Default to 'bearer' for servers without auth (most flexible)
    const normalizeAuthType = (authType: string | undefined | null): string => {
      if (!authType || authType === 'none') return 'bearer';
      if (authType === 'oauth') return 'oauth';
      if (authType === 'api_key' || authType === 'bearer') return 'bearer';
      return 'bearer'; // Default to 'bearer' for unknown types
    };

    // First, ensure the server exists in mcp_servers table
    // Note: We need to set scope='user' and user_id to satisfy the valid_scope constraint
    // Source: 'registry' for MCP registry servers
    // Tier: 'community' for marketplace servers (user risk)
    const baseServerRecord: Record<string, any> = {
      namespace: decodedNamespace,
      name: server.name,
      description: server.description || '',
      version: server.version || '1.0.0',
      transport_type: transport.type || 'stdio',
      transport: transport.type || 'stdio',
      source: 'registry',
      tier: 'community',
      enabled: true,
      url: server.repository || server.homepage || `https://github.com/${decodedNamespace}`,
      auth_type: normalizeAuthType(server.auth?.type),
      repository_url: server.repository || null,
      homepage_url: server.homepage || null,
      documentation_url: server.documentation || null,
      license: server.license || null,
      tags: server.tags || [],
      category: server.category || null,
      scope: 'user',
      user_id: userId,
      organization_id: null,
      project_id: null,
    };

    const upsertServer = async () =>
      supabase
        .from('mcp_servers')
        .upsert(baseServerRecord as any, {
          onConflict: 'namespace',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

    let { data: mcpServer, error: mcpServerError } = await upsertServer();

    const retryIfMissing = async (column: string, key: string) => {
      if (mcpServerError && String(mcpServerError.message ?? '').includes(column)) {
        delete baseServerRecord[key];
        ({ data: mcpServer, error: mcpServerError } = await upsertServer());
      }
    };

    await retryIfMissing("'project_id'", 'project_id');
    await retryIfMissing("'tier'", 'tier');
    await retryIfMissing("'transport_type'", 'transport_type');
    await retryIfMissing("'source'", 'source');

    if (mcpServerError || !mcpServer) {
      console.error('Error upserting MCP server:', mcpServerError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create server record',
            details: mcpServerError,
          },
        },
        { status: 500 }
      );
    }

    // Now create the user_mcp_servers junction record
    const { data: installedServer, error: insertError } = await supabase
      .from('user_mcp_servers')
      .insert({
        user_id: userId,
        server_id: mcpServer.id,
        enabled: config?.enabled !== false,
        scope: scope || 'user',
        config: config || {},
        organization_id: scope === 'organization' ? organizationId : null,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('Error installing server:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSTALLATION_FAILED',
            message: 'Failed to install server',
            details: insertError,
          },
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        server: installedServer,
        message: 'Server installed successfully',
      },
    });
  } catch (error) {
    console.error('Error installing server:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INSTALLATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to install server',
        },
      },
      { status: 500 }
    );
  }
}
