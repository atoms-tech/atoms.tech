import { NextRequest, NextResponse } from 'next/server';

/**
 * AgentAPI Models Endpoint
 *
 * OpenAI-compatible models listing endpoint.
 * Returns available models from the AgentAPI service.
 *
 * Endpoint: GET /api/agentapi-proxy/v1/models
 *
 * Response format (OpenAI-compatible):
 * {
 *   "object": "list",
 *   "data": [
 *     {
 *       "id": "model-id",
 *       "object": "model",
 *       "created": 1234567890,
 *       "owned_by": "organization",
 *       "permission": [...],
 *       "root": "model-id",
 *       "parent": null
 *     }
 *   ]
 * }
 */

const AGENTAPI_BASE_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

interface ModelPermission {
  id: string;
  object: string;
  created: number;
  allow_create_engine: boolean;
  allow_sampling: boolean;
  allow_logprobs: boolean;
  allow_search_indices: boolean;
  allow_view: boolean;
  allow_fine_tuning: boolean;
  organization: string;
  group: string | null;
  is_blocking: boolean;
}

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: ModelPermission[];
  root: string;
  parent: string | null;
}

interface ModelsListResponse {
  object: string;
  data: Model[];
}

interface ModelsError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * GET handler for models listing
 */
export async function GET(request: NextRequest) {
  try {
    const targetUrl = `${AGENTAPI_BASE_URL}/v1/models`;

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
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    }).catch((fetchError) => {
      console.error('Failed to fetch from AgentAPI:', fetchError);
      throw new Error(
        `Failed to connect to AgentAPI at ${targetUrl}. ` +
        `Please ensure the service is running. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      );
    });

    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      let errorMessage = `AgentAPI returned status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // If response isn't JSON, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }

      const error: ModelsError = {
        error: {
          message: errorMessage,
          type: 'api_error',
          code: `HTTP_${response.status}`,
        },
      };
      return NextResponse.json(error, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse AgentAPI response:', parseError);
      const error: ModelsError = {
        error: {
          message: 'Invalid JSON response from AgentAPI',
          type: 'invalid_response',
        },
      };
      return NextResponse.json(error, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Validate response format
    const modelsResponse = responseData as ModelsListResponse;
    if (!modelsResponse.data || !Array.isArray(modelsResponse.data)) {
      const error: ModelsError = {
        error: {
          message: 'Invalid response format from AgentAPI',
          type: 'invalid_response',
        },
      };
      return NextResponse.json(error, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return NextResponse.json(modelsResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Models endpoint error:', error);

    const errorResponse: ModelsError = {
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

/**
 * GET handler for individual model details
 * Endpoint: GET /api/agentapi-proxy/v1/models/{model_id}
 */
export async function GET_MODEL_BY_ID(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const modelId = params.id;

    if (!modelId) {
      const error: ModelsError = {
        error: {
          message: 'Model ID is required',
          type: 'invalid_request',
        },
      };
      return NextResponse.json(error, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const targetUrl = `${AGENTAPI_BASE_URL}/v1/models/${modelId}`;

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    }).catch((fetchError) => {
      console.error('Failed to fetch model from AgentAPI:', fetchError);
      throw new Error(
        `Failed to connect to AgentAPI at ${targetUrl}. ` +
        `Please ensure the service is running. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      );
    });

    if (!response.ok) {
      let errorMessage = `AgentAPI returned status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }

      const error: ModelsError = {
        error: {
          message: errorMessage,
          type: 'api_error',
          code: `HTTP_${response.status}`,
        },
      };
      return NextResponse.json(error, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse AgentAPI response:', parseError);
      const error: ModelsError = {
        error: {
          message: 'Invalid JSON response from AgentAPI',
          type: 'invalid_response',
        },
      };
      return NextResponse.json(error, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Model details error:', error);

    const errorResponse: ModelsError = {
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
