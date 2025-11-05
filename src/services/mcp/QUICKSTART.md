# MCP Token Service - Quick Start Guide

Get up and running with the MCP Token Service in 5 minutes.

## 🚀 Installation

The service is already installed as part of atoms.tech. No additional packages needed!

## 📋 Prerequisites

1. OAuth credentials from your provider(s)
2. Environment variables configured
3. Next.js 13+ with App Router

## ⚡ Quick Setup

### 1. Configure Environment Variables

```bash
# Copy the example file
cp src/services/mcp/.env.example .env.local

# Edit .env.local with your credentials
vim .env.local
```

Minimum required variables:

```env
# Google OAuth (example)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Token encryption (generate with: openssl rand -base64 32)
NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY=your-32-character-encryption-key
```

### 2. Basic Usage

```typescript
// Import the service
import { tokenService } from '@/services/mcp';

// Store a token (usually after OAuth callback)
await tokenService.storeToken('google', {
  accessToken: 'ya29.a0AfH6SMBx...',
  refreshToken: '1//0gw...',
  expiresAt: Date.now() + 3600000, // 1 hour
  tokenType: 'Bearer',
  scope: 'openid profile email',
});

// Get a token (auto-refreshes if needed)
const token = await tokenService.getToken('google');

if (token) {
  console.log('Token valid until:', new Date(token.expiresAt));
} else {
  console.log('No valid token - redirect to OAuth');
}
```

### 3. React Hook Integration

```typescript
// In your component
import { useOAuthToken } from '@/services/mcp/examples';

function MyComponent() {
  const { token, loading, error, refresh, clear } = useOAuthToken('google');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!token) return <a href="/api/auth/google">Connect Google</a>;

  return (
    <div>
      <p>Connected! Token expires in {Math.round((token.expiresAt - Date.now()) / 1000)}s</p>
      <button onClick={refresh}>Refresh Now</button>
      <button onClick={clear}>Disconnect</button>
    </div>
  );
}
```

### 4. Making API Requests

```typescript
import { tokenService } from '@/services/mcp';

async function fetchUserFiles() {
  // Get fresh token
  const token = await tokenService.refreshTokenIfNeeded('google');

  if (!token) {
    throw new Error('Please authenticate with Google');
  }

  // Make API request
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token invalid - clear and re-authenticate
    await tokenService.clearToken('google');
    throw new Error('Authentication expired');
  }

  return response.json();
}
```

## 🔧 Common Scenarios

### Scenario 1: OAuth Callback Handler

```typescript
// app/api/mcp/oauth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // Exchange code for token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  const token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type,
    scope: data.scope,
    idToken: data.id_token,
  };

  // Redirect to client with token (store client-side)
  return NextResponse.redirect(
    new URL(`/dashboard?token=${encodeURIComponent(JSON.stringify(token))}`, request.url)
  );
}
```

### Scenario 2: Middleware Authentication Check

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { tokenService } from '@/services/mcp';

export async function middleware(request: NextRequest) {
  // Check if user has valid Google token
  const token = await tokenService.getToken('google');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    // Redirect to login if no valid token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

### Scenario 3: Server Action

```typescript
'use server';

import { tokenService } from '@/services/mcp';

export async function getUserProfile() {
  const token = await tokenService.refreshTokenIfNeeded('google');

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  return response.json();
}
```

### Scenario 4: Multi-Provider Dashboard

```typescript
'use client';

import { useState, useEffect } from 'react';
import { tokenService } from '@/services/mcp';
import type { OAuthProvider } from '@/services/mcp';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    async function loadConnections() {
      const validProviders = await tokenService.getValidProviders();
      setConnections(validProviders);
    }
    loadConnections();
  }, []);

  const disconnect = async (provider: OAuthProvider) => {
    await tokenService.clearToken(provider);
    setConnections(connections.filter(p => p !== provider));
  };

  return (
    <div>
      <h1>Connected Accounts</h1>
      {connections.map(provider => (
        <div key={provider}>
          <span>{provider}</span>
          <button onClick={() => disconnect(provider)}>Disconnect</button>
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Set strong encryption key in `NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY`
- [ ] Use HTTPS in production
- [ ] Configure CORS policies
- [ ] Implement rate limiting
- [ ] Enable httpOnly cookies for sensitive tokens
- [ ] Set up monitoring and alerts
- [ ] Review and update OAuth scopes
- [ ] Test token refresh flow
- [ ] Verify error handling
- [ ] Enable debug mode only in development

## 🧪 Testing

```typescript
// Run tests
npm test token.service.test.ts

// Test in your app
import { tokenService } from '@/services/mcp';

// Store test token
await tokenService.storeToken('google', {
  accessToken: 'test_token',
  expiresAt: Date.now() + 3600000,
});

// Verify storage
const token = await tokenService.getToken('google');
console.log('Token stored:', !!token);

// Clean up
await tokenService.clearAllTokens();
```

## 📚 Next Steps

1. **Read the Full Documentation**
   - See [README.md](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/README.md) for complete API reference

2. **Explore Examples**
   - Check [examples.ts](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/examples.ts) for 12 real-world examples

3. **Review Types**
   - See [types.ts](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/types.ts) for all type definitions

4. **Customize Configuration**
   - Create custom TokenService instance with your settings

5. **Set Up Monitoring**
   - Add logging and metrics for production

## 🆘 Troubleshooting

### Issue: Token not persisting

**Solution**: Check storage strategy and browser settings

```typescript
// Use encrypted-local for persistence
const service = new TokenService({
  storageStrategy: 'encrypted-local',
  encryptionKey: process.env.NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY,
});
```

### Issue: Refresh failing

**Solution**: Verify credentials and endpoint

```typescript
// Check refresh endpoint is running
fetch('/api/mcp/oauth/refresh', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'google',
    refreshToken: 'test',
  }),
});
```

### Issue: CORS errors

**Solution**: Update API route headers

```typescript
// In refresh/route.ts
headers: {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Credentials': 'true',
}
```

## 💡 Pro Tips

1. **Use Session Storage by Default**
   - Most secure for web apps
   - Automatically cleared on tab close

2. **Always Check Token Before API Calls**
   - Use `refreshTokenIfNeeded()` for automatic refresh

3. **Handle Errors Gracefully**
   - Redirect to OAuth flow when token is null

4. **Monitor Token Usage**
   - Track refresh failures and expiry patterns

5. **Test with Different Providers**
   - Each provider has quirks - test thoroughly

## 📞 Support

- **Documentation**: [README.md](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/README.md)
- **Examples**: [examples.ts](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/examples.ts)
- **Types**: [types.ts](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/types.ts)
- **Tests**: [token.service.test.ts](/Users/kooshapari/temp-PRODVERCEL/485/clean/deploy/atoms.tech/src/services/mcp/token.service.test.ts)

---

**You're all set!** Start building secure OAuth integrations with the MCP Token Service. 🚀
