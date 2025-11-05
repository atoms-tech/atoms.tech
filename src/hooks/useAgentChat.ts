/**
 * useAgentChat Hook
 *
 * A React hook for managing chat conversations with the AgentAPI.
 * Handles message state, streaming responses, model selection, and error handling.
 *
 * @module useAgentChat
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AgentAPIClient,
  Message,
  StreamChunk,
  ModelInfo,
  ChatCompletionRequest,
} from '@/lib/api/agentapi';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for useAgentChat hook
 */
export interface UseAgentChatConfig {
  /**
   * AgentAPI client instance
   */
  client: AgentAPIClient;

  /**
   * Initial model to use
   */
  initialModel?: string;

  /**
   * Initial system message
   */
  systemMessage?: string;

  /**
   * Default temperature (0-2)
   */
  temperature?: number;

  /**
   * Maximum tokens for completion
   */
  maxTokens?: number;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Chat message with metadata
 */
export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
  isStreaming?: boolean;
}

/**
 * Return type for useAgentChat hook
 */
export interface UseAgentChatReturn {
  /**
   * Current conversation messages
   */
  messages: ChatMessage[];

  /**
   * Currently selected model
   */
  currentModel: string | null;

  /**
   * Available models
   */
  availableModels: ModelInfo[];

  /**
   * Whether a request is in progress
   */
  isLoading: boolean;

  /**
   * Whether models are being loaded
   */
  isLoadingModels: boolean;

  /**
   * Current error, if any
   */
  error: Error | null;

  /**
   * Send a message and get a response
   */
  sendMessage: (content: string, options?: Partial<ChatCompletionRequest>) => Promise<void>;

  /**
   * Select a different model
   */
  selectModel: (modelId: string) => void;

  /**
   * Clear all messages
   */
  clearMessages: () => void;

  /**
   * Retry the last failed message
   */
  retry: () => Promise<void>;

  /**
   * Cancel the current streaming request
   */
  cancel: () => void;

  /**
   * Fetch available models
   */
  getAvailableModels: () => Promise<void>;

  /**
   * Set system message
   */
  setSystemMessage: (message: string) => void;

