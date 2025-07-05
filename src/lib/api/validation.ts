import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiError } from './errors';

// Common validation schemas
export const commonSchemas = {
    // Pagination
    pagination: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
    }),

    // Sorting
    sorting: z.object({
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),

    // Common IDs
    uuid: z.string().uuid('Invalid UUID format'),
    mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    
    // Email validation
    email: z.string().email('Invalid email address').toLowerCase(),
    
    // Password validation
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
               'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    // URL validation
    url: z.string().url('Invalid URL format'),
    
    // File validation
    file: z.object({
        name: z.string().min(1, 'Filename is required'),
        size: z.number().positive('File size must be positive'),
        type: z.string().min(1, 'File type is required'),
    }),
    
    // Date validation
    dateString: z.string().datetime('Invalid datetime format'),
    
    // Search query
    search: z.object({
        q: z.string().min(1, 'Search query is required').max(500, 'Search query too long'),
        filters: z.record(z.any()).optional(),
    }),
};

// Request validation utility
export async function validateRequest<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): Promise<T> {
    try {
        const body = await request.json();
        return schema.parse(body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw createApiError.validation('Request validation failed', error.errors);
        }
        throw createApiError.badRequest('Invalid JSON in request body');
    }
}

// Query parameters validation
export function validateQuery<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): T {
    try {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        return schema.parse(searchParams);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw createApiError.validation('Query parameters validation failed', error.errors);
        }
        throw createApiError.badRequest('Invalid query parameters');
    }
}

// Path parameters validation
export function validateParams<T>(
    params: Record<string, string | string[]>,
    schema: z.ZodSchema<T>
): T {
    try {
        return schema.parse(params);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw createApiError.validation('Path parameters validation failed', error.errors);
        }
        throw createApiError.badRequest('Invalid path parameters');
    }
}

// Headers validation
export function validateHeaders<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): T {
    try {
        const headers = Object.fromEntries(request.headers.entries());
        return schema.parse(headers);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw createApiError.validation('Headers validation failed', error.errors);
        }
        throw createApiError.badRequest('Invalid headers');
    }
}

// Form data validation
export async function validateFormData<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): Promise<T> {
    try {
        const formData = await request.formData();
        const data = Object.fromEntries(formData.entries());
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw createApiError.validation('Form data validation failed', error.errors);
        }
        throw createApiError.badRequest('Invalid form data');
    }
}

// File upload validation
export function validateFileUpload(
    files: File[],
    options?: {
        maxFiles?: number;
        maxSize?: number; // in bytes
        allowedTypes?: string[];
        required?: boolean;
    }
): void {
    const {
        maxFiles = 10,
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = [],
        required = false,
    } = options || {};

    if (required && files.length === 0) {
        throw createApiError.validation('At least one file is required');
    }

    if (files.length > maxFiles) {
        throw createApiError.validation(`Maximum ${maxFiles} files allowed`);
    }

    for (const file of files) {
        if (file.size > maxSize) {
            throw createApiError.validation(
                `File "${file.name}" exceeds maximum size of ${maxSize / (1024 * 1024)}MB`
            );
        }

        if (allowedTypes.length > 0 && !allowedTypes.some(type => file.type.includes(type))) {
            throw createApiError.validation(
                `File "${file.name}" type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
            );
        }
    }
}

// Sanitization utilities
export const sanitize = {
    html: (input: string): string => {
        // Basic HTML sanitization - in production, use a proper library like DOMPurify
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },
    
    sql: (input: string): string => {
        // Basic SQL injection prevention
        return input.replace(/[';\\]/g, '');
    },
    
    xss: (input: string): string => {
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    },
    
    filename: (input: string): string => {
        return input.replace(/[^a-zA-Z0-9.-]/g, '_');
    },
};

// Security validation schemas
export const securitySchemas = {
    // Safe string (no special characters that could be used for injection)
    safeString: z.string().regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Contains invalid characters'),
    
    // Alphanumeric only
    alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Must contain only letters and numbers'),
    
    // No script tags or javascript
    noScript: z.string().refine(
        (val) => !/<script|javascript:/i.test(val),
        'Script content not allowed'
    ),
    
    // SQL injection prevention
    noSqlInjection: z.string().refine(
        (val) => !/[';\\]/g.test(val),
        'Invalid characters detected'
    ),
};