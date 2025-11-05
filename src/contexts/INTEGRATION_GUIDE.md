# MCPContext Integration Guide

This guide walks you through integrating the MCPContext into your atoms.tech application.

## Prerequisites

Before integrating MCPContext, ensure you have:

1. The `useMCPOAuth` hook available at `/src/hooks/useMCPOAuth.ts`
2. OAuth type definitions at `/src/types/mcp/oauth.types.ts`
3. A user authentication system that provides an access token
4. Backend API endpoints for MCP OAuth flow (`/api/mcp/oauth/*`)

## Step 1: Setup the Provider

### In Your Root Layout or App Component

```tsx
// app/layout.tsx or app/providers.tsx
import { MCPProvider } from '@/contexts/MCPContext';
import { useAuth } from '@/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  return (
    <MCPProvider accessToken={accessToken} autoRefresh={true}>
      {children}
    </MCPProvider>
  );
}
```

### In Next.js App Router

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Step 2: Create a Connection Management UI

### Basic Connection Component

```tsx
// components/mcp/MCPConnectionManager.tsx
'use client';

import { useMCP } from '@/contexts/MCPContext';
import { useState } from 'react';

const PROVIDERS = [
  { id: 'github' as const, name: 'GitHub', mcpName: 'github-integration' },
  { id: 'google' as const, name: 'Google Drive', mcpName: 'google-integration' },
  { id: 'azure' as const, name: 'Azure', mcpName: 'azure-integration' },
] as const;

export function MCPConnectionManager() {
  const {
    connect,
    disconnect,
    listConnections,
    isConnectionActive,
    isLoading,
    error,
    clearError,
  } = useMCP();

  const connections = listConnections();

  const handleConnect = async (provider: typeof PROVIDERS[number]['id'], mcpName: string) => {
    try {
      await connect(provider, mcpName);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async (provider: typeof PROVIDERS[number]['id'], mcpName: string) => {
    try {
      await disconnect(provider, mcpName);
    } catch (err) {
      console.error('Disconnection failed:', err);
    }
  };

  return (
    <div className="mcp-connection-manager">
      <h2>MCP Connections</h2>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      <div className="providers-list">
        {PROVIDERS.map((provider) => {
          const isActive = isConnectionActive(provider.id, provider.mcpName);

          return (
            <div key={provider.id} className="provider-card">
              <h3>{provider.name}</h3>
              <p>Status: {isActive ? 'Connected' : 'Disconnected'}</p>

              {!isActive ? (
                <button
                  onClick={() => handleConnect(provider.id, provider.mcpName)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button
                  onClick={() => handleDisconnect(provider.id, provider.mcpName)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Disconnecting...' : 'Disconnect'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="active-connections">
        <h3>Active Connections</h3>
        {connections.length === 0 ? (
          <p>No active connections</p>
        ) : (
          <ul>
            {connections.map((conn) => (
              <li key={`${conn.provider}_${conn.mcpName}`}>
                {conn.provider} - {conn.mcpName}
                {conn.lastRefreshedAt && (
                  <span> (Last refresh: {new Date(conn.lastRefreshedAt).toLocaleString()})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

## Step 3: Create a Status Indicator

### Global Status Component

```tsx
// components/mcp/MCPStatusIndicator.tsx
'use client';

import { useMCP } from '@/contexts/MCPContext';

