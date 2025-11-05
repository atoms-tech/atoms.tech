/**
 * MCP Registry Client Service
 *
 * Fetches and caches MCP server data from the official MCP registry.
 * This service handles API communication with the public registry.
 *
 * Official API: https://registry.modelcontextprotocol.io
 * Documentation: https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/consuming/use-rest-api.md
 *
 * Using v0.1 API for stability (only backward-compatible changes)
 */

import { MCPAuthKind, MCPRegistryAuthInfo } from './types';

// Official MCP Registry API response types (v0.1)
// Note: The API returns a nested structure with 'server' and '_meta' at the top level
interface RegistryServerVersion {
  server: {
    $schema?: string;
    name: string;
    description?: string;
    version: string;
    homepage?: string;
    repository?: string | { url?: string; source?: string };
    license?: string;
    publisher?: {
      name?: string;
      url?: string;
    };
    packages?: Array<{
      registryType?: string;
      identifier?: string;
      version?: string;
      transport?: Record<string, unknown>;
      environmentVariables?: Record<string, string>[];
    }>;
    remotes?: Array<{
      type: string;
      url: string;
    }>;
    transport?: Record<string, unknown>;
    auth?: Record<string, unknown>;
    categories?: string[];
    tags?: string[];
  };
  _meta?: {
    [key: string]: unknown;
    'io.modelcontextprotocol.registry/official'?: {
      status: 'active' | 'deleted' | 'deprecated';
      publishedAt: string;
      updatedAt?: string;
      isLatest: boolean;
    };
  };
}

interface RegistryAPIResponse {
  servers: RegistryServerVersion[];
  metadata: {
    count: number;
    nextCursor?: string;
  };
}

// Our internal server representation
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
  auth?: MCPRegistryAuthInfo;

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
 * Fetches MCP servers from the official MCP registry with caching support.
 * Uses v0.1 API for stability (only backward-compatible changes).
 *
 * API Documentation: https://github.com/modelcontextprotocol/registry/blob/main/docs/guides/consuming/use-rest-api.md
 */
class RegistryClientService {
  private cache: Map<string, { data: MCPRegistryResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased from 5)
  // Use v0.1 for production stability
  private readonly REGISTRY_BASE_URL = 'https://registry.modelcontextprotocol.io/v0.1';

