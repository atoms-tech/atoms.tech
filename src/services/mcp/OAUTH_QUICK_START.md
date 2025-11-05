# OAuth Service - Quick Start Guide

Get up and running with OAuth authentication in 5 minutes.

## Installation

The service is already installed. Just import and use:

```typescript
import { oauthService } from '@/services/mcp/oauth.service';
// or
import { oauthService } from '@/services/mcp';
```

## Basic Usage

### 1. Add a "Connect" Button

```typescript
// components/ConnectButton.tsx
'use client';

import { oauthService } from '@/services/mcp';

export function ConnectButton({ provider }: { provider: string }) {
  const handleConnect = async () => {
    try {
      const { authUrl } = await oauthService.initiateOAuth(provider);
      window.location.href = authUrl;
    } catch (error) {
      alert('Connection failed. Please try again.');
    }
  };

  return (
    <button onClick={handleConnect}>
      Connect {provider}
    </button>
  );
}
```

### 2. Create OAuth Callback Page

```typescript
// app/oauth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { oauthService } from '@/services/mcp';
import { useRouter } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) {
        setStatus('error');
        return;
      }

      const result = await oauthService.completeOAuth(code, state);

      if (result.success) {
        setStatus('success');
        router.push('/dashboard');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      {status === 'loading' && <p>Completing authentication...</p>}
      {status === 'success' && <p>Success! Redirecting...</p>}
      {status === 'error' && <p>Authentication failed.</p>}
    </div>
  );
}
```

### 3. Use Token in Your App

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { oauthService } from '@/services/mcp';

export default function Dashboard() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    const storedToken = await oauthService.getStoredToken('google');
    setToken(storedToken);
  }

  if (!token?.accessToken) {
    return <p>Please connect your account first.</p>;
  }

  return (
    <div>
      <p>Connected!</p>
      <p>Token expires: {new Date(token.expiresAt).toLocaleString()}</p>
    </div>
  );
}
```

## Using the React Hook

For easier integration, use the provided hook:

```typescript
// hooks/useOAuth.ts
import { useState, useEffect } from 'react';
import { oauthService } from '@/services/mcp';

export function useOAuth(provider: string) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, [provider]);

  async function loadToken() {
    setLoading(true);
    const storedToken = await oauthService.getStoredToken(provider);
    setToken(storedToken.accessToken ? storedToken : null);
    setLoading(false);
  }

  async function connect() {
    const { authUrl } = await oauthService.initiateOAuth(provider);
    window.location.href = authUrl;
  }

  async function disconnect() {
    await oauthService.revokeToken(provider);
    setToken(null);
  }

  return {
    token,
    loading,
    isConnected: !!token?.accessToken,
    connect,
    disconnect,
  };
}
```

Use it in your components:

```typescript
function MyComponent() {
  const { isConnected, loading, connect, disconnect } = useOAuth('google');

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {isConnected ? (
        <button onClick={disconnect}>Disconnect</button>
      ) : (
        <button onClick={connect}>Connect</button>
      )}
    </div>
  );
}
```

## Making Authenticated Requests

```typescript
async function fetchUserData() {
  // Get token
  const token = await oauthService.getStoredToken('google');

  if (!token.accessToken) {
    throw new Error('Please authenticate first');
  }

  // Make request
  const response = await fetch('https://api.example.com/user', {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
    },
  });

  // Handle expired token
  if (response.status === 401) {
    await oauthService.refreshToken('google');
    // Retry request...
  }

  return response.json();
}
```

## Handling Token Refresh

The service automatically handles token refresh, but you can also do it manually:

```typescript
// Check if token needs refresh
const token = await oauthService.getStoredToken('google');
const expiresIn = token.expiresAt - Date.now();

if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
  await oauthService.refreshToken('google');
}
```

## Error Handling

```typescript
import {
  OAuthNetworkError,
  OAuthProviderError,
  OAuthValidationError,
} from '@/services/mcp';

try {
  await oauthService.initiateOAuth('google');
} catch (error) {
  if (error instanceof OAuthNetworkError) {
    console.log('Network issue - please try again');
  } else if (error instanceof OAuthProviderError) {
    console.log('Provider unavailable');
  } else if (error instanceof OAuthValidationError) {
    console.log('Invalid configuration');
  }
}
```

## Required API Endpoints

You need to implement these API endpoints:

### 1. POST /api/mcp/oauth/init

```typescript
// app/api/mcp/oauth/init/route.ts
export async function POST(request: Request) {
  const { provider } = await request.json();

  // Generate OAuth URL
  const authUrl = generateAuthUrl(provider);
  const state = generateRandomState();

  return Response.json({
    authUrl,
    state,
  });
}
```

### 2. POST /api/mcp/oauth/callback

```typescript
// app/api/mcp/oauth/callback/route.ts
export async function POST(request: Request) {
  const { code, state } = await request.json();

  // Validate state
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  return Response.json({
    success: true,
    provider: 'google',
    token: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    },
  });
}
```

### 3. POST /api/mcp/oauth/refresh

```typescript
// app/api/mcp/oauth/refresh/route.ts
export async function POST(request: Request) {
  const { provider, refreshToken } = await request.json();

  // Refresh token with provider
  const newTokens = await refreshWithProvider(provider, refreshToken);

  return Response.json({
    success: true,
    token: {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresAt: Date.now() + newTokens.expires_in * 1000,
    },
  });
}
```

### 4. POST /api/mcp/oauth/revoke

```typescript
// app/api/mcp/oauth/revoke/route.ts
export async function POST(request: Request) {
  const { provider, token } = await request.json();

  // Revoke token with provider
  await revokeWithProvider(provider, token);

  return Response.json({
    success: true,
  });
}
```

## Configuration

Configure the service for your needs:

```typescript
import { OAuthService } from '@/services/mcp';

const customOAuthService = new OAuthService({
  apiBaseUrl: '/api/custom/oauth',
  maxRetries: 5,
  retryDelay: 2000,
  requestTimeout: 60000,
  debug: true, // Enable debug logging
});
```

## Testing

Run the tests:

```bash
npm test oauth.service.test.ts
```

## Common Issues

### "Invalid state parameter"
- State expired (>10 minutes)
- State doesn't match stored value
- Solution: Restart OAuth flow

### "No refresh token available"
- Token doesn't have refresh capability
- Solution: Include `offline_access` scope

### "Network request failed"
- Network connectivity issues
- API endpoint unavailable
- Solution: Check network, verify API is running

## Next Steps

1. Check out the examples: `oauth.service.example.ts`
2. Read the full documentation: `OAUTH_SERVICE_README.md`
3. Review the tests: `oauth.service.test.ts`
4. Explore type definitions: `oauth.types.ts`

## Support

For issues:
1. Enable debug mode: `new OAuthService({ debug: true })`
2. Check browser console for errors
3. Verify API endpoints are working
4. Review the comprehensive documentation

## Example Apps

See `oauth.service.example.ts` for:
- React components
- Custom hooks
- Zustand store integration
- Multi-provider management
- Error handling patterns
- Token monitoring
- Batch operations

## API Reference Summary

| Method | Purpose | Returns |
|--------|---------|---------|
| `initiateOAuth(provider)` | Start OAuth flow | `{ authUrl, state }` |
| `completeOAuth(code, state)` | Complete OAuth | `{ success, provider }` |
| `refreshToken(provider)` | Refresh access token | `{ success }` |
| `revokeToken(provider)` | Revoke token | `{ success }` |
| `getStoredToken(provider)` | Get stored token | `{ accessToken, expiresAt }` |

That's it! You're ready to implement OAuth in your app.
