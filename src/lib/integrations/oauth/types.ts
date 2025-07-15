// OAuth Integration Types

export interface OAuthProvider {
    id: string;
    name: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    clientId: string;
    redirectUri: string;
}

export interface OAuthToken {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    token_type: string;
    scope?: string;
}

export interface OAuthIntegration {
    id: string;
    organization_id: string;
    provider: string;
    access_token_vault_key: string;
    refresh_token_vault_key?: string;
    expires_at?: Date;
    scopes: string[];
    user_id: string;
    created_at: Date;
    updated_at: Date;
    status: 'active' | 'expired' | 'revoked' | 'error';
}

export interface OAuthConfig {
    google: {
        clientId: string;
        clientSecret: string;
        scopes: string[];
    };
    github: {
        clientId: string;
        clientSecret: string;
        scopes: string[];
    };
    jira: {
        clientId: string;
        clientSecret: string;
        scopes: string[];
    };
    slack: {
        clientId: string;
        clientSecret: string;
        scopes: string[];
    };
}

export interface MCPIntegration {
    id: string;
    organization_id: string;
    name: string;
    type: 'webhook' | 'api' | 'custom';
    configuration: Record<string, unknown>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface MCPWebhookConfig {
    webhookUrl: string;
    method: 'POST' | 'GET' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'api_key';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        apiKeyHeader?: string;
    };
}

export interface MCPAPIConfig {
    baseUrl: string;
    endpoints: {
        [key: string]: {
            path: string;
            method: string;
            headers?: Record<string, string>;
        };
    };
    authentication?: {
        type: 'bearer' | 'basic' | 'api_key' | 'oauth';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        apiKeyHeader?: string;
        oauthConfig?: {
            clientId: string;
            clientSecret: string;
            tokenUrl: string;
            scopes: string[];
        };
    };
}

// Supabase Vault Integration
export interface VaultSecret {
    key: string;
    value: string;
    organization_id: string;
    created_at: Date;
    updated_at: Date;
}

// Integration Status Types
export type IntegrationStatus =
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'pending';

export interface IntegrationHealth {
    status: IntegrationStatus;
    lastChecked: Date;
    lastSuccess?: Date;
    errorMessage?: string;
    responseTime?: number;
}

// API Response Types
export interface OAuthAuthorizationResponse {
    authUrl: string;
    state: string;
}

export interface OAuthCallbackResponse {
    success: boolean;
    integration?: OAuthIntegration;
    error?: string;
}

export interface IntegrationTestResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    responseTime: number;
}

// Frontend Integration Display Types
export interface IntegrationCard {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: IntegrationStatus;
    type: 'oauth' | 'mcp';
    provider?: string;
    lastConnected?: Date;
    scopes?: string[];
    configuration?: Record<string, unknown>;
    health?: IntegrationHealth;
}

// Integration Management Actions
export interface IntegrationActions {
    connect: (
        integrationId: string,
        config?: Record<string, unknown>,
    ) => Promise<void>;
    disconnect: (integrationId: string) => Promise<void>;
    test: (integrationId: string) => Promise<IntegrationTestResponse>;
    refresh: (integrationId: string) => Promise<void>;
    configure: (
        integrationId: string,
        config: Record<string, unknown>,
    ) => Promise<void>;
}

// Error Types
export class IntegrationError extends Error {
    constructor(
        message: string,
        public code: string,
        public provider?: string,
        public details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'IntegrationError';
    }
}

export class OAuthError extends IntegrationError {
    constructor(
        message: string,
        public oauthError: string,
        public oauthErrorDescription?: string,
        provider?: string,
    ) {
        super(message, 'OAUTH_ERROR', provider, {
            oauthError,
            oauthErrorDescription,
        });
        this.name = 'OAuthError';
    }
}

export class VaultError extends IntegrationError {
    constructor(
        message: string,
        public vaultOperation: string,
    ) {
        super(message, 'VAULT_ERROR', undefined, { vaultOperation });
        this.name = 'VaultError';
    }
}

// Utility Types
export type OAuthProviderType = 'google' | 'github' | 'jira' | 'slack';
export type MCPIntegrationType = 'webhook' | 'api' | 'custom';

export interface IntegrationPermission {
    scope: string;
    description: string;
    required: boolean;
}

export interface ProviderMetadata {
    name: string;
    description: string;
    icon: string;
    color: string;
    permissions: IntegrationPermission[];
    documentationUrl: string;
    supportUrl: string;
}