export function MCPStatusIndicator() {
  const { hasAnyConnection, isLoading, isInitialized } = useMCP();

  if (!isInitialized) {
    return (
      <div className="mcp-status loading">
        <span>Initializing MCP...</span>
      </div>
    );
  }

  const isConnected = hasAnyConnection();

  return (
    <div className={`mcp-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator" />
      <span>{isConnected ? 'MCP Connected' : 'MCP Not Connected'}</span>
      {isLoading && <span className="loading-spinner" />}
    </div>
  );
}
```

## Step 4: Integrate with API Calls

### Create an MCP API Client

```tsx
// lib/mcp/client.ts
import { OAuthToken } from '@/contexts/MCPContext';

interface MCPApiClientOptions {
  token: OAuthToken;
  baseUrl?: string;
}

export class MCPApiClient {
  private token: OAuthToken;
  private baseUrl: string;

  constructor({ token, baseUrl = '/api/mcp' }: MCPApiClientOptions) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token.access_token}`,
        'X-MCP-Provider': this.token.provider,
        'X-MCP-Name': this.token.mcp_name,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`MCP API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Hook to use MCP API client
import { useMCP } from '@/contexts/MCPContext';
import { useMemo } from 'react';

export function useMCPApiClient() {
  const { activeConnection } = useMCP();

  const client = useMemo(() => {
    if (!activeConnection?.token) {
      return null;
    }

    return new MCPApiClient({ token: activeConnection.token });
  }, [activeConnection]);

  return client;
}
```

### Use the API Client in Components

```tsx
// components/features/MCPFeature.tsx
'use client';

import { useMCPApiClient } from '@/lib/mcp/client';
import { useState } from 'react';

export function MCPFeature() {
  const mcpClient = useMCPApiClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!mcpClient) {
      console.error('MCP client not available');
      return;
    }

    setLoading(true);
    try {
      const result = await mcpClient.get('/some-endpoint');
      setData(result);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mcpClient) {
    return <div>Please connect to an MCP provider to use this feature.</div>;
  }

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

## Step 5: Add OAuth Callback Handler

### Create Callback Page

```tsx
// app/auth/mcp/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMCP } from '@/contexts/MCPContext';

export default function MCPCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuth } = useMCP();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      router.push('/settings?mcp_error=' + encodeURIComponent(error));
      return;
    }

    if (code && state) {
      // Close the popup window and send message to parent
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'mcp_oauth_callback',
            code,
            state,
          },
          window.location.origin
        );
        window.close();
      } else {
        // If not in popup, redirect to settings
        router.push('/settings?mcp_success=true');
      }
    }
  }, [searchParams, router]);

  return (
    <div className="callback-container">
      <h2>Completing OAuth...</h2>
      <p>Please wait while we complete your connection.</p>
    </div>
  );
}
```

## Step 6: Add Settings Page Integration

### Settings Page with MCP Management

```tsx
// app/settings/mcp/page.tsx
import { MCPConnectionManager } from '@/components/mcp/MCPConnectionManager';
import { MCPStatusIndicator } from '@/components/mcp/MCPStatusIndicator';

export default function MCPSettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>MCP Connections</h1>
        <MCPStatusIndicator />
      </div>

      <div className="settings-content">
        <p>
          Manage your Model Context Protocol (MCP) connections. Connect to various
          providers to enable advanced integrations and features.
        </p>

        <MCPConnectionManager />
      </div>
    </div>
  );
}
```

## Step 7: Add Error Boundary

### MCP Error Boundary

```tsx
// components/mcp/MCPErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MCPErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('MCP Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="mcp-error">
            <h2>MCP Connection Error</h2>
            <p>There was an error with your MCP connection.</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

## Step 8: Testing

### Test Your Integration

1. **Connect to a provider:**
   ```tsx
   const { connect } = useMCP();
   await connect('github', 'my-integration');
   ```

2. **Check connection status:**
   ```tsx
   const { isConnectionActive } = useMCP();
   const isActive = isConnectionActive('github', 'my-integration');
   ```

3. **Make an API call:**
   ```tsx
   const client = useMCPApiClient();
   const data = await client.get('/endpoint');
   ```

4. **Handle disconnection:**
   ```tsx
   const { disconnect } = useMCP();
   await disconnect('github', 'my-integration');
   ```

## Common Issues and Solutions

### Issue: Tokens not persisting across page reloads

**Solution:** Ensure the `MCPProvider` is placed high enough in the component tree and that `accessToken` is provided.

### Issue: OAuth popup blocked

**Solution:** Inform users to allow popups for your domain. Add instructions in your UI.

### Issue: Tokens expiring too quickly

**Solution:** Ensure `autoRefresh={true}` is set on the `MCPProvider`. The context automatically refreshes tokens 5 minutes before expiry.

### Issue: Multiple connections not working

**Solution:** Ensure each connection has a unique `mcpName` parameter. The key format is `${provider}_${mcpName}`.

## Next Steps

1. Add MCP-specific features to your application
2. Create custom hooks for specific MCP operations
3. Implement connection status monitoring
4. Add analytics for connection usage
5. Create admin tools for managing user connections

## Additional Resources

- [MCPContext API Reference](./README.md)
- [Usage Examples](./MCPContext.example.tsx)
- [useMCPOAuth Hook Documentation](../hooks/useMCPOAuth.ts)

## Support

For issues or questions about MCPContext integration, please refer to the main atoms.tech documentation or contact the development team.
