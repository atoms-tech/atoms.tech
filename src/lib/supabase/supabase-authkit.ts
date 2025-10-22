import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

/**
 * Supabase client configured to work with WorkOS as third-party auth provider
 *
 * This follows the official WorkOS + Supabase integration guide:
 * https://supabase.com/docs/guides/auth/third-party/workos
 */

const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;
const _WORKOS_AUTH_DOMAIN = process.env.WORKOS_AUTH_DOMAIN || 'api.workos.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate environment variables at runtime, not during build
// Skip validation during build time or when environment variables are not available
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                   process.env.NODE_ENV !== 'production' ||
                   !process.env.WORKOS_CLIENT_ID;

if (typeof window === 'undefined' && !isBuildTime) {
    if (!WORKOS_CLIENT_ID) {
        throw new Error('WORKOS_CLIENT_ID is not set');
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key are not set');
    }
}

// Provide fallback values for build time
const safeSupabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const safeSupabaseKey = SUPABASE_KEY || 'placeholder-key';

/**
 * Create Supabase client with WorkOS configuration
 *
 * This client is configured to work with WorkOS as a third-party auth provider.
 * Supabase will automatically validate WorkOS tokens using the issuer URL.
 */
const globalForSupabase = globalThis as unknown as {
    supabaseAuthKitClient?: SupabaseClient<Database>;
    supabasePublicClient?: SupabaseClient<Database>;
};

export const supabaseAuthKit =
    globalForSupabase.supabaseAuthKitClient ??
    (globalForSupabase.supabaseAuthKitClient = createClient(
        safeSupabaseUrl,
        safeSupabaseKey,
        {
            global: {
                headers: {
                    // Supabase will use the Authorization header for authentication
                    // The token comes from WorkOS AuthKit session
                },
            },
            auth: {
                // Use the issuer URL format for WorkOS
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storageKey: 'atoms-workos-authkit',
            },
        },
    ));

/**
 * Get Supabase client with WorkOS token
 *
 * Use this in server components or API routes where you have
 * access to the WorkOS session token
 */
export function createSupabaseClientWithToken(token: string) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key are not set');
    }

    const tokenKey = token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'token';

    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: `atoms-workos-token-${tokenKey}`,
        },
    });
}

/**
 * Create Supabase client for client-side use with WorkOS token
 *
 * Use this in client components where you have access to the WorkOS token
 */
export function createSupabaseClientWithTokenClient(token: string) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('Supabase URL and key are not set');
    }

    const tokenKey = token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'token';

    return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: `atoms-workos-client-token-${tokenKey}`,
        },
    });
}

/**
 * Default Supabase client (without auth)
 * Use this for public operations or when you don't have a token
 */
export const supabase =
    globalForSupabase.supabasePublicClient ??
    (globalForSupabase.supabasePublicClient = createClient(
        safeSupabaseUrl,
        safeSupabaseKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                storageKey: 'atoms-workos-public',
            },
        },
    ));
