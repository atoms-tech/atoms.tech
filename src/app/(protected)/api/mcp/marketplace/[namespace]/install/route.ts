/**
 * MCP Marketplace Server Installation API Route
 *
 * POST /api/mcp/marketplace/[namespace]/install
 * - Validates server before installation
 * - Installs server to user or organization scope
 * - Stores configuration in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { registryClient } from '@/services/mcp/registry-client.service';
import { serverValidation } from '@/services/mcp/server-validation.service';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export const dynamic = 'force-dynamic';

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
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { namespace } = await params;
    const decodedNamespace = decodeURIComponent(namespace);

    // Parse request body
    const body: InstallRequest = await request.json();
    const { scope, organizationId, config } = body;

    // Get user from session
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url).toString(), {
      headers: request.headers,
    });

    if (!sessionResponse.ok) {
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

    const session = await sessionResponse.json();
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in session',
          },
        },
        { status: 401 }
      );
    }

    // Fetch server from registry
    const server = await registryClient.fetchServerByNamespace(decodedNamespace);

    if (!server) {
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

    // Validate server for installation
    const validation = await serverValidation.validateForInstallation(server, {
      userId,
      organizationId,
      scope,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Server validation failed',
            details: {
              errors: validation.errors,
              warnings: validation.warnings,
            },
          },
        },
        { status: 400 }
      );
    }

    // Prepare server configuration
    const serverConfig = {
      namespace: server.namespace,
      name: config?.name || server.name,
      description: server.description,
      transport: server.transport,
      auth: server.auth,
      enabled: config?.enabled !== false,
      env: config?.env || {},
      scope,
      user_id: userId,
      organization_id: scope === 'organization' ? organizationId : null,
      metadata: {
        publisher: server.publisher,
        version: server.version,
        category: server.category,
        tags: server.tags,
        homepage: server.homepage,
        repository: server.repository,
      },
    };

    // Insert into mcp_servers table
    const { data: installedServer, error: insertError } = await supabase
      .from('mcp_servers')
      .insert(serverConfig)
      .select()
      .single();

    if (insertError) {
      console.error('Error installing server:', insertError);

      // Check for duplicate
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_INSTALLED',
              message: 'Server is already installed in this scope',
            },
          },
          { status: 409 }
        );
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
        validation: {
          warnings: validation.warnings,
          securityRisks: validation.securityRisks,
        },
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
