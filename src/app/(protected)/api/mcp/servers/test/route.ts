import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';

/**
 * POST /api/mcp/servers/test
 * Test connection to an MCP server before saving
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
    const { serverUrl, transport } = body;

    // Test STDIO configuration
    if (transport === 'stdio') {
      return NextResponse.json({
        success: true,
        message: 'STDIO transport configuration valid',
        note: 'STDIO servers can only be tested when running',
      });
    }

    // Test SSE/HTTP connection
    if (!serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required for testing' },
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

      const testResponse = await fetch(serverUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MCP-Client/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (testResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'Connection successful',
          statusCode: testResponse.status,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: `Server returned ${testResponse.status}`,
          statusCode: testResponse.status,
        });
      }
    } catch (testError) {
      if (testError instanceof Error && testError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          message: 'Connection timeout after 5 seconds',
        });
      }

      return NextResponse.json({
        success: false,
        message:
          testError instanceof Error
            ? testError.message
            : 'Failed to connect to server',
      });
    }
  } catch (error) {
    console.error('MCP server test error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
