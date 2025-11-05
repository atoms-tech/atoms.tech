import { NextRequest, NextResponse } from 'next/server';

/**
 * AgentAPI Proxy - Main Route Handler
 *
 * This proxy provides a secure gateway to the AgentAPI service,
 * handling authentication and request forwarding.
 *
 * Supported endpoints:
 * - /v1/models - List available models
 * - /v1/chat/completions - Chat completions with streaming support
 */

const AGENTAPI_BASE_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

interface ProxyError {
  error: string;
  details?: string;
  statusCode?: number;
}

/**
 * Forward requests to AgentAPI service
 */
async function forwardRequest(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const targetUrl = `${AGENTAPI_BASE_URL}${path}${url.search}`;

    // Copy headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host and connection headers
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Add AgentAPI-specific headers
    headers.set('Content-Type', 'application/json');

    // Forward the request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
      // Don't follow redirects
      redirect: 'manual',
    });

    // Handle streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular responses
    const data = await response.text();
    const responseHeaders = new Headers();

    // Copy relevant response headers
    ['content-type', 'cache-control'].forEach((header) => {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    });

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('AgentAPI proxy error:', error);

    const errorResponse: ProxyError = {
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET handler - Route to specific endpoints
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/agentapi-proxy', '');

  // Default to models endpoint if no specific path
  if (!path || path === '/') {
    return forwardRequest(request, '/v1/models');
  }

  return forwardRequest(request, path);
}

/**
 * POST handler - Forward POST requests
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/agentapi-proxy', '');

  // Default to chat completions if no specific path
  if (!path || path === '/') {
    return forwardRequest(request, '/v1/chat/completions');
  }

  return forwardRequest(request, path);
}

/**
 * Health check endpoint
 */
export async function HEAD() {
  try {
    const response = await fetch(`${AGENTAPI_BASE_URL}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    return new NextResponse(null, {
      status: response.ok ? 200 : 503,
      headers: {
        'X-AgentAPI-Status': response.ok ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-AgentAPI-Status': 'unreachable',
        'X-Error': error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
