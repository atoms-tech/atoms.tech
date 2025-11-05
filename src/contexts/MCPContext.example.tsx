/**
 * MCP Context - Usage Examples
 *
 * This file demonstrates how to use the MCPContext in your application.
 */

// ============================================================================
// Shared Imports
// ============================================================================

import { MCPProvider, useMCP, useIsMCPAvailable } from '@/contexts/MCPContext';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

// ============================================================================
// Example 1: Basic Setup in App Layout
// ============================================================================

function AppLayout({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  return (
    <MCPProvider accessToken={accessToken ?? undefined} autoRefresh={true}>
      {children}
    </MCPProvider>
  );
}

// ============================================================================
// Example 2: Connecting to an MCP Provider
// ============================================================================

function MCPConnectionButton() {
  const { connect, disconnect, isConnectionActive, isLoading, error } = useMCP();
  const [provider] = useState<'github' | 'google'>('github');
  const mcpName = 'my-github-integration';

  const handleConnect = async () => {
    try {
      await connect(provider, mcpName);
      console.log('Successfully connected to MCP provider!');
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect(provider, mcpName);
      console.log('Successfully disconnected from MCP provider!');
    } catch (err) {
      console.error('Disconnection failed:', err);
    }
  };

  const isConnected = isConnectionActive(provider, mcpName);

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {!isConnected ? (
        <button onClick={handleConnect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect to GitHub'}
        </button>
      ) : (
        <button onClick={handleDisconnect} disabled={isLoading}>
          {isLoading ? 'Disconnecting...' : 'Disconnect from GitHub'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Listing All Connections
// ============================================================================

function MCPConnectionsList() {
  const { listConnections, activeConnection, setActiveConnection } = useMCP();

  const connections = listConnections();

  return (
    <div>
      <h2>MCP Connections</h2>

      {connections.length === 0 ? (
        <p>No connections available</p>
      ) : (
        <ul>
          {connections.map((conn) => {
            const isActive =
              activeConnection?.provider === conn.provider &&
              activeConnection?.mcpName === conn.mcpName;

            return (
              <li key={`${conn.provider}_${conn.mcpName}`}>
                <div>
                  <strong>{conn.mcpName}</strong>
                  <span> ({conn.provider})</span>
                  {isActive && <span> - Active</span>}
                </div>

                <div>
                  Status: {conn.isConnected ? 'Connected' : 'Disconnected'}
                  {conn.error && <span className="error"> - {conn.error}</span>}
                </div>

                {conn.lastRefreshedAt && (
                  <div>
                    Last refreshed: {new Date(conn.lastRefreshedAt).toLocaleString()}
                  </div>
                )}

                {!isActive && conn.isConnected && (
                  <button onClick={() => setActiveConnection(conn.provider, conn.mcpName)}>
                    Set as Active
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Manual Token Refresh
// ============================================================================

function MCPRefreshButton() {
  const { refreshConnection, refreshAllConnections, isLoading } = useMCP();

  const handleRefreshSingle = async () => {
    try {
      await refreshConnection('github', 'my-github-integration');
      console.log('Token refreshed successfully!');
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await refreshAllConnections();
      console.log('All tokens refreshed successfully!');
    } catch (err) {
      console.error('Refresh all failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleRefreshSingle} disabled={isLoading}>
        Refresh GitHub Token
      </button>

      <button onClick={handleRefreshAll} disabled={isLoading}>
        Refresh All Tokens
      </button>
    </div>
  );
}

// ============================================================================
// Example 5: Checking Connection Status
// ============================================================================

function MCPStatusIndicator() {
  const {
    isConnectionActive,
    hasAnyConnection,
    getConnection,
    isInitialized,
  } = useMCP();

  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');

  useEffect(() => {
    if (!isInitialized) {
      setStatus('loading');
      return;
    }

    if (hasAnyConnection()) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
  }, [isInitialized, hasAnyConnection]);

  // Check specific connection
  const githubActive = isConnectionActive('github', 'my-github-integration');
  const githubConnection = getConnection('github', 'my-github-integration');

  return (
    <div>
      <div>
        Overall Status:{' '}
        {status === 'loading' ? 'Loading...' : status === 'connected' ? 'Connected' : 'Not Connected'}
      </div>

      {githubConnection && (
        <div>
          GitHub Connection:{' '}
          {githubActive ? 'Active' : 'Inactive'}
          {githubConnection.token && (
            <div>
              Token expires: {new Date(githubConnection.token.expires_at).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Error Handling
// ============================================================================

function MCPErrorHandler() {
  const { error, clearError } = useMCP();

  useEffect(() => {
    if (error) {
      // Show error notification
      console.error('MCP Error:', error);

      // Auto-clear after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="error-banner">
      <span>{error}</span>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}

// ============================================================================
// Example 7: Using Active Connection with API Calls
// ============================================================================

function MCPApiCall() {
  const { activeConnection } = useMCP();

  const makeAuthenticatedRequest = async () => {
    if (!activeConnection?.token) {
      throw new Error('No active MCP connection');
    }

    const response = await fetch('/api/mcp/some-endpoint', {
      headers: {
        Authorization: `Bearer ${activeConnection.token.access_token}`,
        'X-MCP-Provider': activeConnection.provider,
        'X-MCP-Name': activeConnection.mcpName,
      },
    });

    return response.json();
  };

  const handleApiCall = async () => {
    try {
      const data = await makeAuthenticatedRequest();
      console.log('API Response:', data);
    } catch (err) {
      console.error('API call failed:', err);
    }
  };

  return (
    <button onClick={handleApiCall} disabled={!activeConnection}>
      Make MCP API Call
    </button>
  );
}

// ============================================================================
// Example 8: Advanced - Multiple Providers
// ============================================================================

function MultiProviderConnector() {
  const { connect, listConnections, isLoading } = useMCP();

  const providers = [
    { id: 'github' as const, name: 'GitHub', mcpName: 'github-integration' },
    { id: 'google' as const, name: 'Google', mcpName: 'google-integration' },
    { id: 'azure' as const, name: 'Azure', mcpName: 'azure-integration' },
  ];

  const handleConnect = async (provider: 'github' | 'google' | 'azure', mcpName: string) => {
    try {
      await connect(provider, mcpName);
    } catch (err) {
      console.error(`Failed to connect to ${provider}:`, err);
    }
  };

  const connections = listConnections();

  return (
    <div>
      <h2>Connect to Multiple Providers</h2>

      <div>
        {providers.map((provider) => {
          const isConnected = connections.some(
            (c) => c.provider === provider.id && c.mcpName === provider.mcpName
          );

          return (
            <div key={provider.id}>
              <button
                onClick={() => handleConnect(provider.id, provider.mcpName)}
                disabled={isLoading || isConnected}
              >
                {isConnected ? `${provider.name} Connected` : `Connect ${provider.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div>
        <h3>Connected Providers</h3>
        <ul>
          {connections.map((conn) => (
            <li key={`${conn.provider}_${conn.mcpName}`}>
              {conn.provider} - {conn.mcpName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// Example 9: Check if MCP is Available (Optional Provider Pattern)
// ============================================================================

function OptionalMCPFeature() {
  const isMCPAvailable = useIsMCPAvailable();

  if (!isMCPAvailable) {
    return <div>MCP features not available</div>;
  }

  return <MCPEnabledComponent />;
}

function MCPEnabledComponent() {
  const { hasAnyConnection } = useMCP();

  return (
    <div>
      {hasAnyConnection() ? (
        <div>MCP is connected and ready!</div>
      ) : (
        <div>Please connect to an MCP provider</div>
      )}
    </div>
  );
}

export {
  AppLayout,
  MCPConnectionButton,
  MCPConnectionsList,
  MCPRefreshButton,
  MCPStatusIndicator,
  MCPErrorHandler,
  MCPApiCall,
  MultiProviderConnector,
  OptionalMCPFeature,
};
