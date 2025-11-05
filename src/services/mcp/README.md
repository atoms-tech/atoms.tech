# MCP Token Service

Production-ready OAuth token management service for atoms.tech MCP integrations.

## Features

- **Secure Token Storage**: Multiple storage strategies (memory, session, encrypted localStorage, cookies)
- **Auto-Refresh**: Automatic token refresh before expiry
- **Multi-Provider**: Support for Google, Microsoft, GitHub, and custom providers
- **Type-Safe**: Full TypeScript support with Zod validation
- **Encryption**: AES-GCM encryption for localStorage strategy
- **Security-First**: No token logging, CORS-safe, validation at every step

## Quick Start

```typescript
import { tokenService } from '@/services/mcp/token.service';

// Store a token
await tokenService.storeToken('google', {
  accessToken: 'ya29.a0AfH6SMBx...',
  refreshToken: '1//0gw...',
  expiresAt: Date.now() + 3600000, // 1 hour
  tokenType: 'Bearer',
  scope: 'openid profile email',
});

// Retrieve a token
const token = await tokenService.getToken('google');

// Auto-refresh if needed
const freshToken = await tokenService.refreshTokenIfNeeded('google');

// Clear tokens
await tokenService.clearToken('google');
await tokenService.clearAllTokens();
```

## Storage Strategies

### 1. Session Storage (Default - Recommended)
- **Security**: ✅ High - cleared on tab close
- **Persistence**: ❌ No - lost on page refresh
- **Use Case**: Maximum security for sensitive applications

```typescript
const service = new TokenService({
  storageStrategy: 'session',
});
```

### 2. Encrypted localStorage
- **Security**: ✅ Medium - encrypted with AES-GCM
- **Persistence**: ✅ Yes - survives page refresh
- **Use Case**: Desktop apps, trusted environments

```typescript
const service = new TokenService({
  storageStrategy: 'encrypted-local',
  encryptionKey: process.env.NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY,
});
```

### 3. Memory Storage
- **Security**: ✅✅ Highest - never written to disk
- **Persistence**: ❌ No - lost on page refresh
- **Use Case**: Testing, maximum security

```typescript
const service = new TokenService({
  storageStrategy: 'memory',
});
```

### 4. Cookie Storage
- **Security**: ⚠️ Use httpOnly cookies via API route
- **Persistence**: ✅ Yes (configurable)
- **Use Case**: Server-side rendering, production apps

```typescript
// Client-side (not recommended for production)
const service = new TokenService({
  storageStrategy: 'cookie',
});

// Production: Use httpOnly cookies via API route
// See: /api/mcp/oauth/set-cookie
```

## API Reference

### `storeToken(provider, token)`
Store a token for a specific OAuth provider.

```typescript
await tokenService.storeToken('google', {
  accessToken: 'access_token_here',
  refreshToken: 'refresh_token_here',
  expiresAt: Date.now() + 3600000,
  tokenType: 'Bearer',
  scope: 'openid profile email',
  idToken: 'id_token_here', // Optional, for OpenID Connect
});
```

### `getToken(provider)`
Retrieve and validate a token. Returns `null` if expired or not found.

```typescript
const token = await tokenService.getToken('google');
if (token) {
  // Use token
  console.log('Access token:', token.accessToken);
}
```

### `isTokenExpired(token, bufferMs?)`
Check if a token is expired or will expire within buffer time.

```typescript
const token = await tokenService.getToken('google');
if (token) {
  const isExpired = tokenService.isTokenExpired(token);
  const willExpireSoon = tokenService.isTokenExpired(token, 5 * 60 * 1000); // 5 min buffer
}
```

### `refreshTokenIfNeeded(provider)`
Automatically refresh token if it will expire within the configured buffer time.

```typescript
// Will only refresh if token expires within 5 minutes (default)
const freshToken = await tokenService.refreshTokenIfNeeded('google');
```

### `clearToken(provider)`
Clear token for a specific provider.

```typescript
await tokenService.clearToken('google');
```

### `clearAllTokens()`
Clear all stored tokens for all providers.

```typescript
await tokenService.clearAllTokens();
```

