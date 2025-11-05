/**
 * MCP Marketplace Server Detail API Route
 *
 * GET /api/mcp/marketplace/[namespace]
 * - Fetches detailed server information
 * - Returns validation results
 */

import { NextRequest, NextResponse } from 'next/server';
import { registryClient } from '@/services/mcp/registry-client.service';
import { curationEngine } from '@/services/mcp/curation-engine.service';
import { serverValidation } from '@/services/mcp/server-validation.service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    namespace: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { namespace } = await params;

    // Decode namespace (handles slashes in URL)
    const decodedNamespace = decodeURIComponent(namespace);

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

    // Apply curation
    const curatedServer = curationEngine.curateServer(server);

    // Validate server
    const validation = serverValidation.validateServer(server);

    // Check compatibility
    const compatibility = serverValidation.checkCompatibility(server);

    // Return detailed information
    return NextResponse.json({
      success: true,
      data: {
        server: curatedServer,
        validation,
        compatibility,
        securityRiskLevel: serverValidation.getSecurityRiskLevel(validation.securityRisks),
      },
    });
  } catch (error) {
    console.error('Error fetching server details:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch server details',
        },
      },
      { status: 500 }
    );
  }
}
