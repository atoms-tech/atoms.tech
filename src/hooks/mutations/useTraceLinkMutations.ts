import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
import { TablesInsert } from '@/types/base/database.types';
import { TraceLink } from '@/types/base/traceability.types';

export type CreateTraceLinkInput = Omit<
    TablesInsert<'trace_links'>,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function useCreateTraceLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateTraceLinkInput) => {
            console.log('Creating trace link', input);

            const api = atomsApiClient();
            return (await api.traceLinks.create(input)) as TraceLink;
        },
        onSuccess: (data) => {
            invalidateTraceLinkQueries(queryClient, data);
        },
    });
}

export function useCreateTraceLinks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inputs: CreateTraceLinkInput[]) => {
            console.log('Creating trace links', inputs);

            const api = atomsApiClient();
            return (await api.traceLinks.createMany(inputs)) as TraceLink[];
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            if (data.length > 0) {
                const firstLink = data[0];
                invalidateTraceLinkQueries(queryClient, firstLink);
            }
        },
    });
}

export function useDeleteTraceLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting trace link', id);

            const api = atomsApiClient();
            return (await api.traceLinks.softDelete(id, deletedBy)) as TraceLink;
        },
        onSuccess: (data) => {
            invalidateTraceLinkQueries(queryClient, data);
        },
    });
}

const invalidateTraceLinkQueries = (queryClient: QueryClient, data: TraceLink) => {
    queryClient.invalidateQueries({
        queryKey: queryKeys.traceLinks.bySource(data.source_id, data.source_type),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.traceLinks.byTarget(data.target_id, data.target_type),
    });
};
