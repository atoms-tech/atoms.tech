'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-expect-error - @trpc/client may not be installed
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
// @ts-expect-error - superjson may not be installed
import superjson from 'superjson';

import { trpc } from '@/lib/trpc/client';

const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return `http://localhost:${process.env.PORT ?? 3000}`;
};

export function TRPCProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    transformer: superjson,
                    fetch(url: string, options?: RequestInit) {
                        return fetch(url, {
                            ...options,
                            credentials: 'include', // Include cookies for authentication
                        });
                    },
                }),
            ],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}
