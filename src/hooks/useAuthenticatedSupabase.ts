import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Database } from '@/types/base/database.types';

/**
 * Hook to get authenticated Supabase client with WorkOS token
 *
 * This hook fetches the WorkOS session and creates a Supabase client
 * with the proper authorization header for RLS policies.
 */
export function useAuthenticatedSupabase() {
    const [supabase, setSupabase] = useState<ReturnType<
        typeof createClient<Database>
    > | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<ReturnType<typeof createClient<Database>> | null>(null);
    const tokenRef = useRef<string | null>(null);

    const createAuthenticatedClient = useCallback(async () => {
        try {
            // Get WorkOS session info from API
            const response = await fetch('/api/auth/session', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('No active WorkOS session');
            }

            const sessionData = await response.json();

            if (!sessionData.accessToken) {
                throw new Error('No access token in session');
            }

            if (tokenRef.current === sessionData.accessToken && clientRef.current) {
                setSupabase(clientRef.current);
                setError(null);
                return;
            }

            // Create Supabase client with WorkOS token
            const tokenKey =
                sessionData.accessToken.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) ||
                'token';

            const authenticatedClient = createClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${sessionData.accessToken}`,
                        },
                    },
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false,
                        storageKey: `atoms-workos-auth-${tokenKey}`,
                    },
                },
            );

            setSupabase(authenticatedClient);
            clientRef.current = authenticatedClient;
            tokenRef.current = sessionData.accessToken;
            setError(null);
        } catch (err) {
            console.error('Error creating authenticated Supabase client:', err);
            setError(err instanceof Error ? err.message : 'Failed to authenticate');
            setSupabase(null);
            clientRef.current = null;
            tokenRef.current = null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        createAuthenticatedClient();
    }, [createAuthenticatedClient]);

    const getClientOrThrow = useCallback(() => {
        if (isLoading) {
            throw new Error('Supabase client is still initializing');
        }

        if (!supabase) {
            throw new Error(error ?? 'Supabase client not available');
        }

        return supabase;
    }, [error, isLoading, supabase]);

    return {
        supabase,
        isLoading,
        error,
        refetch: createAuthenticatedClient,
        getClientOrThrow,
    };
}
