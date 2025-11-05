# OAuth Service Documentation

Complete OAuth 2.0 flow management service for MCP (Model Context Protocol) integration with third-party providers.

## Overview

The OAuth Service provides a comprehensive, production-ready solution for managing OAuth 2.0 authentication flows with external providers. It includes:

- **Complete OAuth Flow**: Initialization, callback handling, token exchange
- **Automatic Token Management**: Refresh, expiration tracking, secure storage
- **Retry Logic**: Exponential backoff with configurable retry attempts
- **Type Safety**: Full TypeScript support with Zod validation
- **Error Handling**: Comprehensive error types and graceful degradation
- **Security**: PKCE support, state validation, CSRF protection

## Features

### 1. OAuth Flow Management
- Initialize OAuth flow with provider-specific configuration
- Handle OAuth callbacks and token exchange
- Support for PKCE (Proof Key for Code Exchange)
- State parameter validation for CSRF protection

### 2. Token Lifecycle
- Automatic token refresh before expiration
- Token expiration monitoring
- Secure token storage via TokenService integration
- Token revocation support

### 3. Reliability
- Automatic retry with exponential backoff
- Configurable retry attempts and delays
- Request timeout handling
- Network error recovery

### 4. Developer Experience
- TypeScript type safety
- Comprehensive error types
- Debug logging support
- Extensive examples and tests

## Installation

The service is already installed in your project. Simply import and use:

```typescript
import { oauthService } from '@/services/mcp/oauth.service';
```

## Quick Start

### Basic OAuth Flow

```typescript
// 1. Initiate OAuth
const { authUrl } = await oauthService.initiateOAuth('google');
window.location.href = authUrl;

// 2. Handle callback (on redirect page)
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');

const { success } = await oauthService.completeOAuth(code!, state!);

// 3. Use stored token
const token = await oauthService.getStoredToken('google');
if (token.accessToken) {
  // Make authenticated requests
}
```

## API Reference

### `initiateOAuth(provider: string): Promise<OAuthInitResponse>`

Starts the OAuth flow and returns the authorization URL.

**Parameters:**
- `provider` - OAuth provider name (e.g., 'google', 'microsoft', 'github')

**Returns:**
```typescript
{
  authUrl: string;      // URL to redirect user for authorization
  state: string;        // State parameter for CSRF protection
  codeVerifier?: string; // PKCE code verifier (stored internally)
}
```

**Example:**
```typescript
try {
  const { authUrl } = await oauthService.initiateOAuth('google');
  window.location.href = authUrl;
} catch (error) {
  console.error('Failed to start OAuth:', error);
}
```

**Error Types:**
- `OAuthNetworkError` - Network connectivity issues
- `OAuthProviderError` - Provider configuration or availability issues
- `OAuthValidationError` - Invalid response from API

---

### `completeOAuth(code: string, state: string): Promise<OAuthCallbackResponse>`

Completes the OAuth flow by exchanging the authorization code for tokens.

**Parameters:**
- `code` - Authorization code from OAuth callback
- `state` - State parameter for validation

**Returns:**
```typescript
{
  success: boolean;
  provider?: string;
  error?: string;
}
```

**Example:**
```typescript
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');

try {
  const result = await oauthService.completeOAuth(code!, state!);
  if (result.success) {
    console.log('Authentication successful!');
    // Redirect to dashboard
  }
} catch (error) {
  console.error('OAuth callback failed:', error);
}
```

**Error Types:**
- `OAuthValidationError` - Invalid or expired state
- `OAuthProviderError` - Token exchange failed
- `OAuthNetworkError` - Network issues during token exchange

**Security Notes:**
- State parameter is validated against stored value
- State expires after 10 minutes
- Code verifier is automatically included for PKCE flows

---

### `refreshToken(provider: string): Promise<OAuthRefreshResponse>`

Refreshes the access token using the stored refresh token.