  /**
   * Replace current messages (used for history restore or branching)
   */
  replaceMessages: (messages: ChatMessage[]) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log debug information if debug mode is enabled
 */
function debugLog(debug: boolean, ...args: unknown[]): void {
  if (debug) {
    console.log('[useAgentChat]', ...args);
  }
}

// ============================================================================
// useAgentChat Hook
// ============================================================================

/**
 * Hook for managing agent chat conversations
 *
 * @param config - Configuration options
 * @returns Chat state and methods
 *
 * @example
 * ```typescript
 * const {
 *   messages,
 *   isLoading,
 *   sendMessage,
 *   clearMessages,
 * } = useAgentChat({
 *   client: agentAPIClient,
 *   initialModel: 'gpt-4',
 *   systemMessage: 'You are a helpful assistant.',
 * });
 *
 * // Send a message
 * await sendMessage('Hello!');
 *
 * // Clear conversation
 * clearMessages();
 * ```
 */
export function useAgentChat(config: UseAgentChatConfig): UseAgentChatReturn {
  const {
    client,
    initialModel = null,
    systemMessage: initialSystemMessage = '',
    temperature = 0.7,
    maxTokens,
    onError,
    debug = false,
  } = config;

  // ============================================================================
  // State
  // ============================================================================

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(initialModel);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [systemMessage, setSystemMessage] = useState(initialSystemMessage);

  // Refs for managing streaming state
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string | null>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Load available models on mount
   */
  useEffect(() => {
    getAvailableModels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Add system message if provided
   */
  useEffect(() => {
    if (systemMessage && messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'system',
        content: systemMessage,
        timestamp: Date.now(),
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemMessage]);

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Fetch available models from the API
   */
  const getAvailableModels = useCallback(async () => {
    setIsLoadingModels(true);
    setError(null);

    try {
      debugLog(debug, 'Fetching available models...');
      const response = await client.models.list();
      setAvailableModels(response.data);
      debugLog(debug, `Loaded ${response.data.length} models`);

      // Set initial model if not set
      if (!currentModel && response.data.length > 0) {
        setCurrentModel(response.data[0].id);
        debugLog(debug, `Auto-selected model: ${response.data[0].id}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      debugLog(debug, 'Failed to load models:', error);
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [client, currentModel, debug, onError]);

  /**
   * Select a different model
   */
  const selectModel = useCallback((modelId: string) => {
    debugLog(debug, `Selecting model: ${modelId}`);
    setCurrentModel(modelId);
    setError(null);
  }, [debug]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    debugLog(debug, 'Clearing messages');
    setMessages(systemMessage ? [{
      id: generateMessageId(),
      role: 'system',
      content: systemMessage,
      timestamp: Date.now(),
    }] : []);
    setError(null);
    lastUserMessageRef.current = '';
  }, [debug, systemMessage]);

  /**
   * Cancel the current streaming request
   */
  const cancel = useCallback(() => {
    debugLog(debug, 'Cancelling request');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, [debug]);

  /**
   * Replace current messages with provided list.
   * Useful for restoring chat history or branching edits.
   */
  const replaceMessages = useCallback((nextMessages: ChatMessage[]) => {
    cancel();
    setMessages(nextMessages);

    const lastUser = [...nextMessages]
      .reverse()
      .find((msg) => msg.role === 'user');

    lastUserMessageRef.current = lastUser?.content ?? '';
    setError(null);
  }, [cancel]);

  /**
   * Send a message and get a streaming response
   */
  const sendMessage = useCallback(async (
    content: string,
    options: Partial<ChatCompletionRequest> = {}
  ) => {
    if (!currentModel) {
      const error = new Error('No model selected');
      setError(error);
      if (onError) onError(error);
      return;
    }

    if (!content.trim()) {
      const error = new Error('Message content cannot be empty');
      setError(error);
      if (onError) onError(error);
      return;
    }

    // Cancel any existing request
    cancel();

    setIsLoading(true);
    setError(null);
    lastUserMessageRef.current = content;

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    debugLog(debug, 'User message:', content);

    // Prepare messages for API (exclude streaming placeholder)
    const apiMessages: Message[] = messages
      .filter(m => !m.isStreaming)
      .concat(userMessage)
      .map(({ role, content, name }) => ({ role, content, name }));

    // Create assistant message placeholder
    const assistantMessageId = generateMessageId();
    streamingMessageIdRef.current = assistantMessageId;

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      debugLog(debug, 'Sending request to model:', currentModel);

      await client.chat.create(
        {
          model: currentModel,
          messages: apiMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          ...options,
        },
        {
          signal: abortControllerRef.current.signal,
          onChunk: (chunk: StreamChunk) => {
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              debugLog(debug, 'Received chunk:', delta.content);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + delta.content }
                    : msg
                )
              );
            }
          },
          onComplete: () => {
            debugLog(debug, 'Stream completed');
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            setIsLoading(false);
            streamingMessageIdRef.current = null;
          },
          onError: (err: Error) => {
            debugLog(debug, 'Stream error:', err);

            // Remove the placeholder message on error
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));

            setError(err);
            setIsLoading(false);
            streamingMessageIdRef.current = null;

            if (onError) onError(err);
          },
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      debugLog(debug, 'Request error:', error);

      // Remove the placeholder message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));

      setError(error);
      setIsLoading(false);
      streamingMessageIdRef.current = null;

      if (onError) onError(error);
    }
  }, [
    currentModel,
    messages,
    temperature,
    maxTokens,
    client,
    debug,
    onError,
    cancel,
  ]);

  /**
   * Retry the last failed message
   */
  const retry = useCallback(async () => {
    if (lastUserMessageRef.current) {
      debugLog(debug, 'Retrying last message');
      await sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage, debug]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    messages,
    currentModel,
    availableModels,
    isLoading,
    isLoadingModels,
    error,
    sendMessage,
    selectModel,
    clearMessages,
    retry,
    cancel,
    getAvailableModels,
    setSystemMessage,
    replaceMessages,
  };
}
