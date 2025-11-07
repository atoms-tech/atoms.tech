import { logger } from '@/lib/utils/logger';

interface HealthCheckResult {
    status: 'running' | 'starting' | 'stopped' | 'error' | 'unknown';
    last_check: string;
    error?: string;
    response_time_ms?: number;
    details?: Record<string, any>;
}

interface MCPServer {
    id: string;
    transport_type: string;
    url?: string; // Database column for MCP endpoint URL
    enabled: boolean;
    auth_type?: string | null;
    auth_config?: Record<string, any> | null;
    transport?: Record<string, any> | null;
    stdio_config?: Record<string, any> | null;
}

/**
 * Perform health check on an MCP server
 */
export async function performHealthCheck(server: MCPServer): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    try {
        // If server is disabled, return stopped status
        if (!server.enabled) {
            return {
                status: 'stopped',
                last_check: now,
            };
        }

        // Handle different transport types
        switch (server.transport_type) {
            case 'http':
            case 'sse':
                return await checkHttpSseServer(server, startTime, now);
            case 'stdio':
                return await checkStdioServer(server, startTime, now);
            default:
                return {
                    status: 'unknown',
                    last_check: now,
                    error: `Unsupported transport type: ${server.transport_type}`,
                };
        }
    } catch (error) {
        logger.error('Health check error', error, { serverId: server.id });
        return {
            status: 'error',
            last_check: now,
            error: error instanceof Error ? error.message : 'Unknown error',
            response_time_ms: Date.now() - startTime,
        };
    }
}

/**
 * Check HTTP/SSE server health
 */
async function checkHttpSseServer(
    server: MCPServer,
    startTime: number,
    now: string
): Promise<HealthCheckResult> {
    // Note: database column is 'url', not 'server_url'
    let url = server.url || (server.transport as any)?.url;

    // Handle JSON URL format
    if (typeof url === 'string' && url.startsWith('{') && url.includes('"url"')) {
        try {
            const urlObj = JSON.parse(url);
            url = urlObj.url;
        } catch (error) {
            // Invalid JSON, use as-is
        }
    }

    const urlStr = typeof url === 'string' ? url : String(url || '');

    if (!urlStr || urlStr === '{}' || urlStr.length === 0) {
        return {
            status: 'error',
            last_check: now,
            error: 'No URL configured for HTTP/SSE server',
        };
    }

    try {
        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add auth headers if configured
        if (server.auth_type === 'bearer' && server.auth_config?.bearerToken) {
            headers['Authorization'] = `Bearer ${server.auth_config.bearerToken}`;
        }

        // Try to ping the server (with timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(urlStr, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        if (response.ok) {
            return {
                status: 'running',
                last_check: now,
                response_time_ms: responseTime,
                details: {
                    status_code: response.status,
                    content_type: response.headers.get('content-type'),
                },
            };
        } else {
            return {
                status: 'error',
                last_check: now,
                error: `Server returned ${response.status}: ${response.statusText}`,
                response_time_ms: responseTime,
            };
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                status: 'error',
                last_check: now,
                error: 'Health check timeout (5s)',
                response_time_ms: Date.now() - startTime,
            };
        }

        return {
            status: 'error',
            last_check: now,
            error: error instanceof Error ? error.message : 'Connection failed',
            response_time_ms: Date.now() - startTime,
        };
    }
}

/**
 * Check stdio server health
 */
async function checkStdioServer(
    server: MCPServer,
    startTime: number,
    now: string
): Promise<HealthCheckResult> {
    // For stdio servers, we can't really "ping" them
    // We check if the command is configured and assume it's healthy if enabled
    const command = server.stdio_config?.command;

    if (!command) {
        return {
            status: 'error',
            last_check: now,
            error: 'No command configured for stdio server',
        };
    }

    // TODO: Could potentially spawn the process briefly to check if it's valid
    // For now, just return running if enabled
    return {
        status: 'running',
        last_check: now,
        response_time_ms: Date.now() - startTime,
        details: {
            command,
            note: 'Stdio servers are checked by configuration only',
        },
    };
}

/**
 * Batch health check for multiple servers
 */
export async function batchHealthCheck(servers: MCPServer[]): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    // Run health checks in parallel with a limit
    const BATCH_SIZE = 5;
    for (let i = 0; i < servers.length; i += BATCH_SIZE) {
        const batch = servers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(async (server) => ({
                id: server.id,
                result: await performHealthCheck(server),
            }))
        );

        batchResults.forEach(({ id, result }) => {
            results.set(id, result);
        });
    }

    return results;
}

