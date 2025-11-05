/**
 * MCP Server Curation Engine
 *
 * Filters and ranks MCP servers based on curation criteria:
 * - First-Party (Anthropic official)
 * - Curated (Community vetted)
 * - All (Everything else)
 */

import { MCPRegistryServer } from './registry-client.service';

export type CurationTier = 'first-party' | 'curated' | 'all';

export interface CurationCriteria {
  // Security
  hasSecurityReview?: boolean;
  publisherVerified?: boolean;

  // Quality metrics
  minStars?: number;
  minInstalls?: number;
  maxDaysSinceUpdate?: number;

  // Transport preferences
  preferredTransports?: ('stdio' | 'sse' | 'http')[];

  // Authentication
  requiresAuth?: boolean;
  supportedAuthTypes?: string[];
}

export interface CuratedServer extends MCPRegistryServer {
  curationTier: CurationTier;
  curationScore: number;
  securityReview?: {
    status: 'approved' | 'pending' | 'flagged' | 'rejected';
    reviewedAt?: string;
    reviewer?: string;
    notes?: string;
  };
}

/**
 * Curation Engine Service
 *
 * Applies business logic to filter and rank MCP servers
 */
class CurationEngineService {
  // Official Anthropic publishers
  private readonly FIRST_PARTY_PUBLISHERS = ['Anthropic', 'anthropic'];

  // Curated community publishers
  private readonly CURATED_PUBLISHERS = [
    'modelcontextprotocol',
    'mcp-official',
    'mcp-community',
  ];

  /**
   * Curate a list of servers, assigning tier and score
   */
  curateServers(servers: MCPRegistryServer[]): CuratedServer[] {
    return servers.map(server => this.curateServer(server));
  }

  /**
   * Curate a single server
   */
  curateServer(server: MCPRegistryServer): CuratedServer {
    const tier = this.determineTier(server);
    const score = this.calculateCurationScore(server, tier);

    return {
      ...server,
      curationTier: tier,
      curationScore: score,
      securityReview: this.getSecurityReview(server),
    };
  }

  /**
   * Filter servers by curation tier
   */
  filterByTier(servers: CuratedServer[], tier: CurationTier): CuratedServer[] {
    switch (tier) {
      case 'first-party':
        return servers.filter(s => s.curationTier === 'first-party');

      case 'curated':
        return servers.filter(s =>
          s.curationTier === 'first-party' || s.curationTier === 'curated'
        );

      case 'all':
      default:
        return servers;
    }
  }

  /**
   * Sort servers by curation score (descending)
   */
  sortByScore(servers: CuratedServer[]): CuratedServer[] {
    return [...servers].sort((a, b) => b.curationScore - a.curationScore);
  }

  /**
   * Apply custom curation criteria
   */
  applyCriteria(servers: CuratedServer[], criteria: CurationCriteria): CuratedServer[] {
    let filtered = servers;

    // Publisher verification
    if (criteria.publisherVerified !== undefined) {
      filtered = filtered.filter(s => s.publisherVerified === criteria.publisherVerified);
    }

    // Minimum stars
    if (criteria.minStars !== undefined) {
      filtered = filtered.filter(s => (s.stars || 0) >= criteria.minStars!);
    }

    // Minimum installs
    if (criteria.minInstalls !== undefined) {
      filtered = filtered.filter(s => (s.installCount || 0) >= criteria.minInstalls!);
    }

    // Maximum days since update
    if (criteria.maxDaysSinceUpdate !== undefined && criteria.maxDaysSinceUpdate > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.maxDaysSinceUpdate);

      filtered = filtered.filter(s => {
        if (!s.lastUpdated) return false;
        return new Date(s.lastUpdated) >= cutoffDate;
      });
    }

    // Transport preferences
    if (criteria.preferredTransports?.length) {
      filtered = filtered.filter(s =>
        criteria.preferredTransports!.includes(s.transport.type)
      );
    }

    // Authentication requirements
    if (criteria.requiresAuth !== undefined) {
      if (criteria.requiresAuth) {
        filtered = filtered.filter(s => s.auth && s.auth.type !== 'none');
      } else {
        filtered = filtered.filter(s => !s.auth || s.auth.type === 'none');
      }
    }

