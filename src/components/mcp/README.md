# MCP OAuth Connect Component

A production-ready OAuth connection modal component for atoms.tech that enables users to connect OAuth providers for MCP (Model Context Protocol) server integration.

## Features

- **Multiple OAuth Providers**: Supports GitHub, Google, Azure AD, and Auth0
- **Loading States**: Visual feedback during OAuth initialization
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Toast Notifications**: Success and error notifications using atoms.tech toast system
- **Responsive Design**: Tailwind CSS styling that matches atoms.tech design system
- **TypeScript**: Fully typed with comprehensive interfaces
- **Accessibility**: Follows atoms.tech accessibility patterns

## Installation

The component is located at:
```
/src/components/mcp/MCPOAuthConnect.tsx
```

## Usage

### Basic Usage

```tsx
import { useState } from 'react';
import { MCPOAuthConnect } from '@/components/mcp/MCPOAuthConnect';
import { Button } from '@/components/ui/button';

export function MyComponent() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSuccess = () => {
        console.log('OAuth flow initiated');
        setIsModalOpen(false);
    };

    return (
        <>
            <Button onClick={() => setIsModalOpen(true)}>
                Connect OAuth Provider
            </Button>

            <MCPOAuthConnect
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
}
```

### Advanced Usage with State Management

```tsx
import { useState } from 'react';
import { MCPOAuthConnect } from '@/components/mcp/MCPOAuthConnect';
import { useToast } from '@/components/ui/use-toast';

export function OAuthSettings() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const handleSuccess = () => {
        toast({
            variant: 'default',
            title: 'OAuth Provider Connected',
            description: 'You will be redirected to complete authorization',
        });

        // Additional logic:
        // - Refresh provider list
        // - Update global state
        // - Track analytics

        setIsModalOpen(false);
    };

    const handleClose = () => {
        console.log('User cancelled OAuth connection');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">OAuth Providers</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your OAuth provider connections
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    Add Provider
                </Button>
            </div>

            <MCPOAuthConnect
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
```

## Props

### MCPOAuthConnectProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls whether the modal is visible |
| `onClose` | `() => void` | Yes | Callback fired when the modal is closed |
| `onSuccess` | `() => void` | Yes | Callback fired when OAuth flow is successfully initiated |

## API Integration

The component expects a POST endpoint at `/api/mcp/oauth/init` that:

### Request

```typescript
POST /api/mcp/oauth/init

{
    "provider": "github" | "google" | "azure" | "auth0"
}
```

### Success Response

```typescript
{
    "authUrl": "https://provider.com/oauth/authorize?...",
    "state": "random-state-token",
    "provider": "github"
}
```

### Error Response

```typescript
{
    "error": "Error message",
    "code": "OPTIONAL_ERROR_CODE",
    "details": { /* optional */ }
}
```

## Supported OAuth Providers

### GitHub
- **Icon**: Github (lucide-react)
- **Description**: Connect with GitHub OAuth
- **Color**: Gray/Dark theme

### Google
- **Icon**: Chrome (lucide-react)
- **Description**: Connect with Google OAuth
- **Color**: Blue theme

### Azure AD
- **Icon**: Shield (lucide-react)
- **Description**: Connect with Microsoft Azure
- **Color**: Blue theme

### Auth0
- **Icon**: Key (lucide-react)
- **Description**: Connect with Auth0
- **Color**: Orange theme

## Component Architecture

### State Management
- `isLoading`: Tracks OAuth initialization status
- `selectedProvider`: Currently selected provider during loading
- `error`: Stores error messages for display

### Flow
1. User clicks on a provider button
2. Component sets loading state and makes POST request to `/api/mcp/oauth/init`
3. Backend returns authorization URL
4. Component shows success toast and redirects to auth URL using Next.js router
5. After redirect, `onSuccess` callback is triggered
6. Modal closes automatically

### Error Handling
- Network errors
- API errors (non-200 status codes)
- Missing authorization URL
- JSON parsing errors

All errors are:
- Logged to console for debugging
- Displayed in an Alert component
- Shown via toast notifications

## Styling

The component uses atoms.tech's design system:
- **Dialog**: Uses `@/components/ui/dialog` (Radix UI based)
- **Buttons**: Uses `@/components/ui/button` with variant system
- **Colors**: Tailwind CSS with dark mode support
- **Icons**: lucide-react icons
- **Toast**: Uses `@/components/ui/use-toast`

### Customization

Provider colors can be customized in the `OAUTH_PROVIDERS` array:

```tsx
{
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Connect with GitHub OAuth',
    color: 'hover:bg-gray-800/10 dark:hover:bg-gray-800/20', // Customize here
}
```

## Dependencies

- `react`: State management and hooks
- `next/navigation`: Router for OAuth redirects
- `lucide-react`: Icons for providers
- `@/components/ui/*`: atoms.tech UI components
- `@/lib/utils`: Utility functions (cn)

## TypeScript Types

See `/src/components/mcp/types.ts` for comprehensive type definitions including:
- `OAuthProvider`
- `OAuthInitRequest`
- `OAuthInitResponse`
- `OAuthErrorResponse`
- `ProviderConfig`
- `MCPOAuthConnectProps`
- `OAuthConnectionStatus`

## Testing

### Manual Testing Checklist

- [ ] Modal opens and closes correctly
- [ ] All provider buttons are clickable
- [ ] Loading states display correctly
- [ ] Error messages display when API fails
- [ ] Success toast appears before redirect
- [ ] Cancel button works during loading
- [ ] Modal prevents closing during OAuth flow
- [ ] Dark mode styling works correctly
- [ ] Mobile responsive layout

### Integration Testing

```typescript
// Example test setup
describe('MCPOAuthConnect', () => {
    it('should initiate OAuth flow when provider is selected', async () => {
        // Test implementation
    });

    it('should display error when API fails', async () => {
        // Test implementation
    });

    it('should disable UI during loading', async () => {
        // Test implementation
    });
});
```

## Accessibility

- Dialog uses proper ARIA attributes via Radix UI
- Keyboard navigation supported
- Screen reader friendly
- Focus management handled by Dialog component
- Loading states announced via toast notifications

## Browser Support

Follows atoms.tech browser support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Examples

See `/src/components/mcp/MCPOAuthConnect.example.tsx` for complete working examples.

## Troubleshooting

### "Failed to initialize OAuth flow"
- Check that `/api/mcp/oauth/init` endpoint exists
- Verify request payload format
- Check backend logs for errors

### "No authorization URL received from server"
- Verify backend returns `authUrl` in response
- Check response JSON structure

### Modal doesn't close after OAuth
- Ensure `onSuccess` callback closes the modal
- Check for JavaScript errors in console

### Provider buttons not working
- Verify all dependencies are installed
- Check for console errors
- Ensure Next.js app router is configured

## Contributing

When adding new OAuth providers:

1. Add provider to `OAuthProvider` type in `types.ts`
2. Add provider config to `OAUTH_PROVIDERS` array
3. Import appropriate icon from lucide-react
4. Update backend to support new provider
5. Update this README

## License

Part of the atoms.tech codebase.
