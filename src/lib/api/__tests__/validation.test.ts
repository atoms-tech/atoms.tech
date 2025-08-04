import { z } from 'zod';
import { NextRequest } from 'next/server';

import {
    commonSchemas,
    validateRequest,
    validateQuery,
    validateParams,
    validateHeaders,
    validateFormData,
    validateFileUpload,
    sanitize,
    securitySchemas,
} from '@/lib/api/validation';
import { createApiError } from '@/lib/api/errors';

// Mock the errors module
jest.mock('@/lib/api/errors', () => ({
    createApiError: {
        validation: jest.fn((message, errors) => ({
            name: 'ValidationError',
            message,
            errors,
            status: 400,
        })),
        badRequest: jest.fn((message) => ({
            name: 'BadRequestError',
            message,
            status: 400,
        })),
    },
}));

describe('api/validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('commonSchemas', () => {
        describe('pagination', () => {
            it('should validate pagination parameters', () => {
                const result = commonSchemas.pagination.parse({
                    page: 2,
                    limit: 20,
                    cursor: 'abc123',
                });

                expect(result).toEqual({
                    page: 2,
                    limit: 20,
                    cursor: 'abc123',
                });
            });

            it('should apply default values', () => {
                const result = commonSchemas.pagination.parse({});

                expect(result).toEqual({
                    page: 1,
                    limit: 10,
                });
            });

            it('should coerce string numbers', () => {
                const result = commonSchemas.pagination.parse({
                    page: '3',
                    limit: '25',
                });

                expect(result).toEqual({
                    page: 3,
                    limit: 25,
                });
            });

            it('should reject invalid pagination values', () => {
                expect(() => {
                    commonSchemas.pagination.parse({ page: 0 });
                }).toThrow();

                expect(() => {
                    commonSchemas.pagination.parse({ limit: 101 });
                }).toThrow();
            });
        });

        describe('sorting', () => {
            it('should validate sorting parameters', () => {
                const result = commonSchemas.sorting.parse({
                    sortBy: 'createdAt',
                    sortOrder: 'asc',
                });

                expect(result).toEqual({
                    sortBy: 'createdAt',
                    sortOrder: 'asc',
                });
            });

            it('should apply default sort order', () => {
                const result = commonSchemas.sorting.parse({
                    sortBy: 'name',
                });

                expect(result).toEqual({
                    sortBy: 'name',
                    sortOrder: 'desc',
                });
            });

            it('should reject invalid sort order', () => {
                expect(() => {
                    commonSchemas.sorting.parse({ sortOrder: 'invalid' });
                }).toThrow();
            });
        });

        describe('uuid', () => {
            it('should validate valid UUID', () => {
                const validUuid = '123e4567-e89b-12d3-a456-426614174000';
                const result = commonSchemas.uuid.parse(validUuid);

                expect(result).toBe(validUuid);
            });

            it('should reject invalid UUID', () => {
                expect(() => {
                    commonSchemas.uuid.parse('invalid-uuid');
                }).toThrow();
            });
        });

        describe('mongoId', () => {
            it('should validate valid MongoDB ObjectId', () => {
                const validMongoId = '507f1f77bcf86cd799439011';
                const result = commonSchemas.mongoId.parse(validMongoId);

                expect(result).toBe(validMongoId);
            });

            it('should reject invalid MongoDB ObjectId', () => {
                expect(() => {
                    commonSchemas.mongoId.parse('invalid-mongo-id');
                }).toThrow();
            });
        });

        describe('email', () => {
            it('should validate and normalize email', () => {
                const result = commonSchemas.email.parse('USER@EXAMPLE.COM');

                expect(result).toBe('user@example.com');
            });

            it('should reject invalid email', () => {
                expect(() => {
                    commonSchemas.email.parse('invalid-email');
                }).toThrow();
            });
        });

        describe('password', () => {
            it('should validate strong password', () => {
                const strongPassword = 'StrongPass123';
                const result = commonSchemas.password.parse(strongPassword);

                expect(result).toBe(strongPassword);
            });

            it('should reject weak passwords', () => {
                expect(() => {
                    commonSchemas.password.parse('weak');
                }).toThrow();

                expect(() => {
                    commonSchemas.password.parse('nouppercase123');
                }).toThrow();

                expect(() => {
                    commonSchemas.password.parse('NOLOWERCASE123');
                }).toThrow();

                expect(() => {
                    commonSchemas.password.parse('NoNumbers');
                }).toThrow();
            });
        });

        describe('url', () => {
            it('should validate valid URL', () => {
                const validUrl = 'https://example.com/path';
                const result = commonSchemas.url.parse(validUrl);

                expect(result).toBe(validUrl);
            });

            it('should reject invalid URL', () => {
                expect(() => {
                    commonSchemas.url.parse('not-a-url');
                }).toThrow();
            });
        });

        describe('file', () => {
            it('should validate file object', () => {
                const fileObj = {
                    name: 'document.pdf',
                    size: 1024,
                    type: 'application/pdf',
                };

                const result = commonSchemas.file.parse(fileObj);

                expect(result).toEqual(fileObj);
            });

            it('should reject invalid file object', () => {
                expect(() => {
                    commonSchemas.file.parse({
                        name: '',
                        size: 1024,
                        type: 'application/pdf',
                    });
                }).toThrow();

                expect(() => {
                    commonSchemas.file.parse({
                        name: 'file.pdf',
                        size: -1,
                        type: 'application/pdf',
                    });
                }).toThrow();
            });
        });

        describe('dateString', () => {
            it('should validate ISO datetime string', () => {
                const dateString = '2023-01-01T00:00:00Z';
                const result = commonSchemas.dateString.parse(dateString);

                expect(result).toBe(dateString);
            });

            it('should reject invalid datetime string', () => {
                expect(() => {
                    commonSchemas.dateString.parse('invalid-date');
                }).toThrow();
            });
        });

        describe('search', () => {
            it('should validate search object', () => {
                const searchObj = {
                    q: 'test query',
                    filters: { type: 'document' },
                };

                const result = commonSchemas.search.parse(searchObj);

                expect(result).toEqual(searchObj);
            });

            it('should reject invalid search queries', () => {
                expect(() => {
                    commonSchemas.search.parse({ q: '' });
                }).toThrow();

                expect(() => {
                    commonSchemas.search.parse({ q: 'x'.repeat(501) });
                }).toThrow();
            });
        });
    });

    describe('validateRequest', () => {
        it('should validate request body successfully', async () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            });

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    name: 'John',
                    age: 30,
                }),
            } as any as NextRequest;

            const result = await validateRequest(mockRequest, schema);

            expect(result).toEqual({ name: 'John', age: 30 });
            expect(mockRequest.json).toHaveBeenCalled();
        });

        it('should handle validation errors', async () => {
            const schema = z.object({
                name: z.string(),
                age: z.number(),
            });

            const mockRequest = {
                json: jest.fn().mockResolvedValue({
                    name: 'John',
                    age: 'invalid',
                }),
            } as any as NextRequest;

            await expect(validateRequest(mockRequest, schema)).rejects.toMatchObject({
                name: 'ValidationError',
                message: 'Request validation failed',
            });

            expect(createApiError.validation).toHaveBeenCalled();
        });

        it('should handle JSON parsing errors', async () => {
            const schema = z.object({
                name: z.string(),
            });

            const mockRequest = {
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
            } as any as NextRequest;

            await expect(validateRequest(mockRequest, schema)).rejects.toMatchObject({
                name: 'BadRequestError',
                message: 'Invalid JSON in request body',
            });

            expect(createApiError.badRequest).toHaveBeenCalled();
        });
    });

    describe('validateQuery', () => {
        it('should validate query parameters successfully', () => {
            const schema = z.object({
                page: z.coerce.number(),
                search: z.string().optional(),
            });

            const mockRequest = {
                nextUrl: {
                    searchParams: new URLSearchParams('page=2&search=test'),
                },
            } as any as NextRequest;

            const result = validateQuery(mockRequest, schema);

            expect(result).toEqual({ page: 2, search: 'test' });
        });

        it('should handle validation errors', () => {
            const schema = z.object({
                page: z.coerce.number().min(1),
            });

            const mockRequest = {
                nextUrl: {
                    searchParams: new URLSearchParams('page=0'),
                },
            } as any as NextRequest;

            expect(() => validateQuery(mockRequest, schema)).toThrow();
            expect(createApiError.validation).toHaveBeenCalled();
        });

        it('should handle empty query parameters', () => {
            const schema = z.object({
                page: z.coerce.number().default(1),
            });

            const mockRequest = {
                nextUrl: {
                    searchParams: new URLSearchParams(''),
                },
            } as any as NextRequest;

            const result = validateQuery(mockRequest, schema);

            expect(result).toEqual({ page: 1 });
        });
    });

    describe('validateParams', () => {
        it('should validate path parameters successfully', () => {
            const schema = z.object({
                id: z.string().uuid(),
                slug: z.string(),
            });

            const params = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                slug: 'test-slug',
            };

            const result = validateParams(params, schema);

            expect(result).toEqual(params);
        });

        it('should handle validation errors', () => {
            const schema = z.object({
                id: z.string().uuid(),
            });

            const params = {
                id: 'invalid-uuid',
            };

            expect(() => validateParams(params, schema)).toThrow();
            expect(createApiError.validation).toHaveBeenCalled();
        });

        it('should handle array parameters', () => {
            const schema = z.object({
                tags: z.array(z.string()),
            });

            const params = {
                tags: ['tag1', 'tag2'],
            };

            const result = validateParams(params, schema);

            expect(result).toEqual(params);
        });
    });

    describe('validateHeaders', () => {
        it('should validate headers successfully', () => {
            const schema = z.object({
                'content-type': z.string(),
                authorization: z.string().optional(),
            });

            const mockRequest = {
                headers: new Headers({
                    'content-type': 'application/json',
                    authorization: 'Bearer token',
                }),
            } as any as NextRequest;

            const result = validateHeaders(mockRequest, schema);

            expect(result).toEqual({
                'content-type': 'application/json',
                authorization: 'Bearer token',
            });
        });

        it('should handle validation errors', () => {
            const schema = z.object({
                'content-type': z.literal('application/json'),
            });

            const mockRequest = {
                headers: new Headers({
                    'content-type': 'text/plain',
                }),
            } as any as NextRequest;

            expect(() => validateHeaders(mockRequest, schema)).toThrow();
            expect(createApiError.validation).toHaveBeenCalled();
        });
    });

    describe('validateFormData', () => {
        it('should validate form data successfully', async () => {
            const schema = z.object({
                name: z.string(),
                email: z.string().email(),
            });

            const formData = new FormData();
            formData.append('name', 'John Doe');
            formData.append('email', 'john@example.com');

            const mockRequest = {
                formData: jest.fn().mockResolvedValue(formData),
            } as any as NextRequest;

            const result = await validateFormData(mockRequest, schema);

            expect(result).toEqual({
                name: 'John Doe',
                email: 'john@example.com',
            });
        });

        it('should handle validation errors', async () => {
            const schema = z.object({
                email: z.string().email(),
            });

            const formData = new FormData();
            formData.append('email', 'invalid-email');

            const mockRequest = {
                formData: jest.fn().mockResolvedValue(formData),
            } as any as NextRequest;

            await expect(validateFormData(mockRequest, schema)).rejects.toMatchObject({
                name: 'ValidationError',
                message: 'Form data validation failed',
            });
        });

        it('should handle form data parsing errors', async () => {
            const schema = z.object({
                name: z.string(),
            });

            const mockRequest = {
                formData: jest.fn().mockRejectedValue(new Error('Invalid form data')),
            } as any as NextRequest;

            await expect(validateFormData(mockRequest, schema)).rejects.toMatchObject({
                name: 'BadRequestError',
                message: 'Invalid form data',
            });
        });
    });

    describe('validateFileUpload', () => {
        it('should validate file upload successfully', () => {
            const files = [
                new File(['content'], 'test.pdf', { type: 'application/pdf' }),
            ];

            expect(() => {
                validateFileUpload(files, {
                    maxFiles: 5,
                    maxSize: 10 * 1024 * 1024,
                    allowedTypes: ['application/pdf'],
                });
            }).not.toThrow();
        });

        it('should handle required files validation', () => {
            expect(() => {
                validateFileUpload([], { required: true });
            }).toThrow();

            expect(createApiError.validation).toHaveBeenCalledWith(
                'At least one file is required'
            );
        });

        it('should handle max files validation', () => {
            const files = [
                new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
                new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
            ];

            expect(() => {
                validateFileUpload(files, { maxFiles: 1 });
            }).toThrow();

            expect(createApiError.validation).toHaveBeenCalledWith(
                'Maximum 1 files allowed'
            );
        });

        it('should handle max size validation', () => {
            // Create a mock file with size property
            const largeFile = {
                name: 'large.pdf',
                size: 20 * 1024 * 1024, // 20MB
                type: 'application/pdf',
            } as File;

            expect(() => {
                validateFileUpload([largeFile], { maxSize: 10 * 1024 * 1024 });
            }).toThrow();

            expect(createApiError.validation).toHaveBeenCalledWith(
                'File "large.pdf" exceeds maximum size of 10MB'
            );
        });

        it('should handle allowed types validation', () => {
            const files = [
                new File(['content'], 'test.txt', { type: 'text/plain' }),
            ];

            expect(() => {
                validateFileUpload(files, {
                    allowedTypes: ['application/pdf', 'image/jpeg'],
                });
            }).toThrow();

            expect(createApiError.validation).toHaveBeenCalledWith(
                'File "test.txt" type "text/plain" is not allowed. Allowed types: application/pdf, image/jpeg'
            );
        });

        it('should use default options', () => {
            const files = [
                new File(['content'], 'test.pdf', { type: 'application/pdf' }),
            ];

            expect(() => {
                validateFileUpload(files);
            }).not.toThrow();
        });
    });

    describe('sanitize', () => {
        describe('html', () => {
            it('should remove script tags', () => {
                const input = '<div>Safe content</div><script>alert("xss")</script>';
                const result = sanitize.html(input);

                expect(result).toBe('<div>Safe content</div>');
            });

            it('should remove iframe tags', () => {
                const input = '<div>Safe content</div><iframe src="evil.com"></iframe>';
                const result = sanitize.html(input);

                expect(result).toBe('<div>Safe content</div>');
            });

            it('should remove javascript URLs', () => {
                const input = '<a href="javascript:alert(1)">Link</a>';
                const result = sanitize.html(input);

                expect(result).toBe('<a href="">Link</a>');
            });

            it('should remove event handlers', () => {
                const input = '<button onclick="alert(1)">Click</button>';
                const result = sanitize.html(input);

                expect(result).toBe('<button>Click</button>');
            });
        });

        describe('sql', () => {
            it('should remove SQL injection characters', () => {
                const input = "'; DROP TABLE users; --";
                const result = sanitize.sql(input);

                expect(result).toBe(' DROP TABLE users --');
            });

            it('should handle normal text', () => {
                const input = 'Normal text without SQL';
                const result = sanitize.sql(input);

                expect(result).toBe('Normal text without SQL');
            });
        });

        describe('xss', () => {
            it('should escape HTML entities', () => {
                const input = '<script>alert("xss")</script>';
                const result = sanitize.xss(input);

                expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
            });

            it('should escape all dangerous characters', () => {
                const input = '&<>"\'';
                const result = sanitize.xss(input);

                expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;');
            });
        });

        describe('filename', () => {
            it('should sanitize filename', () => {
                const input = 'my file<>:"/\\|?*.txt';
                const result = sanitize.filename(input);

                expect(result).toBe('my_file__________.txt');
            });

            it('should preserve valid characters', () => {
                const input = 'valid-file_name.123.txt';
                const result = sanitize.filename(input);

                expect(result).toBe('valid-file_name.123.txt');
            });
        });
    });

    describe('securitySchemas', () => {
        describe('safeString', () => {
            it('should validate safe strings', () => {
                const result = securitySchemas.safeString.parse('Safe string 123-_.test');

                expect(result).toBe('Safe string 123-_.test');
            });

            it('should reject unsafe strings', () => {
                expect(() => {
                    securitySchemas.safeString.parse('Unsafe<script>string');
                }).toThrow();
            });
        });

        describe('alphanumeric', () => {
            it('should validate alphanumeric strings', () => {
                const result = securitySchemas.alphanumeric.parse('test123');

                expect(result).toBe('test123');
            });

            it('should reject non-alphanumeric strings', () => {
                expect(() => {
                    securitySchemas.alphanumeric.parse('test-123');
                }).toThrow();
            });
        });

        describe('noScript', () => {
            it('should validate strings without scripts', () => {
                const result = securitySchemas.noScript.parse('Safe content');

                expect(result).toBe('Safe content');
            });

            it('should reject strings with script tags', () => {
                expect(() => {
                    securitySchemas.noScript.parse('<script>alert(1)</script>');
                }).toThrow();
            });

            it('should reject strings with javascript URLs', () => {
                expect(() => {
                    securitySchemas.noScript.parse('javascript:alert(1)');
                }).toThrow();
            });
        });

        describe('noSqlInjection', () => {
            it('should validate safe strings', () => {
                const result = securitySchemas.noSqlInjection.parse('Safe query');

                expect(result).toBe('Safe query');
            });

            it('should reject strings with SQL injection patterns', () => {
                expect(() => {
                    securitySchemas.noSqlInjection.parse("'; DROP TABLE users; --");
                }).toThrow();
            });
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            expect(() => {
                commonSchemas.email.parse('');
            }).toThrow();
        });

        it('should handle null values', () => {
            expect(() => {
                commonSchemas.uuid.parse(null);
            }).toThrow();
        });

        it('should handle undefined values', () => {
            expect(() => {
                commonSchemas.uuid.parse(undefined);
            }).toThrow();
        });

        it('should handle very long strings', () => {
            const longString = 'a'.repeat(10000);
            const result = securitySchemas.safeString.parse(longString);

            expect(result).toBe(longString);
        });

        it('should handle unicode characters', () => {
            const unicodeString = 'Hello 世界 🌍';
            const result = sanitize.xss(unicodeString);

            expect(result).toBe('Hello 世界 🌍');
        });

        it('should handle file with zero size', () => {
            const zeroSizeFile = {
                name: 'empty.txt',
                size: 0,
                type: 'text/plain',
            } as File;

            expect(() => {
                validateFileUpload([zeroSizeFile]);
            }).toThrow();
        });
    });
});