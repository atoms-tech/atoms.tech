/**
 * Multi-Registry MCP Service
 *
 * Aggregates MCP servers from multiple registries (Anthropic + Cline),
 * deduplicates, merges metadata, and calculates quality scores.
 */

import { registryClient, MCPRegistryServer } from './registry-client.service';
import { MCPRegistryAuthInfo } from './types';
import { clineRegistryClient, ClineMCPServer } from './cline-registry-client.service';

export type RegistrySource = 'anthropic' | 'cline';

export interface UnifiedMCPServer {
    // Core identification
    id: string;
    name: string;
    description: string;
    namespace: string; // Required for installation

    // Sources
    sources: RegistrySource[];
    primarySource: RegistrySource;

    // Metadata (merged from all sources)
    author: string;
    publisher?: string;
    publisherVerified: boolean;

    // GitHub info (if available)
    githubUrl?: string;
    stars?: number;
    license?: string;
    lastUpdated: string;

    // Visual
    logoUrl?: string;
    icon?: string;

    // Installation
    hasLLMSInstall: boolean;
    transport: {
        type: 'stdio' | 'sse' | 'http';
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        url?: string;
    };

    // Auth
    auth?: MCPRegistryAuthInfo;

    // Categorization
    category?: string;
    tags?: string[];

    // Metrics
    installCount?: number;
    qualityScore: number;
}

export interface MultiRegistryFilters {
    source?: 'all' | RegistrySource;
    verified?: boolean;
    minStars?: number;
    category?: string;
    hasLLMSInstall?: boolean;
    minQualityScore?: number;
}

export class MultiRegistryService {
    // Cache for unified servers
    private unifiedCache: { data: UnifiedMCPServer[]; timestamp: number } | null = null;
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    
    // Cache for LLMS install checks (shared across servers)
    private llmsInstallCache = new Map<string, { data: boolean; timestamp: number }>();
    private readonly LLMS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    constructor(
        private anthropicClient: typeof registryClient,
        private clineClient: typeof clineRegistryClient,
    ) {}

    /**
     * Fetch all servers from both registries
     */
    async fetchAllServers(): Promise<UnifiedMCPServer[]> {
        // Check cache first
        if (this.unifiedCache && Date.now() - this.unifiedCache.timestamp < this.CACHE_TTL) {
            return this.unifiedCache.data;
        }

        try {
            // Fetch from both registries in parallel
            const [anthropicResponse, clineServers] = await Promise.all([
                this.anthropicClient.fetchServers().catch(() => ({ servers: [], total: 0, page: 1, pageSize: 20 })),
                this.clineClient.fetchServers().catch(() => []),
            ]);

            // Ensure servers arrays are valid
            const anthropicServers = Array.isArray(anthropicResponse?.servers) 
                ? anthropicResponse.servers 
                : [];
            const clineServersArray = Array.isArray(clineServers) ? clineServers : [];

            // Merge and deduplicate (now async with parallel LLMS checks)
            const unified = await this.mergeServers(anthropicServers, clineServersArray);

            // Ensure unified is an array
            if (!Array.isArray(unified)) {
                console.error('mergeServers did not return an array:', unified);
                return [];
            }

            // Calculate quality scores
            const serversWithScores = unified.map((server) => ({
                ...server,
                qualityScore: this.calculateQualityScore(server),
            }));

            // Cache the results
            this.unifiedCache = { data: serversWithScores, timestamp: Date.now() };

            return serversWithScores;
        } catch (error) {
            console.error('Failed to fetch servers from registries:', error);
            // Return cached data if available, even if stale
            if (this.unifiedCache) {
                return this.unifiedCache.data;
            }
            return [];
        }
    }

    /**
     * Fetch servers with filters
     */
    async fetchServersWithFilters(
        filters: MultiRegistryFilters,
    ): Promise<UnifiedMCPServer[]> {
        const allServers = await this.fetchAllServers();

        return allServers.filter((server) => {
            // Source filter
            if (filters.source && filters.source !== 'all') {
                if (!server.sources.includes(filters.source)) {
                    return false;
                }
            }

            // Verified filter
            if (filters.verified && !server.publisherVerified) {
                return false;
            }

            // Stars filter
            if (filters.minStars && (!server.stars || server.stars < filters.minStars)) {
                return false;
            }

            // Category filter
            if (filters.category && server.category !== filters.category) {
                return false;
            }

            // LLM install filter
            if (filters.hasLLMSInstall && !server.hasLLMSInstall) {
                return false;
            }

            // Quality score filter
            if (
                filters.minQualityScore &&
                server.qualityScore < filters.minQualityScore
            ) {
                return false;
            }

            return true;
        });
    }

