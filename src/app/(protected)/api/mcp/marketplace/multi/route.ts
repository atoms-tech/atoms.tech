/**
 * Multi-Registry MCP Marketplace API Route
 *
 * GET /api/mcp/marketplace/multi
 * - Fetches servers from both Anthropic and Cline registries
 * - Deduplicates and merges metadata
 * - Calculates quality scores
 * - Supports advanced filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    multiRegistryService,
    UnifiedMCPServer,
} from '@/services/mcp/multi-registry.service';

type KnownAuthType = NonNullable<UnifiedMCPServer['auth']>['type'];

const normalizeAuthParam = (value: string | null | undefined): KnownAuthType | undefined => {
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
        const source = searchParams.get('source') as 'all' | 'anthropic' | 'cline' | null;
        const verified = searchParams.get('verified') === 'true';
        const minStars = searchParams.get('minStars')
            ? parseInt(searchParams.get('minStars')!, 10)
            : undefined;
        const category = searchParams.get('category') || undefined;
        const hasLLMSInstall = searchParams.get('hasLLMSInstall') === 'true';
        const minQualityScore = searchParams.get('minQualityScore')
            ? parseInt(searchParams.get('minQualityScore')!, 10)
            : undefined;
        const search = searchParams.get('search') || undefined;
        const transport = searchParams.get('transport') as 'stdio' | 'sse' | 'http' | undefined;
        const authParam = searchParams.get('auth');
        const normalizedAuthFilter = normalizeAuthParam(authParam ?? undefined);
        const sortBy = searchParams.get('sort') || 'quality';

        // Fetch servers with filters
        let servers;
        if (search) {
            // Search mode
            const allServers = await multiRegistryService.searchServers(search);
            // Apply additional filters
            servers = allServers.filter((server: UnifiedMCPServer) => {
                if (source && source !== 'all' && !server.sources.includes(source)) {
                    return false;
                }
                if (verified && !server.publisherVerified) {
                    return false;
                }
                if (minStars && (!server.stars || server.stars < minStars)) {
                    return false;
                }
                if (category && server.category !== category) {
                    return false;
                }
                if (hasLLMSInstall && !server.hasLLMSInstall) {
                    return false;
                }
                if (minQualityScore && server.qualityScore < minQualityScore) {
                    return false;
                }
                // Transport filter
                if (transport) {
                    const serverTransport = server.transport?.type;
                    const normalizedServerTransport = serverTransport?.toLowerCase();
                    const normalizedFilterTransport = transport.toLowerCase();
                    if (normalizedServerTransport !== normalizedFilterTransport) {
                        return false;
                    }
                }
                if (normalizedAuthFilter) {
                    const serverAuthType = normalizeAuthParam(server.auth?.type ?? 'none');
                    if (serverAuthType !== normalizedAuthFilter) {
                        return false;
                    }
                }
                return true;
            });
        } else {
            // Filter mode
            servers = await multiRegistryService.fetchServersWithFilters({
                source: source || 'all',
                verified: verified || undefined,
                minStars,
                category,
                hasLLMSInstall: hasLLMSInstall || undefined,
                minQualityScore,
            });

            // Apply transport and auth filters (not supported by service yet)
            if (transport || normalizedAuthFilter) {
                const beforeCount = servers.length;
                servers = servers.filter((server: UnifiedMCPServer) => {
                    if (transport) {
                        const serverTransport = server.transport?.type;
                        const normalizedServerTransport = serverTransport?.toLowerCase();
                        const normalizedFilterTransport = transport.toLowerCase();
                        if (normalizedServerTransport !== normalizedFilterTransport) {
                            return false;
                        }
                    }
                    if (normalizedAuthFilter) {
                        const serverAuthType = normalizeAuthParam(server.auth?.type ?? 'none');
                        if (serverAuthType !== normalizedAuthFilter) {
                            return false;
                        }
                    }
                    return true;
                });
                console.log(
                    `Multi-registry filters - Transport: ${transport || 'none'}, Auth: ${normalizedAuthFilter || 'none'}, Count: ${beforeCount} -> ${servers.length}`,
                );
            }
        }

        // Sort servers based on sortBy parameter
        switch (sortBy) {
            case 'name':
                servers.sort((a: UnifiedMCPServer, b: UnifiedMCPServer) => 
                    (a.name || '').localeCompare(b.name || '')
                );
                break;
            case 'name-desc':
                servers.sort((a: UnifiedMCPServer, b: UnifiedMCPServer) => 
                    (b.name || '').localeCompare(a.name || '')
                );
                break;
            case 'stars':
                servers.sort((a: UnifiedMCPServer, b: UnifiedMCPServer) => 
                    (b.stars || 0) - (a.stars || 0)
                );
                break;
            case 'recent':
                servers.sort((a: UnifiedMCPServer, b: UnifiedMCPServer) => {
                    const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                    const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                    return bDate - aDate;
                });
                break;
            case 'quality':
            default:
                // Default: sort by quality score (descending)
                servers.sort((a: UnifiedMCPServer, b: UnifiedMCPServer) => b.qualityScore - a.qualityScore);
                break;
        }

        // Pagination
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '9', 10);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedServers = servers.slice(startIndex, endIndex);

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                servers: paginatedServers,
                total: servers.length,
                page,
                pageSize,
                filters: {
                    source: source || 'all',
                    verified,
                    minStars,
                    category,
                    hasLLMSInstall,
                    minQualityScore,
                    search,
                    transport,
                    auth: normalizedAuthFilter,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching multi-registry servers:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'MULTI_REGISTRY_FETCH_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to fetch servers from multi-registry',
                },
            },
            { status: 500 },
        );
    }
}
