/**
 * MCP Context - Global MCP Connection Management
 *
 * Provides a centralized context for managing MCP OAuth connections across the application.
 * Features:
 * - Multi-provider connection management
 * - Automatic token refresh
 * - Persistent connection storage
 * - Error handling and recovery
 * - Connection restoration on mount
 */

'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { useMCPOAuth, OAuthProvider, OAuthToken } from '@/hooks/useMCPOAuth';

// Types
export interface MCPConnection {
  provider: OAuthProvider;
  mcpName: string;
  isConnected: boolean;
  token: OAuthToken | null;
  connectedAt: number;
  lastRefreshedAt?: number;
  error?: string;
}

export interface MCPConnectionState {
  [key: string]: MCPConnection; // key format: `${provider}_${mcpName}`
}

export interface MCPContextType {
  // State
  connections: MCPConnectionState;
  activeConnection: MCPConnection | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Methods
  connect: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  disconnect: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  refreshConnection: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  refreshAllConnections: () => Promise<void>;
  setActiveConnection: (provider: OAuthProvider, mcpName: string) => void;
  getConnection: (provider: OAuthProvider, mcpName: string) => MCPConnection | null;
  listConnections: () => MCPConnection[];
  clearError: () => void;

  // Connection checks
  isConnectionActive: (provider: OAuthProvider, mcpName: string) => boolean;
  hasAnyConnection: () => boolean;
}

// Storage keys
const STORAGE_KEY_CONNECTIONS = 'mcp_connections';
const STORAGE_KEY_ACTIVE = 'mcp_active_connection';

// Helper functions
function createConnectionKey(provider: OAuthProvider, mcpName: string): string {
  return `${provider}_${mcpName}`;
}

function parseConnectionKey(key: string): { provider: OAuthProvider; mcpName: string } | null {
  const parts = key.split('_');
  if (parts.length < 2) return null;

  const provider = parts[0] as OAuthProvider;
  const mcpName = parts.slice(1).join('_');

  return { provider, mcpName };
}

function isTokenExpired(token: OAuthToken): boolean {
  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();
  return expiresAt <= now;
}

function shouldRefreshToken(token: OAuthToken): boolean {
  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return expiresAt - now < fiveMinutes;
}

// Create context
const MCPContext = createContext<MCPContextType | undefined>(undefined);

// Provider props
export interface MCPProviderProps {
  children: React.ReactNode;
  accessToken?: string;
  autoRefresh?: boolean;
}

/**
 * MCP Provider Component
 *
 * Manages MCP OAuth connections globally and provides methods to connect, disconnect,
 * and refresh connections across the application.
 */
