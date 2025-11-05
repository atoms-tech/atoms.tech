/**
 * OAuth Callback API Route for MCP OAuth Token Exchange
 *
 * This Next.js API route handles OAuth callbacks from various providers,
 * exchanges authorization codes for tokens, and stores them securely.
 *
 * Supported Providers:
 * - GitHub
 * - Google
 * - Azure AD
 * - Auth0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Environment Variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY!; // 32 bytes hex string

// Provider Configurations
interface ProviderConfig {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
    github: {
        tokenUrl: 'https://github.com/login/oauth/access_token',
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    azure: {
        tokenUrl: process.env.AZURE_TOKEN_ENDPOINT!,
        clientId: process.env.AZURE_CLIENT_ID!,
        clientSecret: process.env.AZURE_CLIENT_SECRET!,
    },
    auth0: {
        tokenUrl: process.env.AUTH0_TOKEN_ENDPOINT!,
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    },
};

// Types
interface OAuthState {
    state: string;
    provider: string;
    mcp_name: string;
    user_id: string;
    code_verifier: string;
    redirect_uri: string;
    created_at: string;
}

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
}

// Encryption Functions
function encrypt(text: string): string {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
        throw new Error('Invalid encryption key. Must be 32 bytes (64 hex chars)');
    }

    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return IV + AuthTag + Encrypted in hex format
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
        throw new Error('Invalid encryption key. Must be 32 bytes (64 hex chars)');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// Database Functions
async function getOAuthState(state: string): Promise<OAuthState | null> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .single();

    if (error || !data) {
        return null;
    }

    // Check if state is expired (5 minutes)
    const createdAt = new Date(data.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 5) {
        // Delete expired state
        await supabase.from('oauth_states').delete().eq('state', state);
        return null;
    }

    return data as OAuthState;
}

async function deleteOAuthState(state: string): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('oauth_states').delete().eq('state', state);
}

async function storeTokens(
    userId: string,
    mcpName: string,
    provider: string,
    tokens: TokenResponse
): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate expiration time
    const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    // Upsert tokens (update if exists, insert if not)
    const { error } = await supabase.from('mcp_oauth_tokens').upsert(
        {
            user_id: userId,
            mcp_name: mcpName,
            provider: provider,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
            expires_at: expiresAt.toISOString(),
            token_type: tokens.token_type || 'Bearer',
            scope: tokens.scope || '',
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: 'user_id,mcp_name',
        }
    );

    if (error) {
        throw new Error(`Failed to store tokens: ${error.message}`);
    }
}

async function logAuditEvent(
    userId: string,
    action: string,
    details: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        resource_type: 'oauth_token',
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
    });
}

// Token Exchange Functions
async function exchangeCodeForTokens(
    provider: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string
): Promise<TokenResponse> {
    const config = PROVIDERS[provider];
    if (!config) {
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
    });

    // Add PKCE code_verifier if provided
    if (codeVerifier) {
        params.append('code_verifier', codeVerifier);
    }

    // Provider-specific headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    // GitHub requires Accept header
    if (provider === 'github') {
        headers['Accept'] = 'application/json';
    }

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers,
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}`
        );
    }

    const data = await response.json();

    // Validate required fields
    if (!data.access_token) {
        throw new Error('No access_token in response');
    }

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope,
    };
}

// Main Handler
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        const { code, state } = body;

        // Validate required parameters
        if (!code || !state) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'invalid_request',
                    message: 'Missing required parameters: code and state',
                },
                { status: 400 }
            );
        }

        // Retrieve and validate state from database (CSRF protection)
        const oauthState = await getOAuthState(state);

        if (!oauthState) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'invalid_state',
                    message: 'State parameter is invalid or expired',
                },
                { status: 401 }
            );
        }

        // Decrypt code_verifier for PKCE
        let codeVerifier: string | undefined;
        if (oauthState.code_verifier) {
            try {
                codeVerifier = decrypt(oauthState.code_verifier);
            } catch (err) {
                console.error('Failed to decrypt code_verifier:', err);
                // Continue without PKCE if decryption fails
            }
        }

        // Exchange authorization code for tokens
        let tokens: TokenResponse;
        try {
            tokens = await exchangeCodeForTokens(
                oauthState.provider,
                code,
                oauthState.redirect_uri,
                codeVerifier
            );
        } catch (err) {
            console.error('Token exchange failed:', err);

            // Log audit event for failed token exchange
            await logAuditEvent(
                oauthState.user_id,
                'oauth_token_exchange_failed',
                {
                    provider: oauthState.provider,
                    mcp_name: oauthState.mcp_name,
                    error: err instanceof Error ? err.message : String(err),
                },
                req.headers.get('x-forwarded-for') || undefined,
                req.headers.get('user-agent') || undefined
            );

            return NextResponse.json(
                {
                    success: false,
                    error: 'token_exchange_failed',
                    message: err instanceof Error ? err.message : 'Unknown error',
                },
                { status: 401 }
            );
        }

        // Store tokens in database (encrypted)
        try {
            await storeTokens(oauthState.user_id, oauthState.mcp_name, oauthState.provider, tokens);
        } catch (err) {
            console.error('Failed to store tokens:', err);

            // Log audit event for failed token storage
            await logAuditEvent(
                oauthState.user_id,
                'oauth_token_storage_failed',
                {
                    provider: oauthState.provider,
                    mcp_name: oauthState.mcp_name,
                    error: err instanceof Error ? err.message : String(err),
                },
                req.headers.get('x-forwarded-for') || undefined,
                req.headers.get('user-agent') || undefined
            );

            return NextResponse.json(
                {
                    success: false,
                    error: 'database_error',
                    message: 'Failed to store OAuth tokens',
                },
                { status: 500 }
            );
        }

        // Delete used state from database
        await deleteOAuthState(state);

        // Log successful OAuth flow
        await logAuditEvent(
            oauthState.user_id,
            'oauth_token_exchanged',
            {
                provider: oauthState.provider,
                mcp_name: oauthState.mcp_name,
                scope: tokens.scope || '',
            },
            req.headers.get('x-forwarded-for') || undefined,
            req.headers.get('user-agent') || undefined
        );

        return NextResponse.json({
            success: true,
            provider: oauthState.provider,
            mcp_name: oauthState.mcp_name,
        });
    } catch (err) {
        console.error('Unexpected error in OAuth callback:', err);

        return NextResponse.json(
            {
                success: false,
                error: 'internal_error',
                message: err instanceof Error ? err.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