**Parameters:**
- `provider` - OAuth provider name

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
try {
  const result = await oauthService.refreshToken('google');
  if (result.success) {
    console.log('Token refreshed successfully');
  }
} catch (error) {
  console.error('Token refresh failed:', error);
  // Re-authenticate user
}
```

**Automatic Behavior:**
- Updates stored tokens automatically on success
- Retries on network errors (up to 3 times by default)
- Throws error if no refresh token available

**Error Types:**
- `OAuthValidationError` - No refresh token available
- `OAuthProviderError` - Refresh token invalid or expired
- `OAuthNetworkError` - Network issues during refresh

---

### `revokeToken(provider: string): Promise<OAuthRevokeResponse>`

Revokes the OAuth token with the provider and clears local storage.

**Parameters:**
- `provider` - OAuth provider name

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
try {
  await oauthService.revokeToken('google');
  console.log('Token revoked successfully');
} catch (error) {
  console.error('Token revocation failed:', error);
}
```

**Behavior:**
- Clears local token storage even if revocation fails
- Returns success if no token exists
- Attempts to revoke with provider if token exists

---

### `getStoredToken(provider: string): Promise<StoredTokenResponse>`

Retrieves stored token information (excluding refresh token for security).

**Parameters:**
- `provider` - OAuth provider name

**Returns:**
```typescript
{
  accessToken?: string;
  expiresAt?: number;   // Unix timestamp in milliseconds
  tokenType?: string;   // Usually 'Bearer'
  scope?: string;       // Granted scopes
}
```

**Example:**
```typescript
const token = await oauthService.getStoredToken('google');

if (token.accessToken) {
  console.log('Token expires at:', new Date(token.expiresAt!));

  // Check if expiring soon
  const expiresIn = token.expiresAt! - Date.now();
  if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
    await oauthService.refreshToken('google');
  }
}
```

**Security Notes:**
- Refresh token is never exposed through this method
- Returns empty object if no token exists
- Gracefully handles errors

## Configuration

### Service Configuration

Create a custom instance with specific configuration:

```typescript
import { OAuthService } from '@/services/mcp/oauth.service';

const customOAuthService = new OAuthService({
  apiBaseUrl: '/api/custom/oauth',  // Custom API endpoint
  maxRetries: 5,                     // Number of retry attempts
  retryDelay: 2000,                  // Initial retry delay (ms)
  retryBackoffMultiplier: 3,         // Backoff multiplier
  requestTimeout: 60000,             // Request timeout (ms)
  debug: true,                       // Enable debug logging
});
```

### Default Configuration

```typescript
{
  apiBaseUrl: '/api/mcp/oauth',
  maxRetries: 3,
  retryDelay: 1000,              // 1 second
  retryBackoffMultiplier: 2,
  requestTimeout: 30000,         // 30 seconds
  debug: process.env.NODE_ENV === 'development'
}
```

## Error Handling

### Error Types

#### `OAuthError`
Base error class for all OAuth errors.

```typescript
{
  message: string;
  code: string;
  statusCode?: number;
  details?: unknown;
}
```

#### `OAuthNetworkError`
Network-related errors (timeouts, connectivity issues).

```typescript
try {
  await oauthService.initiateOAuth('google');
} catch (error) {
  if (error instanceof OAuthNetworkError) {
    console.log('Network issue - retrying...');
  }
}
```

#### `OAuthValidationError`
Invalid request or response data.

```typescript
catch (error) {
  if (error instanceof OAuthValidationError) {
    console.log('Invalid data:', error.details);
  }
}
```

#### `OAuthProviderError`
Provider-specific errors (invalid credentials, provider unavailable).

```typescript
catch (error) {
  if (error instanceof OAuthProviderError) {
    console.log('Provider error:', error.statusCode);
  }
}
```

### Error Handling Best Practices

