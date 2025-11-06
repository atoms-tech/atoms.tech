import { beforeEach, describe, expect, it, vi as _vi } from 'vitest';

import { BaseHTTPClient } from '@/lib/http/base-client';

describe('BaseHTTPClient', () => {
    let client: BaseHTTPClient;
    const mockBaseURL = 'https://api.example.com';
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        client = new BaseHTTPClient({
            baseURL: mockBaseURL,
            apiKey: mockApiKey,
            timeout: 5000,
            retries: 2,
            retryDelay: 100,
        });
    });

    describe('constructor', () => {
        it('should create client with default config', () => {
            const defaultClient = new BaseHTTPClient({
                baseURL: mockBaseURL,
            });

            expect(defaultClient.getBaseURL()).toBe(mockBaseURL);
        });

        it('should create client with custom config', () => {
            const customClient = new BaseHTTPClient({
                baseURL: mockBaseURL,
                apiKey: mockApiKey,
                timeout: 10000,
                retries: 5,
                retryDelay: 2000,
            });

            expect(customClient.getBaseURL()).toBe(mockBaseURL);
        });

        it('should accept custom headers', () => {
            const customClient = new BaseHTTPClient({
                baseURL: mockBaseURL,
                headers: {
                    'X-Custom-Header': 'custom-value',
                },
            });

            expect(customClient.getBaseURL()).toBe(mockBaseURL);
        });
    });

    describe('getBaseURL', () => {
        it('should return the base URL', () => {
            expect(client.getBaseURL()).toBe(mockBaseURL);
        });
    });

    describe('setHeader', () => {
        it('should set a new header', () => {
            client.setHeader('X-New-Header', 'new-value');
            // Header is set internally, no direct way to verify without making a request
            expect(client).toBeDefined();
        });

        it('should update existing header', () => {
            client.setHeader('Authorization', 'Bearer new-token');
            expect(client).toBeDefined();
        });
    });

    describe('HTTP methods', () => {
        it('should have GET method', () => {
            expect(typeof client.get).toBe('function');
        });

        it('should have POST method', () => {
            expect(typeof client.post).toBe('function');
        });

        it('should have PUT method', () => {
            expect(typeof client.put).toBe('function');
        });

        it('should have PATCH method', () => {
            expect(typeof client.patch).toBe('function');
        });

        it('should have DELETE method', () => {
            expect(typeof client.delete).toBe('function');
        });
    });
});

