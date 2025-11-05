# MCP Context

A comprehensive React Context for managing MCP (Model Context Protocol) OAuth connections in the atoms.tech application.

## Overview

The MCPContext provides a centralized solution for managing OAuth connections to multiple MCP providers, with features including:

- **Multi-provider support**: Connect to GitHub, Google, Azure, and Auth0
- **Automatic token refresh**: Tokens are automatically refreshed before expiration
- **Persistent storage**: Connections are saved to localStorage and restored on mount
- **Error handling**: Comprehensive error handling and recovery mechanisms
- **Type-safe**: Full TypeScript support with detailed type definitions

## Installation

The MCPContext is already included in the atoms.tech project. No additional installation is required.

## Quick Start

### 1. Wrap Your App with MCPProvider

```tsx
import { MCPProvider } from '@/contexts/MCPContext';
import { useAuth } from '@/hooks/useAuth';

function App({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  return (
    <MCPProvider accessToken={accessToken} autoRefresh={true}>
      {children}
    </MCPProvider>
  );
}
```

### 2. Use the useMCP Hook

```tsx
import { useMCP } from '@/contexts/MCPContext';

function MyComponent() {
  const { connect, disconnect, isConnectionActive } = useMCP();

  const handleConnect = async () => {
    await connect('github', 'my-integration');
  };

  return (
    <button onClick={handleConnect}>
      Connect to GitHub
    </button>
  );
}
```

## API Reference

### MCPProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | Child components |
| `accessToken` | `string` | `undefined` | User's authentication token |
| `autoRefresh` | `boolean` | `true` | Enable automatic token refresh |

### useMCP Hook

The `useMCP` hook returns an object with the following properties and methods:

#### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `connections` | `MCPConnectionState` | All active MCP connections |
| `activeConnection` | `MCPConnection \| null` | Currently active connection |
| `isLoading` | `boolean` | Loading state for any operation |
| `error` | `string \| null` | Current error message |
| `isInitialized` | `boolean` | Whether the context has been initialized |

#### Methods

##### `connect(provider, mcpName)`
Connect to an MCP provider.

