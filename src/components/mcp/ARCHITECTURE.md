# MCPOAuthConnect - Component Architecture

## Component Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Application                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Parent Component (e.g., Settings Page)                │ │
│  │                                                         │ │
│  │  const [isOpen, setIsOpen] = useState(false)          │ │
│  │                                                         │ │
│  │  <Button onClick={() => setIsOpen(true)}>             │ │
│  │    Connect OAuth                                       │ │
│  │  </Button>                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ Props                            │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           MCPOAuthConnect Component                    │ │
│  │                                                         │ │
│  │  Props: { isOpen, onClose, onSuccess }                │ │
│  │                                                         │ │
│  │  State:                                                │ │
│  │    - isLoading: boolean                               │ │
│  │    - selectedProvider: OAuthProvider | null           │ │
│  │    - error: string | null                             │ │
│  │                                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Dialog (Radix UI)                        │ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐│ │ │
│  │  │  │ DialogHeader                                ││ │ │
│  │  │  │   - Title: "Connect OAuth Provider"         ││ │ │
│  │  │  │   - Description                             ││ │ │
│  │  │  └─────────────────────────────────────────────┘│ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐│ │ │
│  │  │  │ Error Alert (Conditional)                   ││ │ │
│  │  │  │   Shown when: error !== null                ││ │ │
│  │  │  └─────────────────────────────────────────────┘│ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐│ │ │
│  │  │  │ Provider Selection Grid                     ││ │ │
│  │  │  │                                             ││ │ │
│  │  │  │  ┌────────────────────────────────────┐    ││ │ │
│  │  │  │  │ GitHub Button                      │    ││ │ │
│  │  │  │  │  [Icon] GitHub                     │    ││ │ │
│  │  │  │  │  Connect with GitHub OAuth         │    ││ │ │
│  │  │  │  └────────────────────────────────────┘    ││ │ │
│  │  │  │                                             ││ │ │
│  │  │  │  ┌────────────────────────────────────┐    ││ │ │
│  │  │  │  │ Google Button                      │    ││ │ │
│  │  │  │  │  [Icon] Google                     │    ││ │ │
│  │  │  │  │  Connect with Google OAuth         │    ││ │ │
│  │  │  │  └────────────────────────────────────┘    ││ │ │
│  │  │  │                                             ││ │ │
│  │  │  │  ┌────────────────────────────────────┐    ││ │ │
│  │  │  │  │ Azure AD Button                    │    ││ │ │
│  │  │  │  │  [Icon] Azure AD                   │    ││ │ │
│  │  │  │  │  Connect with Microsoft Azure      │    ││ │ │
│  │  │  │  └────────────────────────────────────┘    ││ │ │
│  │  │  │                                             ││ │ │
│  │  │  │  ┌────────────────────────────────────┐    ││ │ │
│  │  │  │  │ Auth0 Button                       │    ││ │ │
│  │  │  │  │  [Icon] Auth0                      │    ││ │ │
│  │  │  │  │  Connect with Auth0                │    ││ │ │
│  │  │  │  └────────────────────────────────────┘    ││ │ │
│  │  │  │                                             ││ │ │
│  │  │  │  Loading State:                            ││ │ │
│  │  │  │    - Shows spinner on selected provider    ││ │ │
│  │  │  │    - Shows "Connecting..." text            ││ │ │
│  │  │  │    - Disables other providers              ││ │ │
│  │  │  └─────────────────────────────────────────────┘│ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐│ │ │
│  │  │  │ Info Section                                ││ │ │
│  │  │  │   "You will be redirected..."              ││ │ │
│  │  │  └─────────────────────────────────────────────┘│ │ │
│  │  │                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────┐│ │ │
│  │  │  │ Cancel Button                               ││ │ │
│  │  │  │   Disabled during loading                   ││ │ │
│  │  │  └─────────────────────────────────────────────┘│ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ onClick                          │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        handleProviderSelect(provider)                  │ │
│  │                                                         │ │
│  │  1. setIsLoading(true)                                │ │
│  │  2. setSelectedProvider(provider)                     │ │
│  │  3. setError(null)                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ HTTP POST                        │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST /api/mcp/oauth/init                              │ │
│  │                                                         │ │
│  │  Request Body:                                         │ │
│  │    {                                                   │ │
│  │      "provider": "github"                             │ │
│  │    }                                                   │ │
│  │                                                         │ │
│  │  Success Response (200):                              │ │
│  │    {                                                   │ │
│  │      "authUrl": "https://github.com/oauth/...",      │ │
│  │      "state": "random-token",                         │ │
│  │      "provider": "github"                             │ │
│  │    }                                                   │ │
│  │                                                         │ │
│  │  Error Response (4xx/5xx):                            │ │
│  │    {                                                   │ │
│  │      "error": "Error message",                        │ │
│  │      "code": "ERROR_CODE"                             │ │
│  │    }                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Handling                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Success Path                                           │ │
│  │  1. Show success toast                                 │ │
│  │  2. router.push(authUrl)                               │ │
│  │  3. setTimeout(() => onSuccess(), 500)                 │ │
│  │  4. setIsLoading(false)                                │ │
│  │  5. setSelectedProvider(null)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ Redirect                         │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Error Path                                             │ │
│  │  1. setError(errorMessage)                             │ │
│  │  2. Show error toast                                   │ │
│  │  3. console.error(error)                               │ │
│  │  4. setIsLoading(false)                                │ │
│  │  5. setSelectedProvider(null)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              OAuth Provider (External)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GitHub / Google / Azure / Auth0                       │ │
│  │                                                         │ │
│  │  User authorizes the application                       │ │
│  │  Redirects back to callback URL                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## State Transitions

