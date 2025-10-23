import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

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

/**
 * Hook to get authenticated Supabase client with WorkOS token
 *
 * This allows Supabase Row-Level Security (RLS) to work with WorkOS-authenticated users.
 * Call this hook in a client component after WorkOS authentication is confirmed.
 */
export function useSupabaseAuth() {
    const [isReady, setIsReady] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const getAuthenticatedClient = useCallback(() => {
        if (!accessToken) return null;
        return createSupabaseClientWithToken(accessToken);
    }, [accessToken]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Get WorkOS session info from API
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const sessionData = await response.json();
                    if (sessionData.accessToken) {
                        setAccessToken(sessionData.accessToken);
                        setIsReady(true);
                    } else {
                        console.log('useSupabaseAuth: No access token in session');
                        setIsReady(false);
                    }
                } else {
                    console.log('useSupabaseAuth: No active WorkOS session');
                    setIsReady(false);
                }
            } catch (error) {
                console.error('useSupabaseAuth: Error initializing auth:', error);
                setIsReady(false);
            }
        };

        initializeAuth();
    }, []);

    return {
        isReady,
        accessToken,
        getAuthenticatedClient,
    };
}