  /**
   * Fetch all servers from registry with optional filters
   * Uses cursor-based pagination to fetch all available servers
   */
  async fetchServers(options: RegistryFetchOptions = {}): Promise<MCPRegistryResponse> {
    const cacheKey = this.getCacheKey(options);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // Build query parameters for the official MCP registry API
      const params = new URLSearchParams();
      // Set a high limit to fetch more servers per request
      params.set('limit', '100'); // Fetch 100 at a time
      if (options.search) params.set('search', options.search);

      // Fetch all pages using cursor-based pagination
      let allServers: RegistryServerVersion[] = [];
      let cursor: string | undefined = undefined;
      let totalCount = 0;

      do {
        if (cursor) {
          params.set('cursor', cursor);
        }

        // API already includes /v0.1 in base URL
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

        const apiResponse: RegistryAPIResponse = await response.json();

        // Validate response structure
        if (!apiResponse.servers || !Array.isArray(apiResponse.servers)) {
          console.error('Invalid API response structure:', apiResponse);
          throw new Error('Invalid API response: missing servers array');
        }

        // Add servers from this page
        allServers = [...allServers, ...apiResponse.servers];
        
        // Update total count (use the latest metadata count)
        // totalCount = apiResponse.metadata.count; // Commented out as unused
        
        // Get next cursor for pagination
        cursor = apiResponse.metadata.nextCursor;
        
        // Remove cursor from params for next iteration
        params.delete('cursor');
      } while (cursor);

      // Transform API response to our internal format
      const transformedServers = allServers
        .map(item => this.transformServerVersion(item))
        .filter((server): server is MCPRegistryServer => server !== null);

      // Deduplicate servers by namespace (keep only the first occurrence)
      const seenNamespaces = new Set<string>();
      const uniqueServers = transformedServers.filter(server => {
        if (seenNamespaces.has(server.namespace)) {
          return false;
        }
        seenNamespaces.add(server.namespace);
        return true;
      });

      const transformedData: MCPRegistryResponse = {
        servers: uniqueServers,
        total: uniqueServers.length, // Use actual unique count
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      };

      // Cache the result
      this.cache.set(cacheKey, { data: transformedData, timestamp: Date.now() });

      return transformedData;
    } catch (error) {
      console.error('Error fetching from MCP registry:', error);

      // Return empty response instead of mock data
      return {
        servers: [],
        total: 0,
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      };
    }
  }

  /**
   * Transform API server version to our internal format
   * Handles v0.1 API response structure (nested server object)
   */
  private transformServerVersion(item: RegistryServerVersion): MCPRegistryServer | null {
    try {
      // Validate required fields - be more lenient
      if (!item) {
        console.warn('Invalid server data: item is null or undefined');
        return null;
      }
      
      if (!item.server) {
        console.warn('Invalid server data: missing server object', { item });
        return null;
      }
      
      const server = item.server;
      
      // Check if name exists and is not empty - be more lenient
      if (!server.name) {
        console.warn('Invalid server data: missing name', { 
          hasServer: !!server,
          serverKeys: server ? Object.keys(server) : [],
          item: JSON.stringify(item, null, 2).substring(0, 500)
        });
        return null;
      }
      
      const serverName = String(server.name).trim();
      if (!serverName) {
        console.warn('Invalid server data: empty name', { 
          name: server.name,
          server: server 
        });
        return null;
      }

      const meta = item._meta?.['io.modelcontextprotocol.registry/official'];

      // Extract transport info from packages or remotes
      let transport: Record<string, unknown> = { type: 'stdio' };
      let packageEnvVars: { name?: string; description?: string; value?: string }[] = [];
      let packageHeaders: { name?: string; description?: string; value?: string }[] = [];

      if (server.packages && server.packages.length > 0) {
        const pkg = server.packages[0];
        transport = pkg.transport || { type: 'stdio' };
        // Ensure transport has required fields
        if (!transport.type) {
          transport.type = 'stdio';
        }
        // Extract environment variables and headers from package
        packageEnvVars = pkg.environmentVariables || [];
        if ((transport as any).headers) {
          packageHeaders = (transport as any).headers;
        }
      } else if (server.remotes && server.remotes.length > 0) {
        const remote = server.remotes[0];
        if (remote && remote.type && remote.url) {
          transport = {
            type: remote.type === 'streamable-http' ? 'http' : remote.type,
            url: remote.url,
          };
          // Extract headers from remote
          if ((remote as any)?.headers) {
            packageHeaders = (remote as any).headers;
          }
        } else {
          console.warn('Invalid remote configuration:', remote);
          transport = { type: 'stdio' };
        }
      } else if (server.transport) {
        transport = server.transport;
        if (!transport.type) {
          transport.type = 'stdio';
        }
      }

      // Normalize transport type
      if (transport.type === 'sse' || transport.type === 'http' || transport.type === 'streamable-http') {
        transport.type = transport.type === 'streamable-http' ? 'http' : transport.type;
      } else {
        transport.type = 'stdio';
      }

      // Map environment variables from packages to transport.env for stdio servers
      if (transport.type === 'stdio' && packageEnvVars.length > 0) {
        const env: Record<string, string> = {};
        for (const envVar of packageEnvVars) {
          if (envVar.name) {
            // Use empty string as placeholder - will be filled by user
            env[envVar.name] = '';
          }
        }
        if (Object.keys(env).length > 0) {
          transport.env = env;
        }
      }

      // Extract repository URL
      let repositoryUrl: string | undefined;
      if (typeof server.repository === 'object' && server.repository !== null) {
        repositoryUrl = (server.repository as any).url;
      } else if (typeof server.repository === 'string') {
        repositoryUrl = server.repository;
      }

      // Safely extract name parts
      const nameParts = serverName.split('/');
      const shortName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : serverName;
      const publisherName = nameParts.length > 1 ? nameParts[0] : 'Unknown';

      // Normalize auth - try server.auth first, then infer from env vars/headers
      let normalizedAuth = this.normalizeAuth(server.auth);

      // If no auth detected, try to infer from environment variables and headers
      if (!normalizedAuth && (packageEnvVars.length > 0 || packageHeaders.length > 0)) {
        normalizedAuth = this.inferAuthFromTransport(packageEnvVars, packageHeaders);
      }

      return {
        namespace: serverName,
        name: shortName,
        description: server.description || '',
        publisher: server.publisher?.name || publisherName,
        publisherVerified: meta?.status === 'active' || false,
        version: server.version || '0.0.0',
        homepage: server.homepage,
        repository: repositoryUrl,
        license: server.license,
        transport: transport as any,
        auth: normalizedAuth,
        category: server.categories?.[0],
        tags: server.tags || [],
        lastUpdated: meta?.publishedAt || meta?.updatedAt,
      };
    } catch (error) {
      console.error('Error transforming server version:', error, { item });
      return null;
    }
  }

  /**
   * Infer authentication requirements from transport configuration
   */
  private inferAuthFromTransport(envVars: { key: string; value: string }[], headers: { key: string; value: string }[]): MCPRegistryAuthInfo | undefined {
    let type: MCPAuthKind = 'unknown';
    const scopes: string[] = [];
    let provider: string | undefined;
    let requiresUserSecret = false;
    let requiresOAuthPopup = false;

    // Check environment variables for auth indicators
    for (const envVar of envVars) {
      const name = (envVar.name || '').toLowerCase();
      const description = (envVar.description || '').toLowerCase();

      // OAuth indicators
      if (name.includes('oauth') || description.includes('oauth')) {
        type = 'oauth';
        requiresOAuthPopup = true;
      }
      // API key indicators
      else if (name.includes('api_key') || name.includes('apikey') || name === 'api_key') {
        if (type === 'unknown') type = 'api-key';
        requiresUserSecret = true;
      }
      // Token/Bearer indicators
      else if (name.includes('token') || name.includes('bearer') || name.includes('jwt')) {
        if (type === 'unknown') type = 'bearer';
        requiresUserSecret = true;
      }
      // Client ID/Secret (OAuth)
      else if (name.includes('client_id') || name.includes('client_secret')) {
        type = 'oauth';
        requiresOAuthPopup = true;
      }

      // Extract provider from env var name
      if (name.includes('github')) provider = 'github';
      else if (name.includes('google')) provider = 'google';
      else if (name.includes('slack')) provider = 'slack';
      else if (name.includes('notion')) provider = 'notion';
    }

    // Check headers for auth indicators
    for (const header of headers) {
      const name = (header.name || '').toLowerCase();
      const value = (header.value || '').toLowerCase();

      if (name === 'authorization') {
        if (value.includes('bearer') || value.includes('{') || value.includes('token')) {
          if (type === 'unknown') type = 'bearer';
          requiresUserSecret = true;
        }
      }
      else if (name.includes('api-key') || name.includes('x-api-key')) {
        if (type === 'unknown') type = 'api-key';
        requiresUserSecret = true;
      }
    }

    // If we detected any auth, return it
    if (type !== 'unknown') {
      return {
        type,
        provider,
        scopes,
        requiresUserSecret,
        requiresOAuthPopup,
        supportsDynamicClientRegistration: false,
        detection: 'heuristic',
        raw: { envVars, headers },
      };
    }

    return undefined;
  }

  private normalizeAuth(rawAuth: Record<string, unknown>): MCPRegistryAuthInfo | undefined {
    if (!rawAuth) {
        return undefined;
    }

    const auth = typeof rawAuth === 'object' && rawAuth !== null ? rawAuth : {};
    const rawTypeValue = String(
      auth.type || auth.scheme || auth.strategy || auth.method || auth.name || ''
    ).toLowerCase();

    if (!rawTypeValue || rawTypeValue === 'none') {
      return undefined;
    }

    let detection: MCPRegistryAuthInfo['detection'] = 'declared';
    let type: MCPAuthKind = 'unknown';

    const setTypeFromString = (value: string) => {
      const normalized = value.toLowerCase();
      if (!normalized || normalized === 'none') {
        type = 'none';
        return;
      }
      if (normalized.includes('oauth')) {
        type = 'oauth';
      } else if (normalized === 'bearer' || normalized === 'jwt' || normalized === 'token') {
        type = 'bearer';
      } else if (normalized.includes('api') && normalized.includes('key')) {
        type = 'api-key';
      }
    };

    setTypeFromString(rawTypeValue);

    const schemes = auth.schemes || auth.methods || auth.mechanisms;
    if (type === 'unknown' && Array.isArray(schemes)) {
      for (const scheme of schemes) {
        if (typeof scheme === 'string') {
          setTypeFromString(scheme);
        } else if (scheme?.type) {
          setTypeFromString(String(scheme.type));
        }
      }
    }

    if (type === 'unknown' && typeof auth.authorization === 'string') {
      setTypeFromString(auth.authorization);
    }

    if (type === 'unknown' && typeof auth.scheme === 'string') {
      setTypeFromString(auth.scheme);
    }

    if (type === 'unknown') {
      // heuristic detection based on field names
      detection = 'heuristic';
      if (auth.client_id || auth.clientSecret || auth.client_secret || auth.redirect_uri) {
        type = 'oauth';
      } else if (auth.header === 'Authorization' || auth.token || auth.secret) {
        type = 'bearer';
      } else if (auth.apiKey || auth.api_key || auth.keyParam || auth.query_param) {
        type = 'api-key';
      }
    }

    const scopes: string[] = [];
    const authScopes = auth.scopes || auth.scope;
    if (Array.isArray(authScopes)) {
      scopes.push(...authScopes.map((scope: unknown) => String(scope)));
    } else if (typeof authScopes === 'string') {
      scopes.push(...authScopes.split(/[ ,]+/).filter(Boolean));
    }

    const provider = auth.provider || auth.issuer || auth.vendor || auth.authority || undefined;

    const supportsDcr = Boolean(
      auth.dynamic_client_registration ||
      auth.supportsDcr ||
      auth.dcr ||
      auth.pkce ||
      auth.forward_pkce
    );

    const requiresOAuthPopup = type === 'oauth';
    const requiresUserSecret = type === 'bearer' || type === 'api-key';

    return {
      type,
      provider,
      scopes,
      requiresUserSecret,
      requiresOAuthPopup,
      supportsDynamicClientRegistration: supportsDcr,
      detection,
      raw: auth,
    };
  }

  /**
   * Fetch a specific server by namespace
   * Uses v0.1 API endpoint
   */
  async fetchServerByNamespace(namespace: string): Promise<MCPRegistryServer | null> {
    try {
      // Use the latest version endpoint (v0.1 API)
      const url = `${this.REGISTRY_BASE_URL}/servers/${encodeURIComponent(namespace)}/versions/latest`;

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

      const apiResponse: RegistryServerVersion = await response.json();
      return this.transformServerVersion(apiResponse);
    } catch (error) {
      console.error(`Error fetching server ${namespace}:`, error);
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
   * Note: We exclude page/pageSize from cache key since we fetch all servers
   */
  private getCacheKey(options: RegistryFetchOptions): string {
    // Exclude page/pageSize from cache key to cache the full dataset
    const { page: _page, pageSize: _pageSize, ...cacheOptions } = options;
    return JSON.stringify(cacheOptions);
  }
}

// Export singleton instance
export const registryClient = new RegistryClientService();
