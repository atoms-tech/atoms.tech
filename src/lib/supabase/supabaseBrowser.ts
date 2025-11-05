import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

/**
 * Supabase Browser Client (Data Only with WorkOS Auth)
 *
 * Configured for data access only.
 * Authentication is handled exclusively by WorkOS AuthKit.
 * WorkOS access tokens are used for Supabase API requests via RLS.
 */
const globalForSupabase = globalThis as unknown as {
    browserSupabaseClient?: SupabaseClient<Database>;
};

export const supabase =
    globalForSupabase.browserSupabaseClient ??
    (globalForSupabase.browserSupabaseClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Disable Supabase Auth - using WorkOS AuthKit instead
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                storageKey: 'atoms-workos-browser',
            },
        },
    ));

/**
 * Create Supabase client with WorkOS token for authenticated requests
 *
 * This function is server-safe and can be used in both client and server components.
 * For React hooks, use useSupabaseAuth from './useSupabaseAuth'
 */
export function createSupabaseClientWithToken(token: string) {
    const tokenKey = token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'token';

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
        },
    );
}