### `getValidProviders()`
Get list of providers with valid (non-expired) tokens.

```typescript
const providers = await tokenService.getValidProviders();
// ['google', 'microsoft']
```

## Auto-Refresh Behavior

The service automatically schedules token refresh when:

1. A token with `refreshToken` is stored
2. Token will expire within the buffer window (default: 5 minutes)
3. The refresh timer triggers before expiry

```typescript
// Configure refresh buffer
const service = new TokenService({
  refreshBufferMs: 10 * 60 * 1000, // Refresh 10 minutes before expiry
  refreshEndpoint: '/api/mcp/oauth/refresh', // Your refresh endpoint
});
```

## Refresh Endpoint

Create an API route to handle token refresh:

```typescript
// app/api/mcp/oauth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, refreshToken } = await request.json();

    // Call OAuth provider's refresh endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    return NextResponse.json({
      token: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
        tokenType: data.token_type,
        scope: data.scope,
        idToken: data.id_token,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
```

## Security Best Practices

### ✅ Do's

1. **Use session storage** for maximum security
2. **Enable encryption** when using localStorage
3. **Implement httpOnly cookies** for production
4. **Validate all tokens** before use
5. **Use HTTPS** in production
6. **Implement CSRF protection** in refresh endpoints
7. **Set appropriate CORS policies**
8. **Rotate encryption keys** periodically

### ❌ Don'ts

1. **Never log tokens** or include in error messages
2. **Don't use localStorage** without encryption
3. **Don't store tokens** in Redux/Zustand (memory leak risk)
4. **Don't share tokens** across domains
5. **Don't use client-side cookies** for sensitive tokens
6. **Don't commit encryption keys** to version control

## Configuration

```typescript
const service = new TokenService({
  // Storage strategy
  storageStrategy: 'session', // 'memory' | 'session' | 'encrypted-local' | 'cookie'

  // Encryption key for 'encrypted-local' strategy
  encryptionKey: process.env.NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY,

  // Refresh endpoint
  refreshEndpoint: '/api/mcp/oauth/refresh',

  // Time before expiry to trigger refresh (ms)
  refreshBufferMs: 5 * 60 * 1000, // 5 minutes

  // Enable debug logging
  debug: process.env.NODE_ENV === 'development',
});
```

## Error Handling

All methods handle errors gracefully and return `null` or throw exceptions:

```typescript
try {
  await tokenService.storeToken('google', token);
} catch (error) {
  // Handle validation errors
  console.error('Failed to store token:', error.message);
}

// getToken returns null on error
const token = await tokenService.getToken('google');
if (!token) {
  // Token not found, expired, or error occurred
  console.log('No valid token available');
}
```

## Testing

Run the test suite:

```bash
npm test token.service.test.ts
```

Mock the service in tests:

```typescript
import { TokenService } from '@/services/mcp/token.service';

jest.mock('@/services/mcp/token.service', () => ({
  tokenService: {
    storeToken: jest.fn(),
    getToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));
```

## Environment Variables

```env
# Required for encrypted-local storage
NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY=your-32-char-encryption-key

# Required for OAuth refresh
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```

## Migration Guide

### From localStorage to Session Storage

```typescript
// Before
localStorage.setItem('google_token', JSON.stringify(token));

// After
await tokenService.storeToken('google', token);
```

### From Custom Storage to Token Service

```typescript
// Before
class MyTokenManager {
  saveToken(token) { /* custom logic */ }
  getToken() { /* custom logic */ }
}

// After
import { tokenService } from '@/services/mcp/token.service';
await tokenService.storeToken('google', token);
```

## Troubleshooting

### Token not persisting across page refresh
- Use `encrypted-local` or `cookie` storage strategy
- Session storage is designed to clear on tab close

### Token refresh not working
- Ensure `refreshToken` is provided when storing
- Check refresh endpoint is correctly configured
- Verify OAuth provider credentials

### Encryption errors
- Ensure `encryptionKey` is set
- Key must be consistent across sessions
- Check browser supports Web Crypto API

## License

MIT

## Support

For issues or questions, contact the atoms.tech team or file an issue on GitHub.
