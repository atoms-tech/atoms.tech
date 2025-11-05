/**
 * Example OAuth Callback API Route
 *
 * This file demonstrates how to implement the backend endpoint for OAuth token exchange.
 * Copy this to route.ts and customize for your specific OAuth provider.
 */

import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { createSuccessResponse, handleApiError } from '@/lib/api/errors';
import type { RequestContext } from '@/lib/api/types';

// Validation schema for the token request
const tokenRequestSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State parameter is required'),
    provider: z.enum(['github', 'gitlab', 'google', 'microsoft', 'slack', 'linear', 'notion']),
    codeVerifier: z.string().optional(), // For PKCE flow
    redirectUri: z.string().url('Invalid redirect URI'),
});

type TokenRequest = z.infer<typeof tokenRequestSchema>;

// OAuth Provider Configuration
interface ProviderConfig {
    tokenUrl: string;
    clientId: string;
    clientSecret?: string;
    requiresBasicAuth?: boolean;
}

const providerConfigs: Record<string, ProviderConfig> = {
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
    gitlab: {
        tokenUrl: 'https://gitlab.com/oauth/token',
        clientId: process.env.GITLAB_CLIENT_ID!,
        clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    },
    // Add more providers as needed
};

export async function POST(request: NextRequest) {
    const context: RequestContext = {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        method: 'POST',
        url: request.url,
    };

    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = tokenRequestSchema.parse(body);

        // Get provider configuration
        const providerConfig = providerConfigs[validatedData.provider];
        if (!providerConfig) {
            throw new Error(`Unsupported provider: ${validatedData.provider}`);
        }

        // Exchange authorization code for access token
        const tokenData = await exchangeCodeForToken(validatedData, providerConfig);

        // Optional: Store tokens in database
        // await storeTokensInDatabase(userId, validatedData.provider, tokenData);

        // Optional: Set secure httpOnly cookie (recommended for production)
        // const response = createSuccessResponse({ ... }, context);
        // response.cookies.set('mcp_token', tokenData.access_token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'lax',
        //     maxAge: tokenData.expires_in,
        //     path: '/',
        // });
        // return response;

        // Return success response with token data
        return createSuccessResponse(
            {
                success: true,
                provider: validatedData.provider,
                tokenData: {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresIn: tokenData.expires_in,
                    tokenType: tokenData.token_type,
                    scope: tokenData.scope,
                },
            },
            context
        );
    } catch (error) {
        console.error('[OAuth Callback Error]', error);
        return handleApiError(error, context, process.env.NODE_ENV !== 'production');
    }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
    tokenRequest: TokenRequest,
    config: ProviderConfig
): Promise<OAuthTokenResponse> {
    const requestBody: Record<string, string> = {
        grant_type: 'authorization_code',
        code: tokenRequest.code,
        redirect_uri: tokenRequest.redirectUri,
        client_id: config.clientId,
    };

    // Add client secret if not using PKCE
    if (!tokenRequest.codeVerifier && config.clientSecret) {
        requestBody.client_secret = config.clientSecret;
    }

    // Add code verifier for PKCE flow
    if (tokenRequest.codeVerifier) {
        requestBody.code_verifier = tokenRequest.codeVerifier;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
    };

    // Some providers require Basic Auth
    if (config.requiresBasicAuth && config.clientSecret) {
        const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
        headers.Authorization = `Basic ${credentials}`;
    }

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers,
        body: new URLSearchParams(requestBody).toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Token Exchange Failed]', {
            status: response.status,
            error: errorText,
        });
        throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    // Validate token response
    if (!data.access_token) {
        throw new Error('No access token in response');
    }

    return data;
}

/**
 * Optional: Store tokens in database
 */
async function _storeTokensInDatabase(
    userId: string,
    provider: string,
    tokenData: OAuthTokenResponse
): Promise<void> {
    // Encrypt tokens before storing
    const _encryptedAccessToken = await _encryptToken(tokenData.access_token);
    const _encryptedRefreshToken = tokenData.refresh_token
        ? await _encryptToken(tokenData.refresh_token)
        : null;

    // Store in database
    // await db.oauthTokens.upsert({
    //     where: {
    //         userId_provider: {
    //             userId,
    //             provider,
    //         },
    //     },
    //     create: {
    //         userId,
    //         provider,
    //         accessToken: encryptedAccessToken,
    //         refreshToken: encryptedRefreshToken,
    //         expiresAt: tokenData.expires_in
    //             ? new Date(Date.now() + tokenData.expires_in * 1000)
    //             : null,
    //         scope: tokenData.scope,
    //     },
    //     update: {
    //         accessToken: encryptedAccessToken,
    //         refreshToken: encryptedRefreshToken,
    //         expiresAt: tokenData.expires_in
    //             ? new Date(Date.now() + tokenData.expires_in * 1000)
    //             : null,
    //         scope: tokenData.scope,
    //         updatedAt: new Date(),
    //     },
    // });
}

/**
 * Encrypt token using AES-256-GCM
 */
async function _encryptToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);

    // Get encryption key from environment
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(process.env.TOKEN_ENCRYPTION_KEY!.padEnd(32, '0').substring(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return base64 encoded
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt token
 */
async function _decryptToken(encryptedToken: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedToken), (c) => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Get decryption key
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(process.env.TOKEN_ENCRYPTION_KEY!.padEnd(32, '0').substring(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

    return decoder.decode(decrypted);
}

// OAuth Token Response Type
interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
}
