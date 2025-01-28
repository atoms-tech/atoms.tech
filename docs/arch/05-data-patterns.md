# Data Access Patterns and API Architecture

## Core Architecture Decisions

### Direct Supabase Access vs API Routes

#### Use Direct Supabase Client for:

1. **Real-time Subscriptions**

    ```typescript
    // Client component
    const useRealtimeDocument = (documentId: string) => {
        const supabase = useSupabaseClient();

        useEffect(() => {
            const channel = supabase
                .channel(`document:${documentId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'documents',
                        filter: `id=eq.${documentId}`,
                    },
                    (payload) => {
                        // Handle real-time updates
                    },
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [documentId]);
    };
    ```

2. **Simple CRUD Operations**

    ```typescript
    // Client-side hooks
    const useProfile = (userId: string) => {
        return useQuery({
            queryKey: ['profile', userId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                if (error) throw error;
                return data;
            },
        });
    };
    ```

3. **User Authentication State**
    ```typescript
    // Client component
    const useAuthState = () => {
        const supabase = useSupabaseClient();
        return useQuery({
            queryKey: ['auth'],
            queryFn: async () => {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();
                return session;
            },
        });
    };
    ```

#### Use API Routes for:

1. **Complex Data Operations**

    ```typescript
    // app/api/documents/[id]/requirements/route.ts
    export async function GET(
        request: Request,
        { params }: { params: { id: string } },
    ) {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        // Complex joins and filtering
        const query = supabase
            .from('requirements')
            .select(
                `
          *,
          blocks (id, type),
          documents (id, name)
        `,
            )
            .eq('document_id', params.id);

        if (status) query.eq('status', status);
        if (priority) query.eq('priority', priority);

        const { data, error } = await query;
        if (error) return Response.json({ error }, { status: 500 });
        return Response.json(data);
    }
    ```

2. **Data Aggregation**

    ```typescript
    // app/api/organizations/[id]/stats/route.ts
    export async function GET(
        request: Request,
        { params }: { params: { id: string } },
    ) {
        const stats = await Promise.all([
            fetchDocumentCount(params.id),
            fetchStorageUsage(params.id),
            fetchActiveUsers(params.id),
        ]);

        return Response.json({
            documentCount: stats[0],
            storageUsed: stats[1],
            activeUsers: stats[2],
        });
    }
    ```

3. **Business Logic Operations**
    ```typescript
    // app/api/documents/[id]/publish/route.ts
    export async function POST(
        request: Request,
        { params }: { params: { id: string } },
    ) {
        // Complex business logic with multiple operations
        const result = await publishDocument(params.id);
        return Response.json(result);
    }
    ```

## Data Loading Patterns

### 1. Server-Side Data Loading

```typescript
// app/documents/[id]/page.tsx
export default async function DocumentPage({ params }: { params: { id: string } }) {
  // Critical data loaded server-side
  const document = await fetchDocument(params.id);

  return (
    <Suspense fallback={<DocumentSkeleton />}>
      <DocumentProvider initialData={document}>
        <DocumentHeader />
        <BlockCanvas />
        <RequirementsSidebar />
      </DocumentProvider>
    </Suspense>
  );
}
```

### 2. Progressive Data Loading

```typescript
// Components/DocumentView/BlockCanvas.tsx
export function BlockCanvas() {
  const { blocks, loadMoreBlocks } = useInfiniteBlocks({
    pageSize: 20,
    suspense: true
  });

  return (
    <VirtualizedList
      items={blocks}
      onEndReached={loadMoreBlocks}
      renderItem={(block) => (
        <Suspense fallback={<BlockSkeleton />}>
          <BlockRenderer block={block} />
        </Suspense>
      )}
    />
  );
}
```

## Caching Strategy

### 1. Edge Caching Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
    // Cache static assets and public data
    if (request.nextUrl.pathname.startsWith('/api/public')) {
        return new Response(null, {
            headers: {
                'Cache-Control':
                    'public, max-age=3600, stale-while-revalidate=86400',
            },
        });
    }
}
```

### 2. React Query Configuration

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Global defaults
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 5, // 5 minutes

            // Retry configuration
            retry: (failureCount, error) => {
                if (error instanceof AuthError) return false;
                return failureCount < 3;
            },
        },
        mutations: {
            retry: false,
        },
    },
});
```

## Infrastructure Optimization

### 1. Database Access Optimization

```typescript
// utils/supabase.ts
export const createDatabaseClient = (context: 'api' | 'client') => {
    if (context === 'api') {
        // Server-side client with full access
        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
        );
    }

    // Client-side with restricted access
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
};
```

### 2. Request Batching

```typescript
// utils/batchRequests.ts
export const batchLoader = new DataLoader(async (keys: string[]) => {
    const { data } = await supabase
        .from('documents')
        .select('*')
        .in('id', keys);

    return keys.map((key) => data?.find((item) => item.id === key) ?? null);
});
```

## Performance Optimization Patterns

### 1. Query Key Management

```typescript
// constants/queryKeys.ts
export const queryKeys = {
    documents: {
        all: ['documents'] as const,
        lists: () => [...queryKeys.documents.all, 'list'] as const,
        list: (filters: string) =>
            [...queryKeys.documents.lists(), { filters }] as const,
        details: () => [...queryKeys.documents.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    },
} as const;
```

### 2. Prefetching Strategy

```typescript
// hooks/usePrefetch.ts
export const usePrefetchDocument = () => {
    const queryClient = useQueryClient();

    return useCallback(
        (id: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.documents.detail(id),
                queryFn: () => fetchDocument(id),
            });
        },
        [queryClient],
    );
};
```

### 3. Optimistic Updates

```typescript
// hooks/useUpdateDocument.ts
export const useUpdateDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateDocument,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.documents.detail(variables.id),
            });

            const previousDocument = queryClient.getQueryData(
                queryKeys.documents.detail(variables.id),
            );

            queryClient.setQueryData(
                queryKeys.documents.detail(variables.id),
                (old: any) => ({
                    ...old,
                    ...variables.updates,
                }),
            );

            return { previousDocument };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(
                queryKeys.documents.detail(variables.id),
                context?.previousDocument,
            );
        },
    });
};
```

## Monitoring and Error Handling

### 1. Error Boundary Configuration

```typescript
// components/ErrorBoundary.tsx
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => <ErrorDisplay error={error} />}
      onError={(error) => {
        // Log error to monitoring service
        if (error instanceof AuthError) {
          // Handle auth errors
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 2. Performance Monitoring

```typescript
// utils/monitoring.ts
export const measureQueryPerformance = <T>(queryFn: () => Promise<T>) => {
    return async () => {
        const start = performance.now();
        try {
            const result = await queryFn();
            const duration = performance.now() - start;

            // Log performance metrics
            logQueryMetrics({
                duration,
                success: true,
            });

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            // Log error metrics
            logQueryMetrics({
                duration,
                success: false,
                error,
            });

            throw error;
        }
    };
};
```

## Deployment Considerations

1. **Edge Functions**: Deploy computation-heavy API routes to edge
2. **Caching**: Implement multiple caching layers
3. **Database Indexes**: Create appropriate indexes based on access patterns
4. **Connection Pooling**: Use PgBouncer for connection management
5. **Rate Limiting**: Implement rate limiting for API routes
6. **Error Monitoring**: Set up error tracking and monitoring
7. **Performance Monitoring**: Track key metrics and set up alerts
