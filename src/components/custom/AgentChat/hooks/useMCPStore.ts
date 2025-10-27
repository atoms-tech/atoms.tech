import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MCPServerConfig {
    id: string;
    name: string;
    type: 'http' | 'stdio';
    // For HTTP servers
    url?: string;
    headers?: Record<string, string>;
    // For stdio servers
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    // Common
    autoConnect?: boolean;
    organizationId: string;
}

interface MCPStore {
    servers: Record<string, MCPServerConfig>;
    _hasHydrated: boolean;

    addServer: (server: Omit<MCPServerConfig, 'id'>, orgId: string) => string;
    removeServer: (serverId: string) => void;
    updateServer: (serverId: string, updates: Partial<MCPServerConfig>) => void;
    getServersForOrg: (orgId: string) => MCPServerConfig[];
    setHasHydrated: (hydrated: boolean) => void;
}

export const useMCPStore = create<MCPStore>()(
    persist(
        (set, get) => ({
            servers: {},
            _hasHydrated: false,

            addServer: (serverConfig, orgId) => {
                const id = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const server: MCPServerConfig = {
                    ...serverConfig,
                    id,
                    organizationId: orgId,
                };
                set((state) => ({
                    servers: { ...state.servers, [id]: server },
                }));
                return id;
            },

            removeServer: (serverId) => {
                set((state) => {
                    const { [serverId]: _, ...rest } = state.servers;
                    return { servers: rest };
                });
            },

            updateServer: (serverId, updates) => {
                set((state) => {
                    const server = state.servers[serverId];
                    if (!server) return state;
                    return {
                        servers: {
                            ...state.servers,
                            [serverId]: { ...server, ...updates },
                        },
                    };
                });
            },

            getServersForOrg: (orgId) => {
                return Object.values(get().servers).filter(
                    (server) => server.organizationId === orgId,
                );
            },

            setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
        }),
        {
            name: 'mcp-store',
            partialize: (state) => ({
                servers: state.servers,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                    console.log('MCP Store hydrated');
                }
            },
        },
    ),
);
