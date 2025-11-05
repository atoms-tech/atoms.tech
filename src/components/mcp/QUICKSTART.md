# MCPOAuthConnect - Quick Start Guide

## Installation

The component is already installed at:
```
/src/components/mcp/MCPOAuthConnect.tsx
```

## Basic Usage (30 seconds)

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MCPOAuthConnect } from '@/components/mcp';

export function MyPage() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <Button onClick={() => setIsOpen(true)}>
                Connect OAuth Provider
            </Button>

            <MCPOAuthConnect
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSuccess={() => {
                    console.log('OAuth flow started!');
                    setIsOpen(false);
                }}
            />
        </div>
    );
}
```

## What You Need

### 1. Backend API Endpoint
Create this endpoint in your Next.js app:

```typescript
// app/api/mcp/oauth/init/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { provider } = await request.json();

    // Your OAuth logic here
    const authUrl = generateOAuthUrl(provider);

    return NextResponse.json({
        authUrl,
        state: 'random-state-token',
        provider,
    });
}
```

### 2. OAuth Provider Configuration
Configure your OAuth apps:
- GitHub: https://github.com/settings/developers
- Google: https://console.cloud.google.com
- Azure: https://portal.azure.com
- Auth0: https://manage.auth0.com

## Props Reference

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called when modal closes |
| `onSuccess` | `() => void` | Called when OAuth starts |

## Supported Providers

- GitHub
- Google
- Azure AD
- Auth0

## Features Out of the Box

- Loading states
- Error handling
- Toast notifications
- Dark mode support
- Responsive design
- TypeScript types
- Accessibility

## Common Patterns

### With State Management
```tsx
function Settings() {
    const [showOAuth, setShowOAuth] = useState(false);
    const { updateConnections } = useMyStore();

    return (
        <MCPOAuthConnect
            isOpen={showOAuth}
            onClose={() => setShowOAuth(false)}
            onSuccess={() => {
                updateConnections();
                setShowOAuth(false);
            }}
        />
    );
}
```

### With Toast Feedback
```tsx
import { useToast } from '@/components/ui/use-toast';

function MyComponent() {
    const { toast } = useToast();

    return (
        <MCPOAuthConnect
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onSuccess={() => {
                toast({
                    title: 'Success',
                    description: 'Connecting to OAuth provider...',
                });
            }}
        />
    );
}
```

## API Response Format

Your backend should return:

```json
{
    "authUrl": "https://provider.com/oauth/authorize?...",
    "state": "security-token",
    "provider": "github"
}
```

## Error Handling

Errors are handled automatically:
- Shows error alerts in modal
- Displays toast notifications
- Logs to console for debugging

## Testing

```bash
npm test MCPOAuthConnect.test.tsx
```

## Need Help?

1. Check [README.md](./README.md) for detailed docs
2. See [MCPOAuthConnect.example.tsx](./MCPOAuthConnect.example.tsx) for examples
3. Review [types.ts](./types.ts) for TypeScript definitions

## File Locations

```
src/components/mcp/
├── MCPOAuthConnect.tsx      ← Main component
├── types.ts                 ← TypeScript types
├── index.ts                 ← Exports
├── README.md                ← Full documentation
├── QUICKSTART.md            ← This file
└── MCPOAuthConnect.example.tsx ← Examples
```

## Next Steps

1. Implement backend API endpoint
2. Configure OAuth providers
3. Add component to your page
4. Test OAuth flow
5. Customize styling if needed

That's it! You're ready to use MCPOAuthConnect.
