/**
 * Anthropic MCP Registry Client Service
 *
 * Fetches and caches MCP server data from the official Anthropic registry.
 * This service handles API communication with the public registry.
 */

export interface MCPRegistryServer {
  namespace: string;
  name: string;
  description: string;
  publisher: string;
  publisherVerified: boolean;
  version: string;
  homepage?: string;
  repository?: string;
  license?: string;

  // Transport configuration
  transport: {
    type: 'stdio' | 'sse' | 'http';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  };

  // Authentication
  auth?: {
    type: 'none' | 'api-key' | 'oauth2' | 'bearer';
    provider?: string;
    scopes?: string[];
  };

  // Metadata
  category?: string;
  tags?: string[];
  installCount?: number;
  stars?: number;
  lastUpdated?: string;

  // Icon/branding
  icon?: string;
  iconUrl?: string;
}

export interface MCPRegistryResponse {
  servers: MCPRegistryServer[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RegistryFetchOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  transportType?: 'stdio' | 'sse' | 'http';
  authType?: string;
  search?: string;
  tags?: string[];
}

/**
 * Registry Client Service
 *
 * Fetches MCP servers from the Anthropic registry with caching support.
 */
class RegistryClientService {
  private cache: Map<string, { data: MCPRegistryResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly REGISTRY_BASE_URL = 'https://registry.anthropic.com/api/v1';

  /**
   * Fetch all servers from registry with optional filters
   */
  async fetchServers(options: RegistryFetchOptions = {}): Promise<MCPRegistryResponse> {
    const cacheKey = this.getCacheKey(options);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.page) params.set('page', options.page.toString());
      if (options.pageSize) params.set('pageSize', options.pageSize.toString());
      if (options.category) params.set('category', options.category);
      if (options.transportType) params.set('transport', options.transportType);
      if (options.authType) params.set('auth', options.authType);
      if (options.search) params.set('q', options.search);
      if (options.tags?.length) params.set('tags', options.tags.join(','));

      const url = `${this.REGISTRY_BASE_URL}/servers?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Registry API error: ${response.status} ${response.statusText}`);
      }

      const data: MCPRegistryResponse = await response.json();

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error('Error fetching from MCP registry:', error);

      // Return mock data for development if registry is unavailable
      if (process.env.NODE_ENV === 'development') {
        return this.getMockRegistryData(options);
      }

      throw error;
    }
  }

  /**
   * Fetch a specific server by namespace
   */
  async fetchServerByNamespace(namespace: string): Promise<MCPRegistryServer | null> {
    try {
      const url = `${this.REGISTRY_BASE_URL}/servers/${namespace}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Registry API error: ${response.status} ${response.statusText}`);
      }

      const server: MCPRegistryServer = await response.json();
      return server;
    } catch (error) {
      console.error(`Error fetching server ${namespace}:`, error);

      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return this.getMockServerData(namespace);
      }

      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key from options
   */
  private getCacheKey(options: RegistryFetchOptions): string {
    return JSON.stringify(options);
  }

  /**
   * Mock data for development/testing
   */
  private getMockRegistryData(options: RegistryFetchOptions): MCPRegistryResponse {
    const mockServers: MCPRegistryServer[] = [
      {
        namespace: 'anthropic/github',
        name: 'GitHub MCP Server',
        description: 'Access GitHub repositories, issues, and pull requests',
        publisher: 'Anthropic',
        publisherVerified: true,
        version: '1.0.0',
        homepage: 'https://github.com/anthropics/mcp-servers',
        repository: 'https://github.com/anthropics/mcp-servers',
        license: 'MIT',
        transport: {
          type: 'sse',
          url: 'https://api.github.com/mcp',
        },
        auth: {
          type: 'oauth2',
          provider: 'github',
          scopes: ['repo', 'read:user'],
        },
        category: 'Development',
        tags: ['github', 'git', 'version-control'],
        installCount: 15234,
        stars: 892,
        lastUpdated: new Date().toISOString(),
        iconUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      },
      {
        namespace: 'anthropic/google-drive',
        name: 'Google Drive MCP Server',
        description: 'Access and manage Google Drive files and folders',
        publisher: 'Anthropic',
        publisherVerified: true,
        version: '1.2.0',
        homepage: 'https://github.com/anthropics/mcp-servers',
        repository: 'https://github.com/anthropics/mcp-servers',
        license: 'MIT',
        transport: {
          type: 'sse',
          url: 'https://www.googleapis.com/mcp',
        },
        auth: {
          type: 'oauth2',
          provider: 'google',
          scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        },
        category: 'Productivity',
        tags: ['google', 'drive', 'storage'],
        installCount: 12456,
        stars: 745,
        lastUpdated: new Date().toISOString(),
      },
      {
        namespace: 'community/slack',
        name: 'Slack MCP Server',
        description: 'Send messages and interact with Slack workspaces',
        publisher: 'Community',
        publisherVerified: false,
        version: '0.9.0',
        homepage: 'https://github.com/slack-mcp/server',
        repository: 'https://github.com/slack-mcp/server',
        license: 'Apache-2.0',
        transport: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@slack/mcp-server'],
        },
        auth: {
          type: 'oauth2',
          provider: 'slack',
          scopes: ['chat:write', 'channels:read'],
        },
        category: 'Communication',
        tags: ['slack', 'messaging', 'team'],
        installCount: 8923,
        stars: 456,
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        namespace: 'anthropic/filesystem',
        name: 'Filesystem MCP Server',
        description: 'Read and write local files with security controls',
        publisher: 'Anthropic',
        publisherVerified: true,
        version: '2.0.0',
        homepage: 'https://github.com/anthropics/mcp-servers',
        repository: 'https://github.com/anthropics/mcp-servers',
        license: 'MIT',
        transport: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
        auth: {
          type: 'none',
        },
        category: 'System',
        tags: ['filesystem', 'files', 'local'],
        installCount: 25678,
        stars: 1234,
        lastUpdated: new Date().toISOString(),
      },
      {
        namespace: 'community/notion',
        name: 'Notion MCP Server',
        description: 'Access and update Notion databases and pages',
        publisher: 'Community',
        publisherVerified: false,
        version: '1.1.0',
        homepage: 'https://github.com/notion-mcp/server',
        repository: 'https://github.com/notion-mcp/server',
        license: 'MIT',
        transport: {
          type: 'sse',
          url: 'https://api.notion.com/mcp',
        },
        auth: {
          type: 'oauth2',
          provider: 'notion',
          scopes: ['read_content', 'insert_content'],
        },
        category: 'Productivity',
        tags: ['notion', 'notes', 'database'],
        installCount: 6789,
        stars: 321,
        lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Apply filters
    let filtered = mockServers;

    if (options.transportType) {
      filtered = filtered.filter(s => s.transport.type === options.transportType);
    }

    if (options.category) {
      filtered = filtered.filter(s => s.category === options.category);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.namespace.toLowerCase().includes(search)
      );
    }

    if (options.tags?.length) {
      filtered = filtered.filter(s =>
        s.tags?.some(tag => options.tags!.includes(tag))
      );
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      servers: filtered.slice(start, end),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  /**
   * Mock single server data
   */
  private getMockServerData(namespace: string): MCPRegistryServer | null {
    const mockData = this.getMockRegistryData({});
    return mockData.servers.find(s => s.namespace === namespace) || null;
  }
}

// Export singleton instance
export const registryClient = new RegistryClientService();
