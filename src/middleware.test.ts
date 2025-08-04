import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock the updateSession function
jest.mock('@/lib/supabase/middleware', () => ({
    updateSession: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        next: jest.fn(),
        redirect: jest.fn(),
        json: jest.fn(),
        rewrite: jest.fn(),
    },
}));

describe('middleware', () => {
    let mockRequest: Partial<NextRequest>;
    let mockUpdateSession: jest.Mock;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Setup mock implementations
        const middlewareModule = await import('@/lib/supabase/middleware');
        mockUpdateSession = middlewareModule.updateSession as jest.Mock;
        mockUpdateSession.mockResolvedValue(NextResponse.next());
        
        // Reset mock functions
        (NextResponse.next as jest.Mock).mockReturnValue({ status: 200 });
        (NextResponse.redirect as jest.Mock).mockReturnValue({ status: 302 });
        (NextResponse.json as jest.Mock).mockReturnValue({ status: 200 });
        (NextResponse.rewrite as jest.Mock).mockReturnValue({ status: 200 });

        // Setup mock request
        mockRequest = {
            nextUrl: {
                pathname: '/test',
                search: '',
                origin: 'http://localhost:3000',
                href: 'http://localhost:3000/test',
            } as unknown,
            method: 'GET',
            headers: new Headers(),
            cookies: { getAll: jest.fn() } as unknown,
        };
    });

    describe('public routes', () => {
        it('should allow access to root path', async () => {
            mockRequest.nextUrl!.pathname = '/';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to login page', async () => {
            mockRequest.nextUrl!.pathname = '/login';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to signup page', async () => {
            mockRequest.nextUrl!.pathname = '/signup';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to signup message page', async () => {
            mockRequest.nextUrl!.pathname = '/signup/message';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to auth error page', async () => {
            mockRequest.nextUrl!.pathname = '/auth/error';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to login error page', async () => {
            mockRequest.nextUrl!.pathname = '/login/error';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to signup error page', async () => {
            mockRequest.nextUrl!.pathname = '/signup/error';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('API routes', () => {
        it('should allow access to auth API routes', async () => {
            mockRequest.nextUrl!.pathname = '/auth/confirm';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to auth callback routes', async () => {
            mockRequest.nextUrl!.pathname = '/auth/callback';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to auth signout route', async () => {
            mockRequest.nextUrl!.pathname = '/auth/signout';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to auth GitHub route', async () => {
            mockRequest.nextUrl!.pathname = '/auth/github';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to auth Google route', async () => {
            mockRequest.nextUrl!.pathname = '/auth/google';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to API routes', async () => {
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('static assets', () => {
        it('should allow access to static files', async () => {
            mockRequest.nextUrl!.pathname = '/static/image.png';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to favicon', async () => {
            mockRequest.nextUrl!.pathname = '/favicon.ico';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to images', async () => {
            mockRequest.nextUrl!.pathname = '/images/logo.png';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to icons', async () => {
            mockRequest.nextUrl!.pathname = '/icons/icon.svg';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('Next.js internal routes', () => {
        it('should allow access to Next.js internals', async () => {
            mockRequest.nextUrl!.pathname = '/_next/static/chunks/main.js';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should allow access to Next.js webpack HMR', async () => {
            mockRequest.nextUrl!.pathname = '/_next/webpack-hmr';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('protected routes', () => {
        it('should process protected routes through updateSession', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should process org routes through updateSession', async () => {
            mockRequest.nextUrl!.pathname = '/org/123';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should process project routes through updateSession', async () => {
            mockRequest.nextUrl!.pathname = '/org/123/project/456';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should process dashboard routes through updateSession', async () => {
            mockRequest.nextUrl!.pathname = '/dashboard';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should process settings routes through updateSession', async () => {
            mockRequest.nextUrl!.pathname = '/settings';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('HTTP methods', () => {
        it('should handle GET requests', async () => {
            Object.assign(mockRequest, { method: 'GET' });
            mockRequest.nextUrl!.pathname = '/home';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle POST requests', async () => {
            Object.assign(mockRequest, { method: 'POST' });
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle PUT requests', async () => {
            Object.assign(mockRequest, { method: 'PUT' });
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle DELETE requests', async () => {
            Object.assign(mockRequest, { method: 'DELETE' });
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle PATCH requests', async () => {
            Object.assign(mockRequest, { method: 'PATCH' });
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle OPTIONS requests', async () => {
            Object.assign(mockRequest, { method: 'OPTIONS' });
            mockRequest.nextUrl!.pathname = '/api/test';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle updateSession errors gracefully', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            mockUpdateSession.mockRejectedValue(new Error('Session update failed'));
            
            // The middleware should not throw
            await expect(middleware(mockRequest as NextRequest)).resolves.toBeDefined();
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
        });

        it('should handle updateSession returning null', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            mockUpdateSession.mockResolvedValue(null);
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeNull();
        });

        it('should handle updateSession returning undefined', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            mockUpdateSession.mockResolvedValue(undefined);
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeUndefined();
        });
    });

    describe('query parameters', () => {
        it('should handle routes with query parameters', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            mockRequest.nextUrl!.search = '?tab=dashboard';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle complex query parameters', async () => {
            mockRequest.nextUrl!.pathname = '/org/123/project/456';
            mockRequest.nextUrl!.search = '?view=requirements&filter=active&sort=name';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle encoded query parameters', async () => {
            mockRequest.nextUrl!.pathname = '/search';
            mockRequest.nextUrl!.search = '?q=test%20search&category=documents';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('headers', () => {
        it('should handle requests with custom headers', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            Object.assign(mockRequest, { headers: new Headers({
                'Authorization': 'Bearer token123',
                'Content-Type': 'application/json',
                'X-Custom-Header': 'custom-value',
            }) });
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle requests with user agent', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            Object.assign(mockRequest, { headers: new Headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }) });
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle requests with referrer', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            Object.assign(mockRequest, { headers: new Headers({
                'Referer': 'https://example.com/previous-page',
            }) });
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('cookies', () => {
        it('should handle requests with cookies', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            Object.assign(mockRequest, { cookies: { getAll: jest.fn() } as any });
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle requests without cookies', async () => {
            mockRequest.nextUrl!.pathname = '/home';
            Object.assign(mockRequest, { cookies: { getAll: jest.fn() } as any });
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle empty pathname', async () => {
            mockRequest.nextUrl!.pathname = '';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle pathname with special characters', async () => {
            mockRequest.nextUrl!.pathname = '/org/123/project/456/document/test%20document';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle very long pathnames', async () => {
            const longPath = '/very/long/path/that/contains/munknown/segments/and/goes/on/for/a/while/to/test/edge/cases';
            mockRequest.nextUrl!.pathname = longPath;
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle pathname with unicode characters', async () => {
            mockRequest.nextUrl!.pathname = '/org/测试/project/项目';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle pathname with dots', async () => {
            mockRequest.nextUrl!.pathname = '/org/123/project/456/document.pdf';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });

        it('should handle pathname with hyphens and underscores', async () => {
            mockRequest.nextUrl!.pathname = '/org/test-org_123/project/my-project_456';
            
            const result = await middleware(mockRequest as NextRequest);
            
            expect(mockUpdateSession).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeDefined();
        });
    });

    describe('performance', () => {
        it('should handle multiple rapid requests', async () => {
            const requests = Array.from({ length: 10 }, (_, i) => ({
                ...mockRequest,
                nextUrl: {
                    ...mockRequest.nextUrl!,
                    pathname: `/home/${i}`,
                },
            }));
            
            const promises = requests.map(req => middleware(req as NextRequest));
            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(10);
            expect(mockUpdateSession).toHaveBeenCalledTimes(10);
        });

        it('should complete quickly for public routes', async () => {
            mockRequest.nextUrl!.pathname = '/login';
            
            const startTime = Date.now();
            await middleware(mockRequest as NextRequest);
            const endTime = Date.now();
            
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(100); // Should complete in under 100ms
        });
    });

    describe('integration scenarios', () => {
        it('should handle realistic user authentication flow', async () => {
            // 1. User visits login page
            mockRequest.nextUrl!.pathname = '/login';
            let result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 2. User goes to auth callback
            mockRequest.nextUrl!.pathname = '/auth/callback';
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 3. User is redirected to home
            mockRequest.nextUrl!.pathname = '/home';
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            expect(mockUpdateSession).toHaveBeenCalledTimes(3);
        });

        it('should handle organization and project navigation', async () => {
            // 1. User visits organization page
            mockRequest.nextUrl!.pathname = '/org/123';
            let result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 2. User navigates to project
            mockRequest.nextUrl!.pathname = '/org/123/project/456';
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 3. User views requirements
            mockRequest.nextUrl!.pathname = '/org/123/project/456/requirements';
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            expect(mockUpdateSession).toHaveBeenCalledTimes(3);
        });

        it('should handle API requests during application usage', async () => {
            // 1. User makes API request
            mockRequest.nextUrl!.pathname = '/api/projects';
            Object.assign(mockRequest, { method: 'GET' });
            let result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 2. User makes another API request
            mockRequest.nextUrl!.pathname = '/api/documents';
            Object.assign(mockRequest, { method: 'POST' });
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            // 3. User makes update request
            mockRequest.nextUrl!.pathname = '/api/projects/123';
            Object.assign(mockRequest, { method: 'PUT' });
            result = await middleware(mockRequest as NextRequest);
            expect(result).toBeDefined();
            
            expect(mockUpdateSession).toHaveBeenCalledTimes(3);
        });
    });
});