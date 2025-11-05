# MCPContext Quick Reference

## Setup (1 minute)

```tsx
// In your root layout/providers
import { MCPProvider } from '@/contexts/MCPContext';
import { useAuth } from '@/hooks/useAuth';

export function Providers({ children }) {
  const { accessToken } = useAuth();
  return (
    <MCPProvider accessToken={accessToken}>
      {children}
    </MCPProvider>
  );
}
```

## Basic Usage

### Import
```tsx
import { useMCP } from '@/contexts/MCPContext';
```

### Connect
```tsx
const { connect } = useMCP();
await connect('github', 'my-integration');
```

### Disconnect
```tsx
const { disconnect } = useMCP();
await disconnect('github', 'my-integration');
```

### Check Status
```tsx
const { isConnectionActive } = useMCP();
const isActive = isConnectionActive('github', 'my-integration');
```

### List Connections
```tsx
const { listConnections } = useMCP();
const connections = listConnections();
```

### Get Active Connection
```tsx
const { activeConnection } = useMCP();
if (activeConnection?.token) {
  // Use token for API calls
}
```

### Refresh Token
```tsx
const { refreshConnection } = useMCP();
await refreshConnection('github', 'my-integration');
```

### Handle Errors
```tsx
const { error, clearError } = useMCP();
if (error) {
  console.error(error);
  clearError();
}
```

## Common Patterns

### Connection Button
```tsx
function ConnectButton() {
  const { connect, disconnect, isConnectionActive, isLoading } = useMCP();
  const isConnected = isConnectionActive('github', 'my-app');

  return (
    <button
      onClick={() => isConnected
        ? disconnect('github', 'my-app')
        : connect('github', 'my-app')
      }
      disabled={isLoading}
    >
      {isConnected ? 'Disconnect' : 'Connect'}
    </button>
  );
}
```

### Status Indicator
```tsx
function StatusIndicator() {
  const { hasAnyConnection, isInitialized } = useMCP();

  if (!isInitialized) return <span>Loading...</span>;
  return <span>{hasAnyConnection() ? '🟢 Connected' : '🔴 Disconnected'}</span>;
}
```

### API Call with Token
```tsx
function APICall() {
  const { activeConnection } = useMCP();

  const callAPI = async () => {
    if (!activeConnection?.token) {
      throw new Error('Not connected');
    }

    const response = await fetch('/api/endpoint', {
      headers: {
        Authorization: `Bearer ${activeConnection.token.access_token}`,
      },
    });

    return response.json();
  };

  return <button onClick={callAPI}>Call API</button>;
}
```

## Providers

- `github` - GitHub integration
- `google` - Google OAuth
- `azure` - Microsoft Azure
- `auth0` - Auth0

## State Properties

| Property | Type | Description |
|----------|------|-------------|
| `connections` | `MCPConnectionState` | All connections |
| `activeConnection` | `MCPConnection \| null` | Active connection |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `isInitialized` | `boolean` | Init status |

## Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `connect` | `provider, mcpName` | `Promise<void>` | Connect to provider |
| `disconnect` | `provider, mcpName` | `Promise<void>` | Disconnect |
| `refreshConnection` | `provider, mcpName` | `Promise<void>` | Refresh token |
| `refreshAllConnections` | - | `Promise<void>` | Refresh all |
| `setActiveConnection` | `provider, mcpName` | `void` | Set active |
| `getConnection` | `provider, mcpName` | `MCPConnection \| null` | Get connection |
| `listConnections` | - | `MCPConnection[]` | List all |
| `isConnectionActive` | `provider, mcpName` | `boolean` | Check if active |
| `hasAnyConnection` | - | `boolean` | Check if any |
| `clearError` | - | `void` | Clear error |

## Auto-Refresh

Enabled by default. Tokens are refreshed 5 minutes before expiry.

To disable:
```tsx
<MCPProvider accessToken={token} autoRefresh={false}>
```

## Storage

Connections saved to `localStorage`:
- `mcp_connections` - Connection metadata
- `mcp_active_connection` - Active connection key

## Error Handling

```tsx
try {
  await connect('github', 'my-app');
} catch (err) {
  // Handle error
}
```

Or use error state:
```tsx
const { error, clearError } = useMCP();

useEffect(() => {
  if (error) {
    console.error(error);
    setTimeout(clearError, 5000);
  }
}, [error]);
```

## Files Reference

- **MCPContext.tsx** - Main context implementation (615 lines)
- **index.ts** - Export file for easy imports
- **README.md** - Full documentation
- **INTEGRATION_GUIDE.md** - Step-by-step integration
- **MCPContext.example.tsx** - 9 usage examples
- **MCPContext.test.tsx** - Test suite
- **QUICK_REFERENCE.md** - This file

## Need More Help?

1. Check **README.md** for full documentation
2. See **MCPContext.example.tsx** for 9 detailed examples
3. Follow **INTEGRATION_GUIDE.md** for step-by-step setup
4. Review **MCPContext.test.tsx** for testing patterns

## TypeScript

Fully typed! Import types:
```tsx
import type {
  MCPContextType,
  MCPConnection,
  MCPConnectionState,
  OAuthProvider,
  OAuthToken,
} from '@/contexts/MCPContext';
```
