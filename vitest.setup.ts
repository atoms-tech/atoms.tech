import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_AGENTAPI_URL = 'http://localhost:3284';
process.env.NEXT_PUBLIC_GUMLOOP_API_URL = 'https://api.gumloop.com/api/v1';
process.env.NEXT_PUBLIC_GUMLOOP_API_KEY = 'test-gumloop-key';
process.env.NEXT_PUBLIC_GUMLOOP_USER_ID = 'test-user-id';
process.env.NEXT_PUBLIC_CHUNKR_API_URL = 'https://api.chunkr.ai/api/v1';
process.env.NEXT_PUBLIC_CHUNKR_API_KEY = 'test-chunkr-key';
process.env.WORKOS_CLIENT_ID = 'test-workos-client-id';
process.env.WORKOS_API_KEY = 'test-workos-api-key';
process.env.WORKOS_REDIRECT_URI = 'http://localhost:3000/auth/callback';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(() => []),
        has: vi.fn(),
    })),
    headers: vi.fn(() => ({
        get: vi.fn(),
        has: vi.fn(),
        entries: vi.fn(() => []),
    })),
}));

// Mock WorkOS AuthKit
vi.mock('@workos-inc/authkit-nextjs', () => ({
    getSignInUrl: vi.fn(() => Promise.resolve('http://localhost:3000/auth/signin')),
    getSignUpUrl: vi.fn(() => Promise.resolve('http://localhost:3000/auth/signup')),
    signOut: vi.fn(() => Promise.resolve()),
    getUser: vi.fn(() =>
        Promise.resolve({
            user: {
                id: 'test-user-id',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
            },
            sessionId: 'test-session-id',
            accessToken: 'test-access-token',
        }),
    ),
    withAuth: vi.fn((handler) => handler),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Helper to mock successful fetch responses
export const mockFetchSuccess = (data: unknown) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => data,
        text: async () => JSON.stringify(data),
        headers: new Headers(),
    });
};

// Helper to mock failed fetch responses
export const mockFetchError = (status: number, message: string) => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status,
        statusText: message,
        json: async () => ({ error: message }),
        text: async () => message,
        headers: new Headers(),
    });
};

// Reset all mocks after each test
afterEach(() => {
    vi.clearAllMocks();
});

