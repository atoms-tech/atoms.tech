/**
 * MCP Marketplace API Route
 *
 * GET /api/mcp/marketplace
 * - Fetches servers from Anthropic registry
 * - Applies curation and filtering
 * - Returns paginated results
 */

import { NextRequest, NextResponse } from 'next/server';
import { registryClient, MCPRegistryServer } from '@/services/mcp/registry-client.service';
import { curationEngine, CurationTier } from '@/services/mcp/curation-engine.service';

type RegistryAuthType = NonNullable<MCPRegistryServer['auth']>['type'];

const normalizeAuthType = (value: string | null | undefined): RegistryAuthType | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'oauth':
    case 'oauth':
      return 'oauth';
    case 'api-key':
    case 'apikey':
      return 'api-key';
    case 'bearer':
      return 'bearer';
    case 'none':
      return 'none';
    default:
      return undefined;
  }
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '9', 10);
    const tier = (searchParams.get('tier') || 'all') as CurationTier;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const transportType = searchParams.get('transport') as 'stdio' | 'sse' | 'http' | undefined;
    const normalizedAuthFilter = normalizeAuthType(searchParams.get('auth'));
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const sortBy = searchParams.get('sort') || 'quality';

    // Fetch from registry
    const registryResponse = await registryClient.fetchServers({
      page,
      pageSize,
      category,
      search,
      transportType,
      authType: normalizedAuthFilter,
      tags,
    });

    // Apply curation
    const curatedServers = curationEngine.curateServers(registryResponse.servers);

    // Apply transport and auth filters if provided
    let filteredServers = curatedServers;
    
    if (transportType) {
      const beforeCount = filteredServers.length;
      filteredServers = filteredServers.filter(server => {
        const serverTransport = server.transport?.type;
        // Normalize to lowercase for comparison
        const normalizedServerTransport = serverTransport?.toLowerCase();
        const normalizedFilterTransport = transportType.toLowerCase();
        const matches = normalizedServerTransport === normalizedFilterTransport;
        if (!matches && serverTransport) {
          // Log for debugging
          console.log(`Transport filter: server ${server.name} has transport ${serverTransport}, filter is ${transportType}`);
        }
        return matches;
      });
      console.log(`Transport filter (${transportType}): ${beforeCount} -> ${filteredServers.length} servers`);
    }
    
    if (normalizedAuthFilter) {
      const beforeCount = filteredServers.length;
      filteredServers = filteredServers.filter(server => {
        const serverAuthType = normalizeAuthType(server.auth?.type ?? 'none');
        const matches = serverAuthType === normalizedAuthFilter;
        if (!matches && server.auth?.type) {
          console.log(
            `Auth filter: server ${server.name} has auth ${server.auth.type}, normalized to ${serverAuthType}, filter is ${normalizedAuthFilter}`,
          );
        }
        return matches;
      });
      console.log(
        `Auth filter (${normalizedAuthFilter}): ${beforeCount} -> ${filteredServers.length} servers`,
      );
    }

    // Filter by tier
    const tierFilteredServers = curationEngine.filterByTier(filteredServers, tier);

    // Sort servers based on sortBy parameter
    let sortedServers = [...tierFilteredServers];
    switch (sortBy) {
      case 'name':
        sortedServers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortedServers.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'stars':
        sortedServers.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        break;
      case 'recent':
        sortedServers.sort((a, b) => {
          const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case 'quality':
      default:
        // Default: sort by curation score
        sortedServers = curationEngine.sortByScore(tierFilteredServers);
        break;
    }

    // Pagination
    const total = sortedServers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedServers = sortedServers.slice(startIndex, endIndex);

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        servers: paginatedServers,
        total,
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