    /**
     * Search servers by query
     */
    async searchServers(query: string): Promise<UnifiedMCPServer[]> {
        const allServers = await this.fetchAllServers();
        const lowerQuery = query.toLowerCase();

        return allServers.filter(
            (server) =>
                server.name.toLowerCase().includes(lowerQuery) ||
                server.description.toLowerCase().includes(lowerQuery) ||
                server.author.toLowerCase().includes(lowerQuery) ||
                server.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );
    }


    /**
     * Merge servers from both registries and deduplicate
     */
    private async mergeServers(
        anthropicServers: MCPRegistryServer[],
        clineServers: ClineMCPServer[],
    ): Promise<UnifiedMCPServer[]> {
        const serverMap = new Map<string, UnifiedMCPServer>();

        // Batch LLMS install checks for Anthropic servers in parallel
        const anthropicLLMSChecks = new Map<string, Promise<boolean>>();
        const uniqueRepos = new Set<string>();
        
        anthropicServers.forEach(server => {
            if (server.repository && !anthropicLLMSChecks.has(server.repository)) {
                uniqueRepos.add(server.repository);
                anthropicLLMSChecks.set(server.repository, this.checkLLMSInstallCached(server.repository));
            }
        });
        
        // Wait for all LLMS checks to complete
        const llmsResults = await Promise.all(
            Array.from(anthropicLLMSChecks.entries()).map(async ([repo, promise]) => [
                repo,
                await promise,
            ] as [string, boolean])
        );
        const llmsMap = new Map<string, boolean>(llmsResults);

        // Add Anthropic servers (with cached LLMS checks)
        const anthropicPromises = anthropicServers.map(async (server) => {
            const key = this.getServerKey(server);
            const hasLLMSInstall = server.repository ? (llmsMap.get(server.repository) || false) : false;
            const converted = await this.convertAnthropicServer(server, hasLLMSInstall);
            return { key, converted };
        });

        const anthropicResults = await Promise.all(anthropicPromises);
        for (const { key, converted } of anthropicResults) {
            serverMap.set(key, converted);
        }

        // Merge Cline servers
        for (const server of clineServers) {
            const key = this.getServerKey(server);

            if (serverMap.has(key)) {
                // Merge with existing
                const existing = serverMap.get(key)!;
                serverMap.set(key, this.mergeServerData(existing, server));
            } else {
                // Add new
                serverMap.set(key, this.convertClineServer(server));
            }
        }

        return Array.from(serverMap.values());
    }

    /**
     * Check LLMS install with caching
     */
    private async checkLLMSInstallCached(repository: string): Promise<boolean> {
        // Check cache first
        const cached = this.llmsInstallCache.get(repository);
        if (cached && Date.now() - cached.timestamp < this.LLMS_CACHE_TTL) {
            return cached.data;
        }

        const hasLLMS = await this.clineClient.checkLLMSInstall(repository);
        
        // Cache the result
        this.llmsInstallCache.set(repository, { data: hasLLMS, timestamp: Date.now() });
        
        return hasLLMS;
    }

    /**
     * Get unique key for server (for deduplication)
     */
    private getServerKey(server: MCPRegistryServer | ClineMCPServer): string {
        // Try to use GitHub URL as key
        if ('githubUrl' in server && server.githubUrl) {
            return server.githubUrl.toLowerCase();
        }

        // Try repository field
        if ('repository' in server && server.repository) {
            return server.repository.toLowerCase();
        }

        // Fallback to name
        return server.name.toLowerCase();
    }

