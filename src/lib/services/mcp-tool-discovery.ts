import { logger } from '@/lib/utils/logger';

interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: Record<string, any>;
    annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    };
}

interface MCPServer {
    id: string;
    transport_type: string;
    url?: string;
    server_url?: string;
    auth_type?: string | null;
    auth_config?: Record<string, any> | null;
    transport?: Record<string, any> | null;
}

/**
 * Discover tools from an MCP server
 */
export async function discoverTools(server: MCPServer): Promise<MCPTool[]> {
    try {
        switch (server.transport_type) {
            case 'http':
            case 'sse':
                return await discoverHttpSseTools(server);
            case 'stdio':
                return await discoverStdioTools(server);
            default:
                logger.warn('Unsupported transport type for tool discovery', {
                    serverId: server.id,
                    transport: server.transport_type,
                });
                return [];
        }
    } catch (error) {
        logger.error('Tool discovery error', error, { serverId: server.id });
        return [];
    }
}

/**
 * Discover tools from HTTP/SSE server
 */
async function discoverHttpSseTools(server: MCPServer): Promise<MCPTool[]> {
    // Note: database column is 'url', not 'server_url'
    let url = server.url || (server.transport as any)?.url;

    // Handle empty object or invalid URL
    if (!url || url === '{}' || (typeof url === 'object' && Object.keys(url).length === 0)) {
        logger.warn('No URL configured for HTTP/SSE server', { serverId: server.id });
        return [];
    }

    // Handle case where URL might be stored as a JSON string
    if (typeof url === 'string') {
        // Check if it's a JSON object string
        if ((url.startsWith('{"url":') || url.startsWith('{')) && url.includes('"')) {
            try {
                const urlObj = JSON.parse(url);
                const extractedUrl = urlObj.url;

                // Check if this is a repository URL, not an MCP endpoint
                if (extractedUrl && (
                    extractedUrl.includes('github.com') ||
                    extractedUrl.includes('gitlab.com') ||
                    extractedUrl.includes('bitbucket.org')
                )) {
                    logger.warn('Server URL points to repository, not MCP endpoint', {
                        serverId: server.id,
                        url: extractedUrl,
                    });
                    return [];
                }

                url = extractedUrl;
            } catch (error) {
                logger.warn('Invalid JSON URL format for server', {
                    serverId: server.id,
                    url,
                });
                return [];
            }
        }
    }

    if (!url || typeof url !== 'string' || url.length === 0) {
        logger.warn('Invalid URL for HTTP/SSE server', { serverId: server.id });
        return [];
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        logger.warn('Malformed URL for HTTP/SSE server', {
            serverId: server.id,
            url,
        });
        return [];
    }

    try {
        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add auth headers from auth_config
        const authType = server.auth_type;
        const authConfig = server.auth_config || {};

        if (authType === 'bearer') {
            const bearerToken = authConfig.bearerToken || authConfig.apiKey;
            if (bearerToken) {
                headers['Authorization'] = `Bearer ${bearerToken}`;
            }
        } else if (authType === 'oauth') {
            const accessToken = authConfig.accessToken;
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
        }

        // Add API key header (common pattern for many MCP servers)
        if (authConfig.apiKey && authType !== 'bearer') {
            headers['X-API-Key'] = authConfig.apiKey;
        }

        // Add any custom headers
        if (authConfig.customHeaders && typeof authConfig.customHeaders === 'object') {
            Object.assign(headers, authConfig.customHeaders);
        }

        // MCP protocol: POST request to list tools
        const toolsUrl = `${url}/tools/list`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(toolsUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            logger.warn('Failed to fetch tools from server', {
                serverId: server.id,
                status: response.status,
                statusText: response.statusText,
            });
            return [];
        }

        const data = await response.json();

        // MCP protocol response format: { tools: [...] }
        if (data.tools && Array.isArray(data.tools)) {
            return data.tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                annotations: tool.annotations,
            }));
        }

        return [];
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            logger.warn('Tool discovery timeout', { serverId: server.id });
        } else {
            logger.error('Error discovering tools from HTTP/SSE server', error, {
                serverId: server.id,
            });
        }
        return [];
    }
}

/**
 * Discover tools from stdio server
 */
async function discoverStdioTools(server: MCPServer): Promise<MCPTool[]> {
    // For stdio servers, we would need to spawn the process and communicate via stdin/stdout
    // This is more complex and requires process management
    // For now, return empty array or cached tools from metadata

    logger.info('Stdio tool discovery not yet implemented', { serverId: server.id });

    // TODO: Implement stdio tool discovery
    // 1. Spawn the process with the configured command
    // 2. Send MCP protocol message to list tools
    // 3. Parse the response
    // 4. Clean up the process

    return [];
}

/**
 * Get tool names from discovered tools
 */
export function getToolNames(tools: MCPTool[]): string[] {
    return tools.map((tool) => tool.name);
}

/**
 * Categorize tools by their annotations
 */
export function categorizeTools(tools: MCPTool[]): {
    readOnly: MCPTool[];
    destructive: MCPTool[];
    idempotent: MCPTool[];
    openWorld: MCPTool[];
} {
    return {
        readOnly: tools.filter((tool) => tool.annotations?.readOnlyHint),
        destructive: tools.filter((tool) => tool.annotations?.destructiveHint),
        idempotent: tools.filter((tool) => tool.annotations?.idempotentHint),
        openWorld: tools.filter((tool) => tool.annotations?.openWorldHint),
    };
}

/**
 * Cache tools in server metadata
 */
export async function cacheDiscoveredTools(
    serverId: string,
    tools: MCPTool[],
    supabase: any
): Promise<void> {
    try {
        const { data: server } = await supabase
            .from('mcp_servers')
            .select('metadata')
            .eq('id', serverId)
            .single();

        const currentMetadata = (server?.metadata as Record<string, any>) || {};
        const updatedMetadata = {
            ...currentMetadata,
            tools,
            tools_discovered_at: new Date().toISOString(),
        };

        await supabase
            .from('mcp_servers')
            .update({ metadata: updatedMetadata })
            .eq('id', serverId);
    } catch (error) {
        logger.error('Error caching discovered tools', error, { serverId });
    }
}