```
┌─────────────┐
│   Initial   │
│   State     │
│             │
│ isLoading:  │
│   false     │
│ error:      │
│   null      │
│ selected:   │
│   null      │
└─────────────┘
      │
      │ User clicks provider
      ▼
┌─────────────┐
│   Loading   │
│   State     │
│             │
│ isLoading:  │
│   true      │
│ error:      │
│   null      │
│ selected:   │
│   'github'  │
└─────────────┘
      │
      ├─── Success ────┐    ┌──── Error ────┐
      │                │    │               │
      ▼                │    │               ▼
┌─────────────┐        │    │         ┌─────────────┐
│  Redirect   │        │    │         │   Error     │
│   State     │        │    │         │   State     │
│             │        │    │         │             │
│ isLoading:  │        │    │         │ isLoading:  │
│   false     │        │    │         │   false     │
│ error:      │        │    │         │ error:      │
│   null      │        │    │         │   "message" │
│ Toast shown │        │    │         │ selected:   │
│ Navigate    │        │    │         │   null      │
└─────────────┘        │    │         │ Toast shown │
      │                │    │         └─────────────┘
      │                │    │               │
      └────────────────┴────┴───────────────┘
                      │
                      │ Modal closes
                      ▼
              ┌─────────────┐
              │   Closed    │
              │   State     │
              │             │
              │ All state   │
              │ cleaned up  │
              └─────────────┘
```

## Component Dependencies

```
MCPOAuthConnect.tsx
│
├── React Hooks
│   ├── useState (state management)
│   └── (router from next/navigation)
│
├── UI Components (atoms.tech)
│   ├── Button (ui/button)
│   ├── Dialog, DialogContent, DialogHeader, etc. (ui/dialog)
│   ├── Alert, AlertDescription (ui/alert)
│   ├── LoadingSpinner (ui/loading-spinner)
│   └── useToast (ui/use-toast)
│
├── Icons (lucide-react)
│   ├── Github
│   ├── Chrome
│   ├── Shield
│   └── Key
│
└── Utils
    └── cn (lib/utils)
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                     User Interaction                      │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Component State Updates                      │
│  isLoading = true                                        │
│  selectedProvider = 'github'                             │
│  error = null                                            │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   API Request                             │
│  POST /api/mcp/oauth/init                                │
│  Body: { provider: 'github' }                            │
└──────────────────────────────────────────────────────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                Success         Error
                   │               │
                   ▼               ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│    Success Handler      │  │    Error Handler        │
│                         │  │                         │
│ 1. Toast notification   │  │ 1. Set error state      │
│ 2. Navigate to authUrl  │  │ 2. Toast notification   │
│ 3. Call onSuccess()     │  │ 3. Log to console       │
│ 4. Reset loading state  │  │ 4. Reset loading state  │
└─────────────────────────┘  └─────────────────────────┘
                   │               │
                   └───────┬───────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  Component Cleanup                        │
│  isLoading = false                                       │
│  selectedProvider = null                                 │
└──────────────────────────────────────────────────────────┘
```

