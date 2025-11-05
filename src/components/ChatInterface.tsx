/**
 * ChatInterface Component
 *
 * A comprehensive React component for chat interactions with AgentAPI.
 * Features real-time streaming, model selection, error handling, and auto-scroll.
 *
 * @module ChatInterface
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentAPIClient } from '@/lib/api/agentapi';
import type { ChatMessage } from '@/hooks/useAgentChat';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for ChatInterface component
 */
export interface ChatInterfaceProps {
  /**
   * AgentAPI client instance
   */
  client: AgentAPIClient;

  /**
   * Initial model to use
   */
  initialModel?: string;

  /**
   * System message for the conversation
   */
  systemMessage?: string;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Show model selector
   */
  showModelSelector?: boolean;

  /**
   * Placeholder text for input
   */
  placeholder?: string;

  /**
   * Maximum height for chat container
   */
  maxHeight?: string;

  /**
   * Enable debug mode
   */
  debug?: boolean;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Message bubble component
 */
interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="max-w-2xl px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <span className="font-semibold">System:</span> {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-purple-500 text-white'
        }`}>
          {isUser ? 'U' : 'A'}
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-2xl ${
            isUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}>
            <p className="whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </p>
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading indicator component
 */
const LoadingIndicator: React.FC = () => (
  <div className="flex justify-start mb-4">
    <div className="flex gap-3 max-w-3xl">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-purple-500 text-white">
        A
      </div>
      <div className="px-4 py-2 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Error display component
 */
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onDismiss }) => (
  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
          Error
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400">
          {error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * Chat interface component for interacting with AgentAPI
 *
 * @example
 * ```tsx
 * import { AgentAPIClient } from '@/lib/api/agentapi';
 * import { ChatInterface } from '@/components/ChatInterface';
 *
 * const client = new AgentAPIClient({
 *   getToken: async () => await authKit.getToken(),
 * });
 *
 * export default function ChatPage() {
 *   return (
 *     <ChatInterface
 *       client={client}
 *       initialModel="gpt-4"
 *       systemMessage="You are a helpful assistant."
 *       showModelSelector={true}
 *     />
 *   );
 * }
 * ```
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  client,
  initialModel,
  systemMessage,
  className = '',
  showModelSelector = true,
  placeholder = 'Type your message...',
  maxHeight = '600px',
  debug = false,
}) => {
  // ============================================================================
  // Hooks
  // ============================================================================

  const {
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
    getAvailableModels,
  } = useAgentChat({
    client,
    initialModel,
    systemMessage,
    debug,
  });

  // ============================================================================
  // Local State
  // ============================================================================

  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Focus input on mount
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Show error when it changes
   */
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');

    await sendMessage(message);
  };

  /**
   * Handle textarea key press (submit on Enter, new line on Shift+Enter)
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Handle retry button click
   */
  const handleRetry = async () => {
    setShowError(false);
    await retry();
  };

  /**
   * Handle error dismiss
   */
  const handleDismissError = () => {
    setShowError(false);
  };

  /**
   * Handle model change
   */
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectModel(e.target.value);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Agent Chat
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Model Selector */}
          {showModelSelector && (
            <div className="flex items-center gap-2">
              <label htmlFor="model-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Model:
              </label>
              <select
                id="model-select"
                value={currentModel || ''}
                onChange={handleModelChange}
                disabled={isLoadingModels || isLoading}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingModels ? (
                  <option>Loading models...</option>
                ) : availableModels.length === 0 ? (
                  <option>No models available</option>
                ) : (
                  availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.id}
                    </option>
                  ))
                )}
              </select>

              <button
                onClick={getAvailableModels}
                disabled={isLoadingModels}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh models"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {/* Clear Button */}
          <button
            onClick={clearMessages}
            disabled={isLoading || messages.length <= 1}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        style={{ maxHeight }}
      >
        {/* Error Display */}
        {error && showError && (
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}

        {/* Messages */}
        {messages.filter(m => m.role !== 'system' || debug).map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Loading Indicator */}
        {isLoading && !messages.some(m => m.isStreaming) && <LoadingIndicator />}

        {/* Empty State */}
        {messages.filter(m => m.role !== 'system').length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send a message to begin chatting with the AI assistant.
              </p>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || !currentModel}
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || !currentModel}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>

        {!currentModel && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Please select a model to start chatting.
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
