/**
 * OAuth Token Refresh API Route
 *
 * Handles automatic token refresh for MCP OAuth providers.
 * This endpoint is called by the TokenService when tokens need refreshing.
 *
 * Security:
 * - CSRF protection via same-origin policy
 * - Rate limiting recommended
 * - Credentials validated server-side
 * - No token exposure in logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Types & Validation
// ============================================================================

const RefreshRequestSchema = z.object({
  provider: z.enum(['google', 'microsoft', 'github', 'custom']),
  refreshToken: z.string().min(1),
});

interface OAuthRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  id_token?: string;
}

// ============================================================================
// OAuth Provider Configurations
// ============================================================================

const OAUTH_CONFIGS = {
  google: {
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  microsoft: {
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  },
  github: {
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  custom: {
    tokenEndpoint: process.env.CUSTOM_OAUTH_TOKEN_ENDPOINT,
    clientId: process.env.CUSTOM_OAUTH_CLIENT_ID,
    clientSecret: process.env.CUSTOM_OAUTH_CLIENT_SECRET,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Refresh OAuth token with provider
 */
async function refreshOAuthToken(
  provider: keyof typeof OAUTH_CONFIGS,
  refreshToken: string
): Promise<OAuthRefreshResponse> {
  const config = OAUTH_CONFIGS[provider];

  if (!config.tokenEndpoint || !config.clientId || !config.clientSecret) {
    throw new Error(`OAuth configuration incomplete for provider: ${provider}`);
  }

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    await response.text();
    console.error(`[OAuth Refresh] Failed for ${provider}:`, response.status);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Rate limiting check (simple in-memory implementation)
 * In production, use Redis or similar for distributed systems
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Rate Limiting
    // ========================================================================
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `refresh:${clientIp}`;

    if (!checkRateLimit(rateLimitKey, 10, 60000)) {
      console.warn(`[OAuth Refresh] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // ========================================================================
    // 2. Request Validation
    // ========================================================================
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validationResult = RefreshRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { provider, refreshToken } = validationResult.data;

    // ========================================================================
    // 3. Provider Configuration Check
    // ========================================================================
    const config = OAUTH_CONFIGS[provider];
    if (!config.clientId || !config.clientSecret) {
      console.error(`[OAuth Refresh] Missing credentials for provider: ${provider}`);
      return NextResponse.json(
        { error: 'OAuth provider not configured' },
        { status: 500 }
      );
    }

    // ========================================================================
    // 4. Token Refresh
    // ========================================================================
    console.log(`[OAuth Refresh] Refreshing token for provider: ${provider}`);

    const tokenData = await refreshOAuthToken(provider, refreshToken);

    // ========================================================================
    // 5. Response Formatting
    // ========================================================================
    const token = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Keep old if not provided
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      idToken: tokenData.id_token,
    };

    console.log(`[OAuth Refresh] Token refreshed successfully for provider: ${provider}`);

    return NextResponse.json(
      { token },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    // ========================================================================
    // Error Handling (never log tokens)
    // ========================================================================
    console.error('[OAuth Refresh] Error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      {
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Security Headers
// ============================================================================

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
