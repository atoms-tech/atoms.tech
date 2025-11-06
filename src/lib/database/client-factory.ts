/**
 * Supabase Client Factory
 *
 * Centralized client creation for all Supabase operations.
 * Replaces 4 separate client files with a single source of truth.
 *
 * Authentication is handled by WorkOS AuthKit.
 * Supabase is used for data access only.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { Database } from '@/types/base/database.types';

import {
    generateTokenKey,
    getSupabaseConfig,
    getSupabaseServiceRoleConfig,
    isServer,
} from './utils';

// ============================================================================
// Browser Clients (Client-Side)
// ============================================================================

/**
 * Global browser client singleton
 * Used for unauthenticated client-side operations
 */
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Get or create the browser Supabase client
 * Configured for data access only with WorkOS authentication
 *
 * @returns Supabase client for browser use
 */
export function getBrowserClient(): SupabaseClient<Database> {
    if (browserClient) {
        return browserClient;
    }

    const { url, key } = getSupabaseConfig();

    browserClient = createClient<Database>(url, key, {
        auth: {
            // Disable Supabase Auth - using WorkOS AuthKit instead
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'atoms-workos-browser',
        },
    });

    return browserClient;
}

/**
 * Create a browser client with WorkOS token for authenticated requests
 * Use this when you have a WorkOS access token on the client side
 *
 * @param token - WorkOS access token
 * @returns Supabase client configured with the token
 */
export function createBrowserClientWithToken(token: string): SupabaseClient<Database> {
    const { url, key } = getSupabaseConfig();
    const tokenKey = generateTokenKey(token);

    return createClient<Database>(url, key, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            storageKey: `atoms-workos-browser-token-${tokenKey}`,
        },
    });
}

// ============================================================================
// Server Clients (Server-Side)
// ============================================================================

/**
 * Create a server client with cookie-based session management
 * Use this in Server Components and API routes
 *
 * @returns Supabase client for server use with cookies
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
    // Try to use service role client first if available
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
        return serviceClient;
    }

    const cookieStore = await cookies();
    const { url, key } = getSupabaseConfig();

    return createSupabaseServerClient<Database>(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
        },
    });
}

/**
 * Create a server client with WorkOS token
 * Use this in API routes where you have access to the WorkOS session token
 *
 * @param token - WorkOS access token
 * @returns Supabase client configured with the token
 */
export function createServerClientWithToken(token: string): SupabaseClient<Database> {
    const { url, key } = getSupabaseConfig();
    const tokenKey = generateTokenKey(token);

    return createClient<Database>(url, key, {
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

// ============================================================================
// Service Role Client (Admin Operations)
// ============================================================================

/**
 * Global service role client singleton
 * Used for privileged server-side operations
 */
let serviceRoleClient: SupabaseClient<Database> | null = null;

/**
 * Get or create the service role client
 * This client bypasses RLS and should only be used on the server for admin operations
 *
 * @throws {Error} If called from the browser
 * @returns Service role client or null if not configured
 */
export function getServiceRoleClient(): SupabaseClient<Database> | null {
    if (!isServer()) {
        throw new Error('Service role client can only be used on the server');
    }

    if (serviceRoleClient) {
        return serviceRoleClient;
    }

    const config = getSupabaseServiceRoleConfig();
    if (!config) {
        console.warn('Service role credentials not configured');
        return null;
    }

    serviceRoleClient = createClient<Database>(config.url, config.key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return serviceRoleClient;
}

