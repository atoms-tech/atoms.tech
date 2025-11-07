import type { ComponentType, PropsWithChildren } from 'react';

declare module '@trpc/client' {
  export function httpBatchLink(config: Record<string, unknown>): unknown;
}

declare module '@trpc/react-query' {
  type TRPCClientOptions = Record<string, unknown>;

  type TRPCReactProviderProps<_TRouter = unknown> = PropsWithChildren<{
    client: unknown;
    queryClient?: unknown;
  }>;

    interface TRPCReactInstance<_TRouter = unknown> {
      Provider: ComponentType<TRPCReactProviderProps<_TRouter>>;
    createClient: (options: TRPCClientOptions) => unknown;
    useContext: () => unknown;
  }

    export function createTRPCReact<_TRouter = unknown>(): TRPCReactInstance<_TRouter>;
}

declare module 'superjson' {
  const superjson: unknown;
  export default superjson;
}

declare module '@/server/trpc/router' {
  export type AppRouter = unknown;
}
