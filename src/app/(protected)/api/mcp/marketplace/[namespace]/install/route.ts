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
import { getServiceRoleClient } from '@/lib/database';
import type { Database } from '@/types/base/database.types';

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

type MCPServerInsert = Database['public']['Tables']['mcp_servers']['Insert'];
type UserMcpServerInsert = Database['public']['Tables']['user_mcp_servers']['Insert'];

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
    const serverEntry = servers.find((s: { server?: { name?: string } }) => s.server?.name === decodedNamespace);

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

    // Get transport info - support both old and new registry formats
    // New format uses remotes[], old format uses packages[].transport
    let transport: any;
    let serverUrl: string | null = null;

    if (server.remotes && Array.isArray(server.remotes) && server.remotes.length > 0) {
        // New registry format with remotes
        const remote = server.remotes[0];
        const remoteType = remote.type;
        serverUrl = remote.url || null;

        // Map remote type to transport type
        if (remoteType === 'streamable-http' || remoteType === 'http') {
            transport = { type: 'http' };
        } else if (remoteType === 'sse') {
            transport = { type: 'sse' };
        } else {
            transport = { type: 'stdio' };
        }
    } else {
        // Old format with packages
        transport = server.packages?.[0]?.transport ?? server.transport ?? { type: 'stdio' };
        serverUrl = (transport as any).url || null;
    }

    // Use service role client for admin operations
    const supabase = getServiceRoleClient();

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

    // Normalize auth_type: database allows 'oauth', 'bearer', 'none', or 'api_key'
    // Default to 'none' for servers without auth
      const normalizeAuthType = (authType: string | undefined | null): string => {
        if (!authType || authType === 'none') return 'none';
        if (authType === 'oauth') return 'oauth';
        if (authType === 'api_key' || authType === 'bearer') return 'bearer';
        return 'none';
      };

    // First, ensure the server exists in mcp_servers table
    // Note: We need to set scope='user' and user_id to satisfy the valid_scope constraint
    // Source: 'anthropic' for MCP registry servers
    // Tier: 'community' for marketplace servers (user risk)
    const transportObject: Record<string, unknown> =
        typeof transport === 'object' && transport !== null ? { ...transport } : { type: 'stdio' };

    const normalizeTransportType = (value: unknown): 'stdio' | 'sse' | 'http' => {
        if (value === 'sse' || value === 'http') {
            return value;
        }

        return 'stdio';
    };

    // Normalize transport to string (database expects 'stdio', 'sse', or 'http')
    const normalizeTransport = (type: unknown): string => {
        if (type === 'http') return 'http';
        if (type === 'sse') return 'sse';
        return 'stdio'; // Default for stdio
    };

    let serverUpsertPayload: MCPServerInsert = {
        namespace: decodedNamespace,
        name: server.name,
        description: server.description ?? null,
        version: server.version ?? '1.0.0',
        transport_type: normalizeTransportType(transportObject.type),
        transport: transportObject, // Store full transport object, not just type
        url: serverUrl || server.repository || server.homepage || `https://github.com/${decodedNamespace}`, // Actual MCP endpoint or repository
        source: 'anthropic',
        tier: 'community',
        enabled: true,
        auth_type: normalizeAuthType(server.auth?.type),
        repository_url: server.repository ?? null,
        homepage_url: server.homepage ?? null,
        documentation_url: server.documentation ?? null,
        license: server.license ?? null,
        tags: Array.isArray(server.tags) ? server.tags : [],
        category: server.category ?? null,
        scope: 'user',
        user_id: userId,
        organization_id: null,
        // Store transport config if it's stdio
        transport_config: transportObject.type === 'stdio' ? {
            command: transportObject.command,
            args: transportObject.args,
        } : null,
    };

    const upsertServer = async () =>
        supabase
            .from('mcp_servers')
            .upsert(serverUpsertPayload, {
                onConflict: 'namespace',
                ignoreDuplicates: false,
            })
            .select('id')
            .single();

    let { data: mcpServer, error: mcpServerError } = await upsertServer();

    const retryIfMissing = async <K extends keyof MCPServerInsert>(column: string, key: K) => {
        if (mcpServerError && String(mcpServerError.message ?? '').includes(column)) {
            serverUpsertPayload = {
                ...serverUpsertPayload,
                [key]: undefined as MCPServerInsert[K],
            };
            ({ data: mcpServer, error: mcpServerError } = await upsertServer());
        }
    };

    await retryIfMissing("'project_id'", 'project_id');
    await retryIfMissing("'tier'", 'tier');
    await retryIfMissing("'transport_type'", 'transport_type');
    await retryIfMissing("'transport'", 'transport');

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

    const targetScope = scope ?? 'user';
    const userServerPayload: UserMcpServerInsert = {
        user_id: userId,
        server_id: mcpServer.id,
        enabled: config?.enabled !== false,
        custom_config: config ?? {},
        organization_id: targetScope === 'organization' ? organizationId ?? null : null,
    };

    // Now create the user_mcp_servers junction record
    const { data: installedServer, error: insertError } = await supabase
        .from('user_mcp_servers')
        .insert(userServerPayload)
        .select()
        .single();

    if (insertError) {
      console.error('Error installing server:', insertError);

      if ((insertError as { code?: string })?.code === '23505') {
        const { data: existingServer } = await supabase
          .from('user_mcp_servers')
          .select()
          .eq('user_id', userId)
          .eq('server_id', mcpServer.id)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          data: {
            server: existingServer ?? null,
            message: 'Server was already installed',
            alreadyInstalled: true,
          },
        });
      }

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
