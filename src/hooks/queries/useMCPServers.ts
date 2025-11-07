import { useQuery } from '@tanstack/react-query';
import type { ServerHealth, ServerLog, ToolPermissions } from '@/lib/schemas/mcp-install';

interface MCPServer {
    id: string;
    user_id: string;
    name: string;
    url: string;
    transport: string;
    auth: string;
    scope: string;
    organization_id?: string;
    tool_permissions: ToolPermissions;
    status: string;
    last_health_check?: string;
    health_check_error?: string;
    created_at: string;
    updated_at: string;
}

interface ServerLogsResponse {
    logs: ServerLog[];
    total: number;
}

/**
 * Fetch all MCP servers for the current user
 */
export function useMCPServers() {
    return useQuery<MCPServer[]>({
        queryKey: ['mcp-servers'],
        queryFn: async () => {
            const res = await fetch('/api/mcp/servers');
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch MCP servers');
            }
            const data = await res.json();
            const servers = Array.isArray(data)
                ? data
                : Array.isArray((data as { servers?: unknown }).servers)
                    ? (data as { servers: MCPServer[] }).servers
                    : [];
            return servers;
        },
        refetchInterval: 30000, // Poll every 30 seconds for status updates
        staleTime: 25000, // Consider stale after 25 seconds
    });
}

/**
 * Fetch a single MCP server by ID
 */
export function useMCPServer(serverId: string, enabled = true) {
    return useQuery<MCPServer>({
        queryKey: ['mcp-servers', serverId],
        queryFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch MCP server');
            }
            return res.json();
        },
        enabled,
    });
}

/**
 * Fetch server health status
 */
export function useServerHealth(serverId: string, enabled = true) {
    return useQuery<ServerHealth>({
        queryKey: ['mcp-server-health', serverId],
        queryFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}/health`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch health');
            }
            return res.json();
        },
        enabled,
        refetchInterval: 30000, // Poll every 30 seconds
        staleTime: 25000, // Consider stale after 25 seconds
    });
}

/**
 * Fetch server logs with pagination and filtering
 */
export function useServerLogs(
    serverId: string,
    options: {
        level?: string;
        limit?: number;
        offset?: number;
    } = {}
) {
    const { level, limit = 100, offset = 0 } = options;

    return useQuery<ServerLogsResponse>({
        queryKey: ['mcp-server-logs', serverId, level, limit, offset],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString(),
                ...(level && level !== 'all' && { level }),
            });

            const res = await fetch(`/api/mcp/servers/${serverId}/logs?${params}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch logs');
            }
            return res.json();
        },
    });
}

/**
 * Fetch tool permissions for a server
 */
export function useToolPermissions(serverId: string, enabled = true) {
    return useQuery<ToolPermissions>({
        queryKey: ['mcp-tool-permissions', serverId],
        queryFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}/permissions`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch permissions');
            }
            const data = await res.json();
            return data.tool_permissions || {};
        },
        enabled,
    });
}

/**
 * Fetch available tools for a server
 */
export function useServerTools(serverId: string, enabled = true) {
    return useQuery<string[]>({
        queryKey: ['mcp-server-tools', serverId],
        queryFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}/tools`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to fetch tools');
            }
            const data = await res.json();
            return data.tools || [];
        },
        enabled,
    });
}