    // Supported auth types
    if (criteria.supportedAuthTypes?.length) {
      filtered = filtered.filter(s =>
        s.auth && criteria.supportedAuthTypes!.includes(s.auth.type)
      );
    }

    return filtered;
  }

  /**
   * Get recommended servers based on user preferences
   */
  getRecommendations(
    servers: CuratedServer[],
    userPreferences: {
      categories?: string[];
      maxResults?: number;
    } = {}
  ): CuratedServer[] {
    let recommendations = this.sortByScore(servers);

    // Filter by preferred categories
    if (userPreferences.categories?.length) {
      recommendations = recommendations.filter(s =>
        userPreferences.categories!.includes(s.category || '')
      );
    }

    // Limit results
    const maxResults = userPreferences.maxResults || 10;
    return recommendations.slice(0, maxResults);
  }

  /**
   * Determine curation tier for a server
   */
  private determineTier(server: MCPRegistryServer): CurationTier {
    // First-party: Official Anthropic servers
    if (this.isFirstParty(server)) {
      return 'first-party';
    }

    // Curated: Community servers that meet quality criteria
    if (this.isCurated(server)) {
      return 'curated';
    }

    // All: Everything else
    return 'all';
  }

  /**
   * Check if server is first-party (Anthropic)
   */
  private isFirstParty(server: MCPRegistryServer): boolean {
    return this.FIRST_PARTY_PUBLISHERS.some(publisher =>
      server.publisher.toLowerCase() === publisher.toLowerCase() ||
      server.namespace.toLowerCase().startsWith('anthropic/')
    );
  }

  /**
   * Check if server meets curated criteria
   */
  private isCurated(server: MCPRegistryServer): boolean {
    // Verified publisher
    if (server.publisherVerified) {
      return true;
    }

    // High-quality metrics
    const hasHighQuality =
      (server.stars || 0) >= 100 &&
      (server.installCount || 0) >= 1000;

    if (hasHighQuality) {
      return true;
    }

    // Curated publisher
    const isCuratedPublisher = this.CURATED_PUBLISHERS.some(publisher =>
      server.publisher.toLowerCase() === publisher.toLowerCase() ||
      server.namespace.toLowerCase().startsWith(`${publisher}/`)
    );

    return isCuratedPublisher;
  }

  /**
   * Calculate curation score (0-100)
   */
  private calculateCurationScore(server: MCPRegistryServer, tier: CurationTier): number {
    let score = 0;

    // Base score by tier
    switch (tier) {
      case 'first-party':
        score += 50;
        break;
      case 'curated':
        score += 30;
        break;
      case 'all':
        score += 10;
        break;
    }

    // Publisher verification bonus
    if (server.publisherVerified) {
      score += 10;
    }

    // Install count (logarithmic scale, max 15 points)
    if (server.installCount) {
      const installScore = Math.min(15, Math.log10(server.installCount) * 3);
      score += installScore;
    }

    // Star count (logarithmic scale, max 10 points)
    if (server.stars) {
      const starScore = Math.min(10, Math.log10(server.stars + 1) * 3);
      score += starScore;
    }

    // Recency bonus (max 10 points)
    if (server.lastUpdated) {
      const daysSinceUpdate = this.getDaysSinceUpdate(server.lastUpdated);
      if (daysSinceUpdate <= 30) {
        score += 10;
      } else if (daysSinceUpdate <= 90) {
        score += 5;
      } else if (daysSinceUpdate <= 180) {
        score += 2;
      }
    }

    // Transport preference (SSE/HTTP preferred for marketplace)
    if (server.transport.type === 'sse' || server.transport.type === 'http') {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Get mock security review status
   */
  private getSecurityReview(server: MCPRegistryServer): CuratedServer['securityReview'] {
    if (this.isFirstParty(server)) {
      return {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewer: 'Anthropic Security Team',
        notes: 'Official first-party server',
      };
    }

    if (server.publisherVerified) {
      return {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewer: 'Community Review Team',
        notes: 'Verified publisher',
      };
    }

    return {
      status: 'pending',
      notes: 'Awaiting security review',
    };
  }

  /**
   * Calculate days since last update
   */
  private getDaysSinceUpdate(lastUpdated: string): number {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diff = now.getTime() - updated.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const curationEngine = new CurationEngineService();
