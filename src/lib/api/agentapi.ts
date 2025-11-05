/**
 * AgentAPI TypeScript Client
 *
 * A comprehensive client for interacting with the AgentAPI service.
 * Supports both streaming and non-streaming chat completions, model management,
 * and integrates with AuthKit for authentication.
 *
 * @module agentapi
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a single message in the conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

/**
 * Function call information
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * Tool call information
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

/**
 * A choice in the completion response
 */
export interface Choice {
  index: number;
  message: Message;
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | null;
  logprobs?: unknown;
}

/**
 * Token usage information
 */
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Chat completion request parameters
 */
export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: unknown[];
  tool_choice?: unknown;
}

/**
 * Chat completion response (non-streaming)
 */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
  system_fingerprint?: string;
}

/**
 * Delta object for streaming responses
 */
export interface Delta {
  role?: 'system' | 'user' | 'assistant';
  content?: string;
  function_call?: Partial<FunctionCall>;
  tool_calls?: Partial<ToolCall>[];
}

/**
 * Choice in streaming response
 */
export interface StreamChoice {
  index: number;
  delta: Delta;
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | null;
}

/**
 * Streaming chunk from SSE
 */
export interface StreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: StreamChoice[];
  system_fingerprint?: string;
}

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  permission?: unknown[];
  root?: string;
  parent?: string;
}

/**
 * Models list response
 */
export interface ModelsResponse {
  object: 'list';
  data: ModelInfo[];
}

/**
 * Error response from API
 */
export interface APIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * Configuration options for AgentAPIClient
 */
export interface AgentAPIConfig {
  baseURL?: string;
  apiKey?: string;
  getToken?: () => Promise<string | null>;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  useStaticApiKey?: boolean; // Use NEXT_PUBLIC_STATIC_API_KEY from env
}

/**
 * Options for chat completion requests
 */
export interface ChatCompletionOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
}

// ============================================================================
// AgentAPI Client
// ============================================================================

/**
 * Client for interacting with the AgentAPI service
 *
 * @example
 * ```typescript
 * const client = new AgentAPIClient({
 *   baseURL: process.env.NEXT_PUBLIC_AGENTAPI_URL,
 *   getToken: async () => await authKit.getToken(),
 * });
 *
 * // Non-streaming
 * const response = await client.chat.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 *
 * // Streaming
 * await client.chat.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   stream: true,
 * }, {
 *   onChunk: (chunk) => console.log(chunk),
 * });
 * ```
 */
export class AgentAPIClient {
  private baseURL: string;
  private apiKey?: string;
  private getToken?: () => Promise<string | null>;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: AgentAPIConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:8787';

