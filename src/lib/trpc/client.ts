import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

import type { AppRouter } from '@/server/trpc/router';

// Create tRPC React client
export const trpc = createTRPCReact<AppRouter>();

export const getTRPCClient = () => {
    return trpc.createClient({
        transformer: superjson,
        links: [
            httpBatchLink({
                url: '/api/trpc',
            }),
        ],
    });
};
