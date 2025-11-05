/**
 * MCP Marketplace API Route
 *
 * GET /api/mcp/marketplace
 * - Fetches servers from Anthropic registry
 * - Applies curation and filtering
 * - Returns paginated results
 */

import { NextRequest, NextResponse } from 'next/server';
import { registryClient } from '@/services/mcp/registry-client.service';
import { curationEngine, CurationTier } from '@/services/mcp/curation-engine.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const tier = (searchParams.get('tier') || 'all') as CurationTier;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const transportType = searchParams.get('transport') as 'stdio' | 'sse' | 'http' | undefined;
    const authType = searchParams.get('auth') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;

    // Fetch from registry
    const registryResponse = await registryClient.fetchServers({
      page,
      pageSize,
      category,
      search,
      transportType,
      authType,
      tags,
    });

    // Apply curation
    const curatedServers = curationEngine.curateServers(registryResponse.servers);

    // Filter by tier
    const filteredServers = curationEngine.filterByTier(curatedServers, tier);

    // Sort by curation score
    const sortedServers = curationEngine.sortByScore(filteredServers);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        servers: sortedServers,
        total: registryResponse.total,
        page,
        pageSize,
        tier,
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace servers:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARKETPLACE_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch marketplace servers',
        },
      },
      { status: 500 }
    );
  }
}
