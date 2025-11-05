/**
 * atomsAgent Provider for AI SDK 6
 * 
 * Wraps atomsAgent's OpenAI-compatible API with AI SDK 6
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Create atomsAgent provider
// Use absolute URL to avoid "Invalid URL" errors
export const atomsAgent = createOpenAICompatible({
    name: 'atomsagent',
    baseURL: typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/api/agentapi-proxy/v1`
        : 'http://localhost:3000/api/agentapi-proxy/v1',
    includeUsage: true,
    // No API key - handled by proxy with JWT
});

// Type-safe model IDs - Vertex AI Claude models only
export type AtomsChatModelId =
    | 'claude-sonnet-4-5@20250929'        // Primary model (200K context)
    | 'claude-sonnet-4-5@20250929-1m'     // 1M context window (beta)
    | 'claude-haiku-4-5@20251001'         // Small/fast model
    | (string & Record<never, never>);

/**
 * Helper to create chat models with type safety
 */
export const atomsChatModel = (modelId: AtomsChatModelId) =>
    atomsAgent.chatModel(modelId);

/**
 * Default model for the application (Vertex AI Claude Sonnet 4.5)
 */
export const DEFAULT_MODEL: AtomsChatModelId = 'claude-sonnet-4-5@20250929';

