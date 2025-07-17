import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ApiError, ApiResponse, RequestContext } from './types';

// Standard API Error codes
export const API_ERROR_CODES = {
    // Client errors (4xx)
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',

    // Server errors (5xx)
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

// Custom API Error class
export class ApiErrorClass extends Error implements ApiError {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(code: string, message: string, statusCode: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}

// Error factory functions
export const createApiError = {
    badRequest: (message = 'Bad request', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.BAD_REQUEST, message, 400, details),

    unauthorized: (message = 'Unauthorized access', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.UNAUTHORIZED, message, 401, details),

    forbidden: (message = 'Forbidden', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.FORBIDDEN, message, 403, details),

    notFound: (message = 'Resource not found', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.NOT_FOUND, message, 404, details),

    methodNotAllowed: (message = 'Method not allowed', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.METHOD_NOT_ALLOWED, message, 405, details),

    validation: (message = 'Validation failed', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.VALIDATION_ERROR, message, 422, details),

    rateLimit: (message = 'Rate limit exceeded', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, message, 429, details),

    payloadTooLarge: (message = 'Payload too large', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.PAYLOAD_TOO_LARGE, message, 413, details),

    internal: (message = 'Internal server error', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.INTERNAL_SERVER_ERROR, message, 500, details),

    serviceUnavailable: (message = 'Service unavailable', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.SERVICE_UNAVAILABLE, message, 503, details),

    gatewayTimeout: (message = 'Gateway timeout', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.GATEWAY_TIMEOUT, message, 504, details),

    database: (message = 'Database error', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.DATABASE_ERROR, message, 500, details),

    externalApi: (message = 'External API error', details?: unknown) =>
        new ApiErrorClass(API_ERROR_CODES.EXTERNAL_API_ERROR, message, 500, details),
};

// Enhanced error handler
export function handleApiError(
    error: unknown,
    context: RequestContext,
    includeStack = false,
): NextResponse<ApiResponse> {
    console.error(`[API Error] ${context.requestId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context,
    });

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const response: ApiResponse = {
            success: false,
            error: {
                code: API_ERROR_CODES.VALIDATION_ERROR,
                message: 'Validation failed',
                details: error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                })),
                ...(includeStack && { stack: error.stack }),
            },
            meta: {
                timestamp: context.timestamp,
                requestId: context.requestId,
                version: '1.0',
            },
        };
        return NextResponse.json(response, { status: 422 });
    }

    // Handle custom API errors
    if (error instanceof ApiErrorClass) {
        const response: ApiResponse = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                ...(includeStack && { stack: error.stack }),
            },
            meta: {
                timestamp: context.timestamp,
                requestId: context.requestId,
                version: '1.0',
            },
        };
        return NextResponse.json(response, { status: error.statusCode });
    }

    // Handle standard errors
    if (error instanceof Error) {
        const isProduction = process.env.NODE_ENV === 'production';
        const response: ApiResponse = {
            success: false,
            error: {
                code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
                message: isProduction ? 'Internal server error' : error.message,
                ...((!isProduction || includeStack) && {
                    details: error.cause,
                    stack: error.stack,
                }),
            },
            meta: {
                timestamp: context.timestamp,
                requestId: context.requestId,
                version: '1.0',
            },
        };
        return NextResponse.json(response, { status: 500 });
    }

    // Handle unknown errors
    const response: ApiResponse = {
        success: false,
        error: {
            code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: 'An unknown error occurred',
            details: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
        },
        meta: {
            timestamp: context.timestamp,
            requestId: context.requestId,
            version: '1.0',
        },
    };
    return NextResponse.json(response, { status: 500 });
}

// Success response helper
export function createSuccessResponse<T>(
    data: T,
    context: RequestContext,
    status = 200,
    meta?: unknown,
): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            timestamp: context.timestamp,
            requestId: context.requestId,
            version: '1.0',
            ...(meta && typeof meta === 'object' ? meta : {}),
        },
    };
    return NextResponse.json(response, { status });
}
