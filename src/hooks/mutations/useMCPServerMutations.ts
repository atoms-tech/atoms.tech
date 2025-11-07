import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserInstallForm, AdminInstallForm, ToolPermissions } from '@/lib/schemas/mcp-install';

/**
 * Install a new MCP server (user-initiated)
 */
export function useInstallMCPServer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UserInstallForm | AdminInstallForm) => {
            const res = await fetch('/api/mcp/servers/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to install server');
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        },
    });
}

/**
 * Update tool permissions for a server
 */
export function useUpdateToolPermissions(serverId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (permissions: ToolPermissions) => {
            const res = await fetch(`/api/mcp/servers/${serverId}/permissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tool_permissions: permissions }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update permissions');
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-tool-permissions', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        },
    });
}

/**
 * Start a server
 */
export function useStartServer(serverId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}/start`, {
                method: 'POST',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to start server');
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-server-health', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        },
    });
}

/**
 * Stop a server
 */
export function useStopServer(serverId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/mcp/servers/${serverId}/stop`, {
                method: 'POST',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to stop server');
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-server-health', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers', serverId] });
            queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        },
    });
}

/**
 * Delete a server
 */
export function useDeleteServer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serverId: string) => {
            const res = await fetch(`/api/mcp/servers/${serverId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete server');
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mcp-servers'] });
        },
    });
}

/**
 * Toggle server power (start/stop)
 */
export function useToggleServerPower(serverId: string, currentStatus: string) {
    const startMutation = useStartServer(serverId);
    const stopMutation = useStopServer(serverId);

    return {
        mutate: () => {
            if (currentStatus === 'running') {
                stopMutation.mutate();
            } else {
                startMutation.mutate();
            }
        },
        isPending: startMutation.isPending || stopMutation.isPending,
        isError: startMutation.isError || stopMutation.isError,
        error: startMutation.error || stopMutation.error,
    };
}

