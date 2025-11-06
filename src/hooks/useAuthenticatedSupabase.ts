import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

/* eslint-disable react-hooks/exhaustive-deps */

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
    atomsWorkosRefreshPromise?: Promise<string | null> | null;
    atomsWorkosLastRefreshTs?: number | null;
};

export function useAuthenticatedSupabase() {
    const [supabase, setSupabase] = useState<ReturnType<
        typeof createClient<Database>
    > | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<ReturnType<typeof createClient<Database>> | null>(null);
    const tokenRef = useRef<string | null>(null);

    // Keep a timer to refresh the token shortly before expiry
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Try to decode JWT exp; fallback to null if not a JWT
    const getTokenExpiryMs = useCallback((token: string): number | null => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(
                base64.length + ((4 - (base64.length % 4)) % 4),
                '=',
            );
            const json =
                typeof window !== 'undefined'
                    ? atob(padded)
                    : Buffer.from(padded, 'base64').toString('utf-8');
            const payload = JSON.parse(json) as { exp?: number };
            if (!payload?.exp) return null;
            return payload.exp * 1000;
        } catch {
            return null;
        }
    }, []);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const scheduleRefresh = useCallback(
        (token: string) => {
            clearRefreshTimer();
            const expiryMs = getTokenExpiryMs(token);
            // Refresh 60s before expiry if we can parse it; otherwise every 4 minutes
            const now = Date.now();
            const leadMs = 60 * 1000;
            const intervalMs =
                expiryMs && expiryMs > now + leadMs
                    ? Math.max(15_000, expiryMs - now - leadMs)
                    : 4 * 60 * 1000;
            refreshTimerRef.current = setTimeout(() => {
                void refreshSession();
            }, intervalMs);
        },
        [clearRefreshTimer, getTokenExpiryMs],
    );

    const refreshSession = useCallback(async () => {
        // Dedupe refresh calls and rate-limit to prevent loops
        const now = Date.now();
        const last = globalForWorkOS.atomsWorkosLastRefreshTs ?? 0;
        if (now - last < 1000 && globalForWorkOS.atomsWorkosRefreshPromise) {
            return globalForWorkOS.atomsWorkosRefreshPromise;
        }

        if (globalForWorkOS.atomsWorkosRefreshPromise) {
            return globalForWorkOS.atomsWorkosRefreshPromise;
        }

        globalForWorkOS.atomsWorkosRefreshPromise = (async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error('Failed to refresh session');
                }
                const sessionData = (await response.json()) as {
                    accessToken?: string | null;
                } | null;
                const newToken = sessionData?.accessToken ?? null;
                if (!newToken) throw new Error('No access token in refreshed session');

                // Update token refs and realtime auth without recreating the client
                globalForWorkOS.atomsWorkosAccessToken = newToken;
                tokenRef.current = newToken;

                if (clientRef.current) {
                    try {
                        // Keep realtime channels alive with the new token (best-effort)
                        const clientAny = clientRef.current as unknown as {
                            realtime?: { setAuth?: (t: string) => void };
                        };
                        clientAny.realtime?.setAuth?.(newToken);
                    } catch {
                        // no-op if realtime not available
                    }
                }

                scheduleRefresh(newToken);
                globalForWorkOS.atomsWorkosLastRefreshTs = Date.now();
                return newToken;
            } catch {
                return null;
            } finally {
                // Allow future refreshes
                globalForWorkOS.atomsWorkosRefreshPromise = null;
            }
        })();

        return globalForWorkOS.atomsWorkosRefreshPromise;
    }, [scheduleRefresh]);

    const createAuthenticatedClient = useCallback(async () => {
        try {
            // Dedupe session fetches across hooks
            // If we already have a valid token that is not near expiry, skip hitting /api/auth/session
            const existingToken =
                tokenRef.current || globalForWorkOS.atomsWorkosAccessToken || null;
            const expMs = existingToken ? getTokenExpiryMs(existingToken) : null;
            const needsSessionFetch =
                !existingToken || (expMs !== null && expMs - Date.now() < 90_000);

            if (needsSessionFetch && !globalForWorkOS.atomsWorkosSessionPromise) {
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

            const session = needsSessionFetch
                ? await globalForWorkOS.atomsWorkosSessionPromise
                : { accessToken: existingToken as string };
            if (!session) throw new Error('No active WorkOS session');

            // Reuse existing client; we will update Authorization dynamically per request
            if (globalForWorkOS.atomsWorkosSupabaseClient) {
                clientRef.current = globalForWorkOS.atomsWorkosSupabaseClient;
                tokenRef.current = session.accessToken;
                globalForWorkOS.atomsWorkosAccessToken = session.accessToken;
                setSupabase(globalForWorkOS.atomsWorkosSupabaseClient);
                setError(null);
                scheduleRefresh(session.accessToken);
                return;
            }

            // Dedupe client creation if multiple hooks race here
            if (!globalForWorkOS.atomsWorkosClientPromise) {
                globalForWorkOS.atomsWorkosClientPromise = (async () => {
                    const tokenKey =
                        session.accessToken.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) ||
                        'token';

                    // Custom fetch wrapper to attach latest token and retry once on 401/403
                    const customFetch: typeof fetch = async (input, init) => {
                        const newInit: RequestInit = { ...init };
                        const headers = new Headers(init?.headers || {});
                        let activeToken =
                            tokenRef.current || globalForWorkOS.atomsWorkosAccessToken;

                        // Preemptive refresh if token is missing/near expiry (<30s)
                        const expMs = activeToken ? getTokenExpiryMs(activeToken) : null;
                        if (
                            !activeToken ||
                            (expMs !== null && expMs - Date.now() < 30_000)
                        ) {
                            const refreshed = await refreshSession();
                            if (refreshed) activeToken = refreshed;
                        }

                        if (activeToken)
                            headers.set('Authorization', `Bearer ${activeToken}`);
                        newInit.headers = headers;

                        let response = await fetch(input as RequestInfo, newInit);
                        if (response.status === 401 || response.status === 403) {
                            const refreshed = await refreshSession();
                            if (refreshed) {
                                const retryHeaders = new Headers(newInit.headers || {});
                                retryHeaders.set('Authorization', `Bearer ${refreshed}`);
                                const retryInit: RequestInit = {
                                    ...newInit,
                                    headers: retryHeaders,
                                };
                                response = await fetch(input as RequestInfo, retryInit);
                            }
                        }
                        return response;
                    };

                    const authenticatedClient = createClient<Database>(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        {
                            global: {
                                // Set an initial header; custom fetch will override with latest token
                                headers: {
                                    Authorization: `Bearer ${session.accessToken}`,
                                },
                                fetch: customFetch,
                            },
                            auth: {
                                // We do not use Supabase Auth; WorkOS provides tokens
                                autoRefreshToken: false,
                                persistSession: false,
                                storageKey: `atoms-workos-auth-${tokenKey}`,
                            },
                        },
                    );

                    // Set realtime auth for initial token (best-effort)
                    try {
                        const clientAny = authenticatedClient as unknown as {
                            realtime?: { setAuth?: (t: string) => void };
                        };
                        clientAny.realtime?.setAuth?.(session.accessToken);
                    } catch {
                        // no-op
                    }

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
            scheduleRefresh(session.accessToken);
        } catch (err) {
            console.error('Error creating authenticated Supabase client:', err);
            setError(err instanceof Error ? err.message : 'Failed to authenticate');
            setSupabase(null);
            clientRef.current = null;
            tokenRef.current = null;
        } finally {
            setIsLoading(false);
        }
    }, [scheduleRefresh, refreshSession]);

    useEffect(() => {
        createAuthenticatedClient();
        return () => {
            // Clean up timer on unmount
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
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
