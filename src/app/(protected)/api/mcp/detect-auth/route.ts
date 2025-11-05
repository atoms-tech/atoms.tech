import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';

/**
 * POST /api/mcp/detect-auth
 * Auto-detect authentication type for an MCP server
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { serverUrl } = body;

    if (!serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to access the server and analyze response headers
      const response = await fetch(serverUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MCP-Client/1.0',
        },
        redirect: 'manual', // Don't follow redirects automatically
      });

      clearTimeout(timeoutId);

      let detectedAuthType: string | null = null;

      // Check response headers for authentication hints
      const wwwAuthenticate = response.headers.get('www-authenticate');
      const authorizationHeader = response.headers.get('authorization');

      if (wwwAuthenticate) {
        if (wwwAuthenticate.toLowerCase().includes('bearer')) {
          detectedAuthType = 'bearer';
        } else if (wwwAuthenticate.toLowerCase().includes('oauth')) {
          detectedAuthType = 'oauth';
        } else if (wwwAuthenticate.toLowerCase().includes('basic')) {
          detectedAuthType = 'basic';
        }
      }

      // Check for OAuth redirect
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location');
        if (location && (location.includes('oauth') || location.includes('authorize'))) {
          detectedAuthType = 'oauth';
        }
      }

      // Check for 401 Unauthorized (indicates auth required)
      if (response.status === 401) {
        if (!detectedAuthType) {
          detectedAuthType = 'bearer'; // Default to bearer if we can't determine
        }
      }

      // Check if server responds without auth (200 OK)
      if (response.status === 200) {
        detectedAuthType = 'none';
      }

      // Try to parse response body for additional hints
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();

          // Check for common OAuth discovery endpoints
          if (data.authorization_endpoint || data.token_endpoint) {
            detectedAuthType = 'oauth';
          }

          // Check for auth requirement message
          if (data.error === 'unauthorized' || data.message?.toLowerCase().includes('auth')) {
            if (!detectedAuthType || detectedAuthType === 'none') {
              detectedAuthType = 'bearer';
            }
          }
        }
      } catch {
        // Ignore JSON parse errors
      }

      return NextResponse.json({
        authType: detectedAuthType,
        statusCode: response.status,
        message: detectedAuthType
          ? `Detected ${detectedAuthType} authentication`
          : 'Could not determine authentication type',
        headers: {
          wwwAuthenticate: wwwAuthenticate || undefined,
          contentType: response.headers.get('content-type') || undefined,
        },
      });
    } catch (detectError) {
      if (detectError instanceof Error && detectError.name === 'AbortError') {
        return NextResponse.json({
          authType: null,
          message: 'Connection timeout - could not detect authentication',
        });
      }

      return NextResponse.json({
        authType: null,
        message:
          detectError instanceof Error
            ? detectError.message
            : 'Failed to detect authentication',
      });
    }
  } catch (error) {
    console.error('Auth detection error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