```typescript
async function robustOAuthHandling(provider: string) {
  try {
    const { authUrl } = await oauthService.initiateOAuth(provider);
    window.location.href = authUrl;
  } catch (error) {
    if (error instanceof OAuthNetworkError) {
      // Show retry option
      return { retryable: true, message: 'Network error. Please try again.' };
    }

    if (error instanceof OAuthProviderError) {
      if (error.statusCode === 429) {
        // Rate limited
        return { retryable: true, message: 'Too many requests. Please wait.' };
      }
      // Provider issue
      return { retryable: false, message: 'Provider unavailable.' };
    }

    if (error instanceof OAuthValidationError) {
      // Configuration issue
      return { retryable: false, message: 'Configuration error.' };
    }

    // Unknown error
    return { retryable: false, message: 'An unexpected error occurred.' };
  }
}
```

## React Integration

### Custom Hook

```typescript
import { useOAuth } from '@/services/mcp/oauth.service.example';

function MyComponent() {
  const { token, loading, error, isConnected, connect, disconnect } =
    useOAuth('google');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected! Token expires: {new Date(token.expiresAt).toLocaleString()}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Google</button>
      )}
    </div>
  );
}
```

### Zustand Store

```typescript
import { useOAuthStore } from '@/services/mcp/oauth.service.example';

function OAuthManager() {
  const { tokens, loading, connect, disconnect } = useOAuthStore();

  return (
    <div>
      {Object.entries(tokens).map(([provider, token]) => (
        <div key={provider}>
          <span>{provider}: {token?.accessToken ? '✓ Connected' : '✗ Disconnected'}</span>
          {token?.accessToken ? (
            <button onClick={() => disconnect(provider)}>Disconnect</button>
          ) : (
            <button onClick={() => connect(provider)}>Connect</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Next.js Integration

### OAuth Callback Page

```typescript
// app/oauth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { oauthService } from '@/services/mcp/oauth.service';
import { useRouter } from 'next/navigation';

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      setStatus('error');
      return;
    }

    try {
      const result = await oauthService.completeOAuth(code, state);
      if (result.success) {
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
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

## Retry Logic

The service implements automatic retry with exponential backoff for transient failures.

### Retryable Conditions

- Network errors (timeouts, connectivity issues)
- 5xx server errors
- 408 Request Timeout
- 429 Too Many Requests

### Non-Retryable Conditions

- 4xx client errors (except 408, 429)
- Validation errors
- Invalid state errors

### Retry Configuration

```typescript
const service = new OAuthService({
  maxRetries: 5,              // Attempt up to 5 times
  retryDelay: 1000,           // Start with 1 second delay
  retryBackoffMultiplier: 2,  // Double delay each retry
});

// Retry delays: 1s, 2s, 4s, 8s, 16s
```

### Monitoring Retries

Enable debug mode to see retry attempts:

```typescript
const service = new OAuthService({ debug: true });

// Console output:
// [OAuthService] Retrying request (attempt 2/3) after 2000ms
// [OAuthService] Retrying request (attempt 3/3) after 4000ms
```

## Security Considerations

### PKCE Support

The service automatically handles PKCE (Proof Key for Code Exchange) when the API supports it:

```typescript
// 1. Service generates and stores code_verifier
const { authUrl, codeVerifier } = await oauthService.initiateOAuth('google');

// 2. code_verifier is automatically included in callback
await oauthService.completeOAuth(code, state);
```

### State Validation

State parameters are validated to prevent CSRF attacks:

```typescript
// State is generated and stored during initiation
const { state } = await oauthService.initiateOAuth('google');

// State is validated during callback
// Throws OAuthValidationError if state is invalid or expired
await oauthService.completeOAuth(code, state);
```

### Token Storage

Tokens are securely stored via the TokenService:

- Session storage by default (cleared on tab close)
- Optional encrypted localStorage
- Refresh tokens never exposed through getStoredToken()

### Best Practices

1. **Always use HTTPS** in production
2. **Implement CORS** properly on API endpoints
3. **Validate redirect URIs** on the server
4. **Use httpOnly cookies** for sensitive tokens when possible
5. **Monitor token expiration** and refresh proactively
6. **Handle revocation** on user logout

## Testing

### Running Tests

```bash
npm test oauth.service.test.ts
```

### Test Coverage

The test suite covers:
- ✓ OAuth initialization
- ✓ OAuth callback handling
- ✓ Token refresh with retry logic
- ✓ Token revocation
- ✓ Error handling (network, validation, provider)
- ✓ Retry mechanisms with exponential backoff
- ✓ State management and validation
- ✓ Request timeout handling

### Example Test

```typescript
it('should retry on network errors', async () => {
  const service = new OAuthService({ maxRetries: 3 });

  fetch
    .mockRejectedValueOnce(new TypeError('Network error'))
    .mockRejectedValueOnce(new TypeError('Network error'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authUrl: 'https://...' }),
    });

  const result = await service.initiateOAuth('google');

  expect(fetch).toHaveBeenCalledTimes(3);
  expect(result.authUrl).toBeTruthy();
});
```

## Troubleshooting

### Common Issues

#### "Invalid or expired state parameter"

**Cause:** State parameter doesn't match stored value or has expired (>10 minutes).

**Solution:**
- Ensure OAuth flow completes within 10 minutes
- Check for browser session storage issues
- Verify state parameter is passed correctly

#### "No refresh token available"

**Cause:** Token doesn't have a refresh token or token storage failed.

**Solution:**
- Verify OAuth scope includes `offline_access` or equivalent
- Check provider configuration for refresh token support
- Re-authenticate to obtain new tokens

#### "Network request failed"

**Cause:** Network connectivity issues or API unavailable.

**Solution:**
- Check network connection
- Verify API endpoint is accessible
- Check CORS configuration
- Enable debug mode to see detailed errors

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const service = new OAuthService({ debug: true });

// Console output example:
// [OAuthService] Initiating OAuth for provider: google
// [OAuthService] OAuth initiated successfully for provider: google
// [OAuthService] Completing OAuth flow
// [OAuthService] OAuth completed and tokens stored for provider: google
```

## Examples

See `oauth.service.example.ts` for comprehensive examples including:

- React components
- Custom hooks
- Zustand store integration
- Multi-provider management
- Error handling patterns
- Token monitoring
- Batch operations

## API Endpoints

The service expects the following API endpoints:

### POST /api/mcp/oauth/init
Initiate OAuth flow.

**Request:**
```json
{
  "provider": "google"
}
```

**Response:**
```json
{
  "authUrl": "https://...",
  "state": "random-state",
  "codeVerifier": "code-verifier" // Optional, for PKCE
}
```

### POST /api/mcp/oauth/callback
Complete OAuth flow.

**Request:**
```json
{
  "code": "auth-code",
  "state": "state-value",
  "codeVerifier": "code-verifier" // Optional, for PKCE
}
```

**Response:**
```json
{
  "success": true,
  "provider": "google",
  "token": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": 1234567890,
    "tokenType": "Bearer",
    "scope": "read write"
  }
}
```

### POST /api/mcp/oauth/refresh
Refresh access token.

**Request:**
```json
{
  "provider": "google",
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresAt": 1234567890
  }
}
```

### POST /api/mcp/oauth/revoke
Revoke token.

**Request:**
```json
{
  "provider": "google",
  "token": "access-token"
}
```

**Response:**
```json
{
  "success": true
}
```

## License

Part of the atoms.tech MCP integration suite.

## Support

For issues or questions:
1. Check the examples in `oauth.service.example.ts`
2. Review test cases in `oauth.service.test.ts`
3. Enable debug mode for detailed logging
4. Check API endpoint configuration

## Changelog

### v1.0.0 (2025-10-23)
- Initial release
- Complete OAuth 2.0 flow support
- Automatic retry with exponential backoff
- PKCE support
- Comprehensive error handling
- TypeScript type safety
- Integration with TokenService
