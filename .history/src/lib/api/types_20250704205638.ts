import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Standard API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
        stack?: string;
    };
    meta?: {
        timestamp: string;
        requestId: string;
        version: string;
        rateLimit?: {
            remaining: number;
            reset: number;
            limit: number;
        };
    };
}

// API Error types
export interface ApiError {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}

// Rate limiting configuration
export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: NextRequest) => string;
}

// Request context for enhanced logging and tracking
export interface RequestContext {
    requestId: string;
    timestamp: string;
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
    organizationId?: string;
}

// Validation schema types
export interface ValidationOptions {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
    headers?: z.ZodSchema;
}

// Enhanced API route handler type
export type EnhancedApiHandler<T = any> = (
    request: NextRequest,
    context: RequestContext,
    validatedData?: {
        body?: any;
        query?: any;
        params?: any;
        headers?: any;
    },
) => Promise<NextResponse<ApiResponse<T>>>;

// Middleware options
export interface MiddlewareOptions {
    rateLimit?: RateLimitConfig;
    validation?: ValidationOptions;
    requireAuth?: boolean;
    requireOrg?: boolean;
    cors?: {
        origin?: string | string[];
        methods?: string[];
        allowedHeaders?: string[];
    };
    cache?: {
        ttl: number;
        key?: (request: NextRequest) => string;
    };
}

// Performance monitoring types
export interface PerformanceMetrics {
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    dbQueries?: number;
    externalApiCalls?: number;
}

// API Analytics data
export interface ApiAnalytics {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
    userId?: string;
    organizationId?: string;
    userAgent?: string;
    ip?: string;
    error?: string;
}