export function MCPProvider({
  children,
  accessToken,
  autoRefresh = true
}: MCPProviderProps) {
  // State
  const [connections, setConnections] = useState<MCPConnectionState>({});
  const [activeConnection, setActiveConnectionState] = useState<MCPConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // OAuth hook
  const oauth = useMCPOAuth(accessToken, autoRefresh);

  /**
   * Safe state update that checks if component is mounted
   */
  const safeSetConnections = useCallback((
    update: MCPConnectionState | ((prev: MCPConnectionState) => MCPConnectionState)
  ) => {
    if (isMountedRef.current) {
      setConnections(update);
    }
  }, []);

  const safeSetError = useCallback((err: string | null) => {
    if (isMountedRef.current) {
      setError(err);
    }
  }, []);

  const safeSetLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(loading);
    }
  }, []);

  /**
   * Save connections to localStorage
   */
  const saveConnectionsToStorage = useCallback((conns: MCPConnectionState) => {
    try {
      if (typeof window !== 'undefined') {
        // Don't save sensitive token data, just connection metadata
        const connectionsMetadata = Object.entries(conns).reduce((acc, [key, conn]) => {
          acc[key] = {
            provider: conn.provider,
            mcpName: conn.mcpName,
            isConnected: conn.isConnected,
            connectedAt: conn.connectedAt,
            lastRefreshedAt: conn.lastRefreshedAt,
          };
          return acc;
        }, {} as Record<string, Partial<MCPConnection>>);

        localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connectionsMetadata));
      }
    } catch (err) {
      console.error('Failed to save connections to storage:', err);
    }
  }, []);

  /**
   * Load connections from localStorage
   */
  const loadConnectionsFromStorage = useCallback((): Partial<MCPConnection>[] => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_CONNECTIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Object.values(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load connections from storage:', err);
    }
    return [];
  }, []);

  /**
   * Save active connection to localStorage
   */
  const saveActiveConnectionToStorage = useCallback((conn: MCPConnection | null) => {
    try {
      if (typeof window !== 'undefined') {
        if (conn) {
          localStorage.setItem(STORAGE_KEY_ACTIVE, createConnectionKey(conn.provider, conn.mcpName));
        } else {
          localStorage.removeItem(STORAGE_KEY_ACTIVE);
        }
      }
    } catch (err) {
      console.error('Failed to save active connection:', err);
    }
  }, []);

  /**
   * Get connection by provider and MCP name
   */
  const getConnection = useCallback((
    provider: OAuthProvider,
    mcpName: string
  ): MCPConnection | null => {
    const key = createConnectionKey(provider, mcpName);
    return connections[key] || null;
  }, [connections]);

  /**
   * Check if connection is active (connected and not expired)
   */
  const isConnectionActive = useCallback((
    provider: OAuthProvider,
    mcpName: string
  ): boolean => {
    const connection = getConnection(provider, mcpName);

    if (!connection || !connection.isConnected || !connection.token) {
      return false;
    }

    return !isTokenExpired(connection.token);
  }, [getConnection]);

  /**
   * Check if any connection exists
   */
  const hasAnyConnection = useCallback((): boolean => {
    return Object.values(connections).some(conn => conn.isConnected && conn.token && !isTokenExpired(conn.token));
  }, [connections]);

  /**
   * List all connections
   */
  const listConnections = useCallback((): MCPConnection[] => {
    return Object.values(connections);
  }, [connections]);

  /**
   * Connect to an MCP provider
   */
  const connect = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    safeSetLoading(true);
    safeSetError(null);

    try {
      await oauth.initiateOAuth(provider, mcpName);

      // Note: The actual connection will be updated after OAuth callback completes
      // via the checkAndUpdateConnections function

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to MCP provider';
      safeSetError(errorMessage);

      // Update connection with error
      const key = createConnectionKey(provider, mcpName);
      safeSetConnections(prev => ({
        ...prev,
        [key]: {
          provider,
          mcpName,
          isConnected: false,
          token: null,
          connectedAt: Date.now(),
          error: errorMessage,
        },
      }));

      throw err;
    } finally {
      safeSetLoading(false);
    }
  }, [oauth, safeSetLoading, safeSetError, safeSetConnections]);

  /**
   * Disconnect from an MCP provider
   */
  const disconnect = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    safeSetLoading(true);
    safeSetError(null);

    try {
      await oauth.revokeConnection(provider, mcpName);

      // Remove connection from state
      const key = createConnectionKey(provider, mcpName);
      safeSetConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[key];
        saveConnectionsToStorage(newConnections);
        return newConnections;
      });

      // Clear active connection if it was the disconnected one
      if (
        activeConnection &&
        activeConnection.provider === provider &&
        activeConnection.mcpName === mcpName
      ) {
        setActiveConnectionState(null);
        saveActiveConnectionToStorage(null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect from MCP provider';
      safeSetError(errorMessage);
      throw err;
    } finally {
      safeSetLoading(false);
    }
  }, [oauth, activeConnection, safeSetLoading, safeSetError, safeSetConnections, saveConnectionsToStorage, saveActiveConnectionToStorage]);

  /**
   * Refresh a specific connection's token
   */
  const refreshConnection = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    try {
      await oauth.refreshToken(provider, mcpName);

      // Update last refreshed timestamp
      const key = createConnectionKey(provider, mcpName);
      safeSetConnections(prev => {
        const connection = prev[key];
        if (!connection) return prev;

        const updated = {
          ...prev,
          [key]: {
            ...connection,
            lastRefreshedAt: Date.now(),
          },
        };

        saveConnectionsToStorage(updated);
        return updated;
      });

    } catch (err) {
      console.error(`Failed to refresh connection for ${provider}/${mcpName}:`, err);

      // Update connection with error but don't throw
      const key = createConnectionKey(provider, mcpName);
      safeSetConnections(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          error: err instanceof Error ? err.message : 'Token refresh failed',
        },
      }));
    }
  }, [oauth, safeSetConnections, saveConnectionsToStorage]);

  /**
   * Refresh all active connections
   */
  const refreshAllConnections = useCallback(async (): Promise<void> => {
    const connectionsToRefresh = Object.values(connections).filter(conn => {
      return conn.isConnected && conn.token && shouldRefreshToken(conn.token);
    });

    if (connectionsToRefresh.length === 0) {
      return;
    }

    console.log(`Refreshing ${connectionsToRefresh.length} MCP connection(s)`);

    await Promise.allSettled(
      connectionsToRefresh.map(conn =>
        refreshConnection(conn.provider, conn.mcpName)
      )
    );
  }, [connections, refreshConnection]);

  /**
   * Set active connection
   */
  const setActiveConnection = useCallback((
    provider: OAuthProvider,
    mcpName: string
  ) => {
    const connection = getConnection(provider, mcpName);

    if (!connection) {
      console.warn(`Connection not found: ${provider}/${mcpName}`);
      return;
    }

    setActiveConnectionState(connection);
    saveActiveConnectionToStorage(connection);
  }, [getConnection, saveActiveConnectionToStorage]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    safeSetError(null);
  }, [safeSetError]);


  /**
   * Initialize connections on mount
   */
  useEffect(() => {
    if (isInitialized || !accessToken) return;

    const initializeConnections = async () => {
      safeSetLoading(true);

      try {
        // Load stored connection metadata
        const storedConnections = loadConnectionsFromStorage();

        // Validate and restore connections
        const validatedConnections: MCPConnectionState = {};

        for (const stored of storedConnections) {
          if (!stored.provider || !stored.mcpName) continue;

          const key = createConnectionKey(stored.provider, stored.mcpName);

          // Get current token from OAuth hook
          const token = oauth.getToken(stored.provider, stored.mcpName);
          const isConnected = oauth.getConnectionStatus(stored.provider, stored.mcpName);

          if (isConnected && token) {
            validatedConnections[key] = {
              provider: stored.provider,
              mcpName: stored.mcpName,
              isConnected: true,
              token,
              connectedAt: stored.connectedAt || Date.now(),
              lastRefreshedAt: stored.lastRefreshedAt,
            };

            // Refresh if token is about to expire
            if (shouldRefreshToken(token)) {
              refreshConnection(stored.provider, stored.mcpName);
            }
          }
        }

        safeSetConnections(validatedConnections);

        // Restore active connection
        if (typeof window !== 'undefined') {
          const activeKey = localStorage.getItem(STORAGE_KEY_ACTIVE);
          if (activeKey) {
            const parsed = parseConnectionKey(activeKey);
            if (parsed && validatedConnections[activeKey]) {
              setActiveConnectionState(validatedConnections[activeKey]);
            }
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize MCP connections:', err);
        safeSetError('Failed to restore MCP connections');
      } finally {
        safeSetLoading(false);
      }
    };

    initializeConnections();
  }, [
    isInitialized,
    accessToken,
    oauth,
    loadConnectionsFromStorage,
    refreshConnection,
    safeSetConnections,
    safeSetLoading,
    safeSetError,
  ]);

  /**
   * Set up auto-refresh interval for all connections
   */
  useEffect(() => {
    if (!autoRefresh || !accessToken || !isInitialized) {
      return;
    }

    // Initial refresh check
    refreshAllConnections();

    // Set up periodic refresh every 5 minutes
    refreshIntervalRef.current = setInterval(() => {
      refreshAllConnections();
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, accessToken, isInitialized, refreshAllConnections]);

  /**
   * Sync error state with OAuth hook
   */
  useEffect(() => {
    if (oauth.error) {
      safeSetError(oauth.error);
    }
  }, [oauth.error, safeSetError]);

  /**
   * Save connections to storage whenever they change
   */
  useEffect(() => {
    if (isInitialized && Object.keys(connections).length > 0) {
      saveConnectionsToStorage(connections);
    }
  }, [connections, isInitialized, saveConnectionsToStorage]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Context value
  const value: MCPContextType = {
    // State
    connections,
    activeConnection,
    isLoading: isLoading || oauth.isLoading,
    error: error || oauth.error,
    isInitialized,

    // Methods
    connect,
    disconnect,
    refreshConnection,
    refreshAllConnections,
    setActiveConnection,
    getConnection,
    listConnections,
    clearError,
    isConnectionActive,
    hasAnyConnection,
  };

  return (
    <MCPContext.Provider value={value}>
      {children}
    </MCPContext.Provider>
  );
}

/**
 * Hook to access MCP context
 *
 * @throws Error if used outside of MCPProvider
 */
export function useMCP(): MCPContextType {
  const context = useContext(MCPContext);

  if (context === undefined) {
    throw new Error('useMCP must be used within a MCPProvider');
  }

  return context;
}

/**
 * Hook to check if MCP context is available
 */
export function useIsMCPAvailable(): boolean {
  const context = useContext(MCPContext);
  return context !== undefined;
}

// Export context for advanced use cases
export { MCPContext };

// Export types
export type { OAuthProvider, OAuthToken } from '@/hooks/useMCPOAuth';
