'use client';

import { AuthError } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60, // 1 minute
                        gcTime: 1000 * 60 * 5, // 5 minutes
                        // Adds error handling to refresh the session on 401 responses.
                        retry: (failureCount, error: unknown) => {
                            // Check if it's a JWT expiration error (PGRST301)
                            if (
                                (error as Error)?.message?.includes('PGRST301') ||
                                (error as Error)?.message?.includes('JWT expired')
                            ) {
                                // Retry once to allow token refresh
                                return failureCount < 1;
                            }
                            // Don't retry other auth errors
                            // End of first error handling change
                            if (error instanceof AuthError) return false;
                            return failureCount < 3;
                        },
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        // Beginning of second error handling change
                        retry: (failureCount, error: unknown) => {
                            // Check if it's a JWT expiration error (PGRST301)
                            if (
                                (error as Error)?.message?.includes('PGRST301') ||
                                (error as Error)?.message?.includes('JWT expired')
                            ) {
                                // Retry once to allow token refresh
                                return failureCount < 1;
                            }
                            return false;
                        },
                        // End of second error handling change
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </QueryClientProvider>
    );
}