```tsx
await connect('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

**Returns:** `Promise<void>`

---

##### `disconnect(provider, mcpName)`
Disconnect from an MCP provider.

```tsx
await disconnect('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

**Returns:** `Promise<void>`

---

##### `refreshConnection(provider, mcpName)`
Manually refresh a specific connection's token.

```tsx
await refreshConnection('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

**Returns:** `Promise<void>`

---

##### `refreshAllConnections()`
Refresh all active connections that are about to expire.

```tsx
await refreshAllConnections();
```

**Returns:** `Promise<void>`

---

##### `setActiveConnection(provider, mcpName)`
Set a connection as the active connection.

```tsx
setActiveConnection('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

---

##### `getConnection(provider, mcpName)`
Get a specific connection.

```tsx
const connection = getConnection('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

**Returns:** `MCPConnection | null`

---

##### `listConnections()`
List all connections.

```tsx
const allConnections = listConnections();
```

**Returns:** `MCPConnection[]`

---

##### `clearError()`
Clear the current error state.

```tsx
clearError();
```

---

##### `isConnectionActive(provider, mcpName)`
Check if a connection is active and not expired.

```tsx
const isActive = isConnectionActive('github', 'my-github-integration');
```

**Parameters:**
- `provider`: `'github' | 'google' | 'azure' | 'auth0'`
- `mcpName`: `string` - Unique name for this MCP connection

**Returns:** `boolean`

---

##### `hasAnyConnection()`
Check if any connection exists.

```tsx
const hasConnection = hasAnyConnection();
```

**Returns:** `boolean`

## Type Definitions

### MCPConnection

```tsx
interface MCPConnection {
  provider: OAuthProvider;
  mcpName: string;
  isConnected: boolean;
  token: OAuthToken | null;
  connectedAt: number;
  lastRefreshedAt?: number;
  error?: string;
}
```

### OAuthToken

```tsx
interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  token_type: string;
  scope: string;
  provider: OAuthProvider;
  mcp_name: string;
}
```

### OAuthProvider

```tsx
type OAuthProvider = 'github' | 'google' | 'azure' | 'auth0';
```

## Usage Examples

### Basic Connection Management

```tsx
function MCPConnectionButton() {
  const { connect, disconnect, isConnectionActive, isLoading, error } = useMCP();

  const isConnected = isConnectionActive('github', 'my-integration');

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {!isConnected ? (
        <button onClick={() => connect('github', 'my-integration')} disabled={isLoading}>
          Connect
        </button>
      ) : (
        <button onClick={() => disconnect('github', 'my-integration')} disabled={isLoading}>
          Disconnect
        </button>
      )}
    </div>
  );
}
```

### List All Connections

```tsx
function MCPConnectionsList() {
  const { listConnections, activeConnection, setActiveConnection } = useMCP();

  const connections = listConnections();

  return (
    <ul>
      {connections.map((conn) => (
        <li key={`${conn.provider}_${conn.mcpName}`}>
          <strong>{conn.mcpName}</strong> ({conn.provider})
          {activeConnection?.mcpName === conn.mcpName && ' - Active'}

          <button onClick={() => setActiveConnection(conn.provider, conn.mcpName)}>
            Set Active
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Using Active Connection with API Calls

```tsx
function MCPApiCall() {
  const { activeConnection } = useMCP();

  const makeAuthenticatedRequest = async () => {
    if (!activeConnection?.token) {
      throw new Error('No active MCP connection');
    }

    const response = await fetch('/api/mcp/endpoint', {
      headers: {
        Authorization: `Bearer ${activeConnection.token.access_token}`,
        'X-MCP-Provider': activeConnection.provider,
      },
    });

    return response.json();
  };

  return (
    <button onClick={makeAuthenticatedRequest} disabled={!activeConnection}>
      Make API Call
    </button>
  );
}
```

### Error Handling

```tsx
function MCPErrorHandler() {
  const { error, clearError } = useMCP();

  useEffect(() => {
    if (error) {
      // Show error notification
      console.error('MCP Error:', error);

      // Auto-clear after 5 seconds
      const timer = setTimeout(() => clearError(), 5000);
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
```

## Storage

The MCPContext stores connection metadata in localStorage:

- `mcp_connections`: Connection metadata (provider, mcpName, timestamps)
- `mcp_active_connection`: Currently active connection key

**Note:** Sensitive token data is not stored in localStorage. Tokens are managed securely through the OAuth hook.

## Auto-Refresh

When `autoRefresh` is enabled (default), the context will:

1. Check all connections every 5 minutes
2. Refresh tokens that will expire within 5 minutes
3. Handle refresh failures gracefully without disrupting the user experience

You can disable auto-refresh by setting `autoRefresh={false}` on the `MCPProvider`.

## Error Recovery

The context handles errors gracefully:

- Connection errors are stored per-connection
- Failed token refreshes don't throw errors (logged to console)
- Network failures retry up to 3 times with exponential backoff
- OAuth popup failures are caught and reported to the user

## Best Practices

1. **Wrap at the root level**: Place the `MCPProvider` at the top of your component tree
2. **Check connection status**: Always verify a connection is active before making API calls
3. **Handle errors**: Implement error handling UI to inform users of connection issues
4. **Use active connection**: Set an active connection for easier API integration
5. **Unique MCP names**: Use descriptive, unique names for different MCP integrations

## Advanced Features

### Optional MCP Provider Pattern

Use `useIsMCPAvailable` to check if the MCP context is available:

```tsx
import { useIsMCPAvailable } from '@/contexts/MCPContext';

function OptionalMCPFeature() {
  const isMCPAvailable = useIsMCPAvailable();

  if (!isMCPAvailable) {
    return <div>MCP features not available</div>;
  }

  return <MCPEnabledComponent />;
}
```

### Multiple Provider Connections

You can connect to multiple providers simultaneously:

```tsx
const { connect } = useMCP();

// Connect to multiple providers
await connect('github', 'github-integration');
await connect('google', 'google-integration');
await connect('azure', 'azure-integration');
```

## Troubleshooting

### Connections not restored on mount

- Ensure `accessToken` is passed to `MCPProvider`
- Check browser localStorage is enabled
- Verify tokens haven't expired

### Token refresh failing

- Check network connectivity
- Verify OAuth endpoints are accessible
- Ensure refresh tokens are valid

### OAuth popup blocked

- Instruct users to allow popups for your domain
- Check popup blocker settings

## Support

For issues or questions, please refer to the main atoms.tech documentation or contact the development team.