    // Priority: provided apiKey > static API key from env > getToken function
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    } else if (config.useStaticApiKey && process.env.NEXT_PUBLIC_STATIC_API_KEY) {
      this.apiKey = process.env.NEXT_PUBLIC_STATIC_API_KEY;
    }

    this.getToken = config.getToken;
    this.timeout = config.timeout || 60000; // 60 seconds
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  /**
   * Get authorization header value
   * Priority: static apiKey > getToken() callback
   */
  private async getAuthHeader(): Promise<string | null> {
    // Use static API key if available
    if (this.apiKey) {
      return `Bearer ${this.apiKey}`;
    }
    // Fall back to getToken callback for JWT
    if (this.getToken) {
      const token = await this.getToken();
      return token ? `Bearer ${token}` : null;
    }
    return null;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic wrapper for fetch requests
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on server errors (5xx) or network errors
      if (!response.ok && retries < this.maxRetries) {
        await this.sleep(this.retryDelay * Math.pow(2, retries));
        return this.fetchWithRetry(url, options, retries + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (retries < this.maxRetries) {
        await this.sleep(this.retryDelay * Math.pow(2, retries));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Parse SSE stream and emit chunks
   */
  private async parseSSEStream(
    response: Response,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith(':')) {
            continue;
          }

          // Parse SSE data
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);

            // Check for [DONE] signal
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const chunk: StreamChunk = JSON.parse(data);
              onChunk(chunk);
            } catch (parseError) {
              console.error('Failed to parse SSE chunk:', parseError, data);
              onError(new Error(`Failed to parse SSE chunk: ${parseError}`));
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Chat API namespace
   */
  public chat = {
    /**
     * Create a chat completion
     *
     * @param request - Chat completion request parameters
     * @param options - Additional options for streaming and callbacks
     * @returns Promise resolving to ChatCompletionResponse or void for streaming
     *
     * @example
     * ```typescript
     * // Non-streaming
     * const response = await client.chat.create({
     *   model: 'gpt-4',
     *   messages: [{ role: 'user', content: 'Hello!' }],
     * });
     *
     * // Streaming
     * await client.chat.create({
     *   model: 'gpt-4',
     *   messages: [{ role: 'user', content: 'Hello!' }],
     *   stream: true,
     * }, {
     *   onChunk: (chunk) => {
     *     const content = chunk.choices[0]?.delta?.content;
     *     if (content) console.log(content);
     *   },
     *   onComplete: () => console.log('Done!'),
     * });
     * ```
     */
    create: async (
      request: ChatCompletionRequest,
      options: ChatCompletionOptions = {}
    ): Promise<ChatCompletionResponse | void> => {
      const authHeader = await this.getAuthHeader();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const url = `${this.baseURL}/v1/chat/completions`;

      try {
        const response = await this.fetchWithRetry(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
          signal: options.signal,
        });

        if (!response.ok) {
          const errorData: APIError = await response.json().catch(() => ({
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
              type: 'api_error',
            },
          }));
          throw new Error(errorData.error.message || 'Unknown API error');
        }

        // Handle streaming responses
        if (request.stream) {
          await this.parseSSEStream(
            response,
            options.onChunk || (() => {}),
            options.onError || ((error) => { throw error; }),
            options.onComplete || (() => {})
          );
          return;
        }

        // Handle non-streaming responses
        const data: ChatCompletionResponse = await response.json();
        return data;
      } catch (error) {
        const wrappedError = error instanceof Error
          ? error
          : new Error(String(error));

        if (options.onError) {
          options.onError(wrappedError);
        } else {
          throw wrappedError;
        }
      }
    },
  };

  /**
   * Models API namespace
   */
  public models = {
    /**
     * List available models
     *
     * @returns Promise resolving to ModelsResponse
     *
     * @example
     * ```typescript
     * const models = await client.models.list();
     * console.log(models.data.map(m => m.id));
     * ```
     */
    list: async (): Promise<ModelsResponse> => {
      const authHeader = await this.getAuthHeader();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const url = `${this.baseURL}/v1/models`;

      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData: APIError = await response.json().catch(() => ({
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
              type: 'api_error',
            },
          }));
          throw new Error(errorData.error.message || 'Unknown API error');
        }

        const data: ModelsResponse = await response.json();
        return data;
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    },

    /**
     * Get a specific model by ID
     *
     * @param modelId - The model ID to retrieve
     * @returns Promise resolving to ModelInfo
     *
     * @example
     * ```typescript
     * const model = await client.models.retrieve('gpt-4');
     * console.log(model.id, model.owned_by);
     * ```
     */
    retrieve: async (modelId: string): Promise<ModelInfo> => {
      const authHeader = await this.getAuthHeader();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const url = `${this.baseURL}/v1/models/${modelId}`;

      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData: APIError = await response.json().catch(() => ({
            error: {
              message: `HTTP ${response.status}: ${response.statusText}`,
              type: 'api_error',
            },
          }));
          throw new Error(errorData.error.message || 'Unknown API error');
        }

        const data: ModelInfo = await response.json();
        return data;
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
  };
}

// ============================================================================
// Export default instance
// ============================================================================

/**
 * Default AgentAPI client instance
 * Uses NEXT_PUBLIC_AGENTAPI_URL from environment variables
 */
export const agentapi = new AgentAPIClient();