## Props Interface

```typescript
interface MCPOAuthConnectProps {
    // Controls modal visibility
    isOpen: boolean;

    // Called when user closes modal or clicks cancel
    onClose: () => void;

    // Called after successful OAuth initialization
    // (before redirect to provider)
    onSuccess: () => void;
}
```

## Internal State

```typescript
// Loading state during API call
const [isLoading, setIsLoading] = useState<boolean>(false);

// Currently selected provider (for loading indicator)
const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);

// Error message to display
const [error, setError] = useState<string | null>(null);
```

## Provider Configuration

```typescript
interface ProviderConfig {
    id: 'github' | 'google' | 'azure' | 'auth0';
    name: string;
    icon: React.ComponentType;
    description: string;
    color: string; // Tailwind hover classes
}
```

## File Organization

```
mcp/
├── MCPOAuthConnect.tsx          # Main component
│   ├── Component definition
│   ├── Provider configurations
│   ├── Event handlers
│   └── Render logic
│
├── types.ts                     # TypeScript definitions
│   ├── OAuthProvider type
│   ├── Request/Response interfaces
│   └── Component props
│
├── index.ts                     # Barrel exports
│   └── Clean import paths
│
├── MCPOAuthConnect.example.tsx  # Usage examples
│   ├── Basic usage
│   └── Advanced patterns
│
├── MCPOAuthConnect.test.tsx     # Unit tests
│   ├── Rendering tests
│   ├── OAuth flow tests
│   ├── Error handling tests
│   └── User interaction tests
│
├── README.md                    # Full documentation
├── QUICKSTART.md               # Quick reference
├── ARCHITECTURE.md             # This file
└── IMPLEMENTATION.md           # Implementation details
```

## Error Handling Flow

```
┌─────────────────────┐
│   API Call Error    │
└─────────────────────┘
          │
          ├── Network Error
          │   └── catch block → Error handler
          │
          ├── HTTP Error (non-200)
          │   └── response.ok check → Error handler
          │
          ├── JSON Parse Error
          │   └── .json() catch → Error handler
          │
          └── Missing authUrl
              └── validation check → Error handler

┌─────────────────────┐
│   Error Handler     │
│                     │
│ 1. Set error state  │
│ 2. Show toast       │
│ 3. Log to console   │
│ 4. Reset loading    │
└─────────────────────┘
```

## Toast Notification Flow

```
Success Toast
├── Variant: 'default'
├── Title: 'Redirecting to OAuth provider'
├── Description: 'Opening {provider} authorization page...'
└── Timing: Before navigation

Error Toast
├── Variant: 'destructive'
├── Title: 'OAuth Connection Failed'
├── Description: Error message
└── Timing: On error
```

## Security Considerations

```
┌─────────────────────────────────────────────┐
│         Client-Side Security                │
│                                             │
│ ✓ No sensitive credentials in client       │
│ ✓ State token generated on backend         │
│ ✓ HTTPS required for OAuth                 │
│ ✓ Error messages sanitized                 │
│ ✓ No localStorage of tokens                │
│ ✓ Proper CORS configuration needed         │
└─────────────────────────────────────────────┘
```

## Performance Characteristics

```
Initial Render
├── Dialog renders only when isOpen = true
├── Provider list is static (no API calls)
└── Minimal re-renders with React.memo potential

API Call
├── Single POST request per provider selection
├── Timeout handled by fetch
└── Loading state prevents duplicate requests

Navigation
├── Next.js router for client-side navigation
├── No full page reload
└── Preserves app state
```

## Accessibility Features

```
Dialog Component
├── ARIA attributes via Radix UI
├── Focus trap when open
├── ESC key to close
└── Focus restoration on close

Keyboard Navigation
├── Tab through providers
├── Enter/Space to activate
├── ESC to cancel
└── Focus visible states

Screen Reader Support
├── Proper heading hierarchy
├── Button labels
├── Loading state announcements
└── Error announcements
```

This architecture ensures a robust, maintainable, and user-friendly OAuth connection experience.