    /**
     * Convert Anthropic server to unified format
     */
    private async convertAnthropicServer(
        server: MCPRegistryServer,
        hasLLMSInstall: boolean
    ): Promise<UnifiedMCPServer> {
        return {
            id: `anthropic-${server.namespace}-${server.name}`,
            name: server.name,
            description: server.description,
            namespace: server.namespace,
            sources: ['anthropic'],
            primarySource: 'anthropic',
            author: server.publisher,
            publisher: server.publisher,
            publisherVerified: server.publisherVerified,
            githubUrl: server.repository,
            stars: server.stars,
            license: server.license,
            lastUpdated: server.lastUpdated || new Date().toISOString(),
            logoUrl: server.iconUrl,
            icon: server.icon,
            hasLLMSInstall,
            transport: server.transport,
            auth: server.auth,
            category: server.category,
            tags: server.tags,
            installCount: server.installCount,
            qualityScore: 0, // Will be calculated later
        };
    }

    /**
     * Convert Cline server to unified format
     */
    private convertClineServer(server: ClineMCPServer): UnifiedMCPServer {
        return {
            id: server.id,
            name: server.name,
            description: server.description,
            namespace: server.id, // Use id as namespace for Cline servers
            sources: ['cline'],
            primarySource: 'cline',
            author: server.author,
            publisherVerified: false, // Cline doesn't have publisher verification
            githubUrl: server.githubUrl,
            stars: server.stars,
            license: server.license,
            lastUpdated: server.lastUpdated,
            logoUrl: server.logoUrl,
            hasLLMSInstall: server.hasLLMSInstall,
            transport: server.transport || {
                type: 'stdio',
                command: 'npx',
                args: ['-y', server.name],
            },
            category: server.category,
            tags: server.tags,
            qualityScore: 0, // Will be calculated later
        };
    }

    /**
     * Merge data from Cline server into existing unified server
     */
    private mergeServerData(
        existing: UnifiedMCPServer,
        clineServer: ClineMCPServer,
    ): UnifiedMCPServer {
        return {
            ...existing,
            sources: [...existing.sources, 'cline'],
            // Prefer Cline's GitHub data if available
            stars: clineServer.stars || existing.stars,
            githubUrl: clineServer.githubUrl || existing.githubUrl,
            hasLLMSInstall: clineServer.hasLLMSInstall || existing.hasLLMSInstall,
            // Merge tags
            tags: [
                ...new Set([...(existing.tags || []), ...(clineServer.tags || [])]),
            ],
            // Use most recent update
            lastUpdated:
                new Date(clineServer.lastUpdated) > new Date(existing.lastUpdated)
                    ? clineServer.lastUpdated
                    : existing.lastUpdated,
        };
    }

    /**
     * Calculate quality score for a server (0-100)
     *
     * Scoring algorithm:
     * - 30 points: Listed in Anthropic registry
     * - 20 points: Listed in Cline marketplace
     * - 10 points: Listed in BOTH registries
     * - 20 points: Publisher verified
     * - 10 points: 1000+ GitHub stars
     * -  7 points: 500+ GitHub stars
     * -  5 points: 100+ GitHub stars
     * -  3 points: 50+ GitHub stars
     * -  5 points: Has llms-install.md
     * -  5 points: Updated within 3 months
     */
    private calculateQualityScore(server: UnifiedMCPServer): number {
        let score = 0;

        // Source bonus
        if (server.sources.includes('anthropic')) {
            score += 30;
        }
        if (server.sources.includes('cline')) {
            score += 20;
        }

        // Both sources bonus
        if (server.sources.length > 1) {
            score += 10;
        }

        // Publisher verification
        if (server.publisherVerified) {
            score += 20;
        }

        // GitHub stars
        if (server.stars) {
            if (server.stars >= 1000) {
                score += 10;
            } else if (server.stars >= 500) {
                score += 7;
            } else if (server.stars >= 100) {
                score += 5;
            } else if (server.stars >= 50) {
                score += 3;
            }
        }

        // LLM install instructions
        if (server.hasLLMSInstall) {
            score += 5;
        }

        // Recent update (within 3 months)
        const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        if (new Date(server.lastUpdated).getTime() > threeMonthsAgo) {
            score += 5;
        }

        return Math.min(100, score);
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.unifiedCache = null;
        this.llmsInstallCache.clear();
    }
}

// Export singleton instance
export const multiRegistryService = new MultiRegistryService(
    registryClient,
    clineRegistryClient,
);
