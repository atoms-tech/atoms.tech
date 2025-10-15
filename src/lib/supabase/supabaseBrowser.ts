import { createBrowserClient } from '@supabase/ssr';

import { Database } from '@/types/base/database.types';

const isDevelopment = process.env.NODE_ENV === 'development';
const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

// Global fetch interceptor for development auth bypass
if (typeof window !== 'undefined' && isDevelopment && bypassAuth) {
    const originalFetch = window.fetch;

    // Also suppress console errors from Supabase auth
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const message = args[0]?.toString() || '';
        // Suppress all Supabase auth-related errors in dev bypass mode
        if (message.includes('AuthRetryableFetchError') ||
            message.includes('AuthSessionMissingError') ||
            message.includes('AuthError') ||
            message.includes('Auth session missing') ||
            message.includes('Service Unavailable (Dev Bypass)') ||
            message.includes('auth/v1/')) {
            // Silently ignore auth errors in dev bypass mode
            return;
        }
        originalConsoleError.apply(console, args);
    };

    window.fetch = function (...args) {
        const url = args[0]?.toString() || '';
        // Block all auth token refresh requests in development (silently)
        if (url.includes('/auth/v1/token') || url.includes('/auth/v1/user')) {
            // Return a mock successful empty response to prevent retries
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ user: null, session: null }),
                text: async () => JSON.stringify({ user: null, session: null }),
                headers: new Headers(),
            } as Response);
        }
        return originalFetch.apply(this, args);
    };
}

export const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            // In dev setting auth bypass
            autoRefreshToken: !(isDevelopment && bypassAuth),
            persistSession: !(isDevelopment && bypassAuth),
            detectSessionInUrl: !(isDevelopment && bypassAuth),
        },
    },
);
