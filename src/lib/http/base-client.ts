/**
 * Base HTTP Client
 *
 * Centralized HTTP client using ofetch with:
 * - Automatic retries with exponential backoff
 * - Timeout handling
 * - Consistent error handling
 * - Request/response logging
 * - Type-safe responses
 */

import { $fetch, type FetchOptions, type FetchResponse } from 'ofetch';

// ============================================================================
// Types
// ============================================================================

export interface BaseClientConfig {
    baseURL: string;
    apiKey?: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
    onRequest?: (url: string, options: FetchOptions) => void | Promise<void>;
    onResponse?: <T>(response: FetchResponse<T>) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
}

export interface RequestConfig extends Omit<FetchOptions, 'baseURL' | 'headers'> {
    headers?: Record<string, string>;
}

// ============================================================================
// Base HTTP Client
// ============================================================================

export class BaseHTTPClient {
    protected client: typeof $fetch;
    protected config: BaseClientConfig;

    constructor(config: BaseClientConfig) {
        this.config = config;

        this.client = $fetch.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000, // 30 seconds default
            retry: config.retries ?? 3,
            retryDelay: config.retryDelay || 1000, // 1 second default

            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey && { Authorization: config.apiKey }),
                ...config.headers,
            },

            async onRequest(ctx) {
                await config.onRequest?.(ctx.request, ctx.options);
            },

            async onResponse(ctx) {
                await config.onResponse?.(ctx.response);
            },

            async onResponseError(ctx) {
                const error = new Error(
                    `HTTP ${ctx.response.status}: ${ctx.response.statusText}`,
                );
                await config.onError?.(error);
                throw error;
            },

            async onRequestError(ctx) {
                const error = new Error(`Request failed: ${ctx.error.message}`);
                await config.onError?.(error);
                throw error;
            },
        });
    }

    /**
     * GET request
     */
    async get<T = unknown>(url: string, options?: RequestConfig): Promise<T> {
        return this.client<T>(url, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T = unknown>(
        url: string,
        body?: unknown,
        options?: RequestConfig,
    ): Promise<T> {
        return this.client<T>(url, {
            ...options,
            method: 'POST',
            body,
        });
    }

    /**
     * PUT request
     */
    async put<T = unknown>(url: string, body?: unknown, options?: RequestConfig): Promise<T> {
        return this.client<T>(url, {
            ...options,
            method: 'PUT',
            body,
        });
    }

    /**
     * PATCH request
     */
    async patch<T = unknown>(
        url: string,
        body?: unknown,
        options?: RequestConfig,
    ): Promise<T> {
        return this.client<T>(url, {
            ...options,
            method: 'PATCH',
            body,
        });
    }

    /**
     * DELETE request
     */
    async delete<T = unknown>(url: string, options?: RequestConfig): Promise<T> {
        return this.client<T>(url, {
            ...options,
            method: 'DELETE',
        });
    }

    /**
     * Get the base URL
     */
    getBaseURL(): string {
        return this.config.baseURL;
    }

    /**
     * Update headers
     */
    setHeader(key: string, value: string): void {
        this.config.headers = {
            ...this.config.headers,
            [key]: value,
        };
    }
}

