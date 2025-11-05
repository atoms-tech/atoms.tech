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

// Type-safe model IDs from atomsAgent
export type AtomsChatModelId =
    | 'claude-3-5-sonnet-20241022'
    | 'claude-3-5-haiku-20241022'
    | 'claude-3-opus-20240229'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'gpt-4-turbo'
    | 'gpt-3.5-turbo'
    | (string & Record<never, never>);

/**
 * Helper to create chat models with type safety
 */
export const atomsChatModel = (modelId: AtomsChatModelId) =>
    atomsAgent.chatModel(modelId);

/**
 * Default model for the application
 */
export const DEFAULT_MODEL: AtomsChatModelId = 'claude-3-5-sonnet-20241022';

