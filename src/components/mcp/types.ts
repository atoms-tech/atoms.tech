/**
 * Type definitions for MCP OAuth integration (Component Layer)
 *
 * This file re-exports types from the centralized location for component use.
 * @deprecated Import directly from '@/types/mcp/oauth.types' instead
 */

// Re-export commonly used types for components
export type {
  OAuthProvider,
  MCPOAuthProvider,
  OAuthInitRequest,
  OAuthInitResponse,
  OAuthErrorResponse,
  ProviderConfig,
  MCPOAuthConnectProps,
  OAuthConnectionStatus,
} from '@/types/mcp/oauth.types';
