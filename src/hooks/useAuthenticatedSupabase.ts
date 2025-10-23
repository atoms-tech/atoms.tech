import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Database } from '@/types/base/database.types';

/**
 * Hook to get authenticated Supabase client with WorkOS token
 *
 * This hook fetches the WorkOS session and creates a Supabase client
 * with the proper authorization header for RLS policies.
 */
// Global cache to dedupe session fetches and reuse a single Supabase client per token
const globalForWorkOS = globalThis as unknown as {
    atomsWorkosAccessToken?: string | null;
    atomsWorkosSupabaseClient?: ReturnType<typeof createClient<Database>> | null;
    atomsWorkosSessionPromise?: Promise<{ accessToken: string } | null> | null;
    atomsWorkosClientPromise?: Promise<ReturnType<
        typeof createClient<Database>
    > | null> | null;
};

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
            // Dedupe session fetches across hooks
            if (!globalForWorkOS.atomsWorkosSessionPromise) {
                globalForWorkOS.atomsWorkosSessionPromise = (async () => {
                    const response = await fetch('/api/auth/session', {
                        credentials: 'include',
                    });
                    if (!response.ok) return null;
                    const sessionData = await response.json();
                    if (!sessionData?.accessToken) return null;
                    return { accessToken: sessionData.accessToken as string };
                })().finally(() => {
                    // allow future refreshes if needed
                    globalForWorkOS.atomsWorkosSessionPromise = null;
                });
            }

            const session = await globalForWorkOS.atomsWorkosSessionPromise;
            if (!session) throw new Error('No active WorkOS session');

            // Reuse existing client for the same token
            if (
                globalForWorkOS.atomsWorkosSupabaseClient &&
                globalForWorkOS.atomsWorkosAccessToken === session.accessToken
            ) {
                clientRef.current = globalForWorkOS.atomsWorkosSupabaseClient;
                tokenRef.current = session.accessToken;
                setSupabase(globalForWorkOS.atomsWorkosSupabaseClient);
                setError(null);
                return;
            }

            // Dedupe client creation if multiple hooks race here
            if (!globalForWorkOS.atomsWorkosClientPromise) {
                globalForWorkOS.atomsWorkosClientPromise = (async () => {
                    const tokenKey =
                        session.accessToken.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) ||
                        'token';

                    const authenticatedClient = createClient<Database>(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        {
                            global: {
                                headers: {
                                    Authorization: `Bearer ${session.accessToken}`,
                                },
                            },
                            auth: {
                                autoRefreshToken: false,
                                persistSession: false,
                                storageKey: `atoms-workos-auth-${tokenKey}`,
                            },
                        },
                    );
                    globalForWorkOS.atomsWorkosSupabaseClient = authenticatedClient;
                    globalForWorkOS.atomsWorkosAccessToken = session.accessToken;
                    return authenticatedClient;
                })().finally(() => {
                    globalForWorkOS.atomsWorkosClientPromise = null;
                });
            }

            const client = await globalForWorkOS.atomsWorkosClientPromise;
            if (!client) throw new Error('Failed to initialize Supabase client');
            clientRef.current = client;
            tokenRef.current = session.accessToken;
            setSupabase(client);
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
