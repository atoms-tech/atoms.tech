// src/lib/constants/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// Creates a singleton QueryClient per request context
export const getQueryClient = cache(
    () =>
        new QueryClient({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000, // 1 minute
                    gcTime: 5 * 60 * 1000, // 5 minutes
                },
            },
        }),
);
