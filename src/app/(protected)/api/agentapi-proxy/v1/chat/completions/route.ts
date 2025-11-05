import { NextRequest, NextResponse } from 'next/server';

/**
 * AgentAPI Chat Completions Endpoint
 *
 * OpenAI-compatible chat completions API with streaming support.
 * Proxies requests to the AgentAPI service.
 *
 * Endpoint: POST /api/agentapi-proxy/v1/chat/completions
 *
 * Request body:
 * {
 *   "model": "string",           // Model to use
 *   "messages": [...],            // Chat messages array
 *   "stream": boolean,            // Enable streaming (optional)
 *   "temperature": number,        // Temperature (optional)
 *   "max_tokens": number,         // Max tokens (optional)
 *   "top_p": number,              // Top p (optional)
 *   "frequency_penalty": number,  // Frequency penalty (optional)
 *   "presence_penalty": number,   // Presence penalty (optional)
 *   "stop": string | string[],    // Stop sequences (optional)
 * }
 */

const AGENTAPI_BASE_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  user?: string;
}

interface ChatCompletionError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Validate chat completion request
 */
function validateRequest(body: unknown): ChatCompletionRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const req = body as Partial<ChatCompletionRequest>;

  if (!req.model || typeof req.model !== 'string') {
    throw new Error('Model is required and must be a string');
  }

  if (!Array.isArray(req.messages) || req.messages.length === 0) {
    throw new Error('Messages array is required and must not be empty');
  }

  // Validate message format
  req.messages.forEach((msg, index) => {
    if (!msg.role || !msg.content) {
      throw new Error(`Message at index ${index} must have role and content`);
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      throw new Error(`Invalid role at index ${index}: ${msg.role}`);
    }
  });

  return req as ChatCompletionRequest;
}

/**
 * POST handler for chat completions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = validateRequest(body);

    const targetUrl = `${AGENTAPI_BASE_URL}/v1/chat/completions`;

    // Prepare headers
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Copy authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    // Forward request to AgentAPI
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(validatedRequest),
    }).catch((fetchError) => {
      console.error('Failed to fetch from AgentAPI:', fetchError);
      throw new Error(
        `Failed to connect to AgentAPI at ${targetUrl}. ` +
        `Please ensure the service is running. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      );
    });

    // Handle streaming responses
    if (validatedRequest.stream && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Handle non-streaming responses
    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse AgentAPI response:', parseError);
      const error: ChatCompletionError = {
        error: {
          message: 'Invalid JSON response from AgentAPI',
          type: 'invalid_response',
        },
      };
      return NextResponse.json(error, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (!response.ok) {
      const error: ChatCompletionError = {
        error: {
          message: responseData.error?.message || `Request failed with status ${response.status}`,
          type: responseData.error?.type || 'api_error',
          code: responseData.error?.code || `HTTP_${response.status}`,
        },
      };
      return NextResponse.json(error, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Chat completions error:', error);

    const errorResponse: ChatCompletionError = {
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        type: 'internal_error',
        code: 'internal_error',
      },
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
