import {
    QueryClient,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
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

            const insertData: TablesInsert<'trace_links'> = {
                ...input,
                version: 1,
            };

            const { data: traceLink, error: traceLinkError } = await supabase
                .from('trace_links')
                .insert(insertData)
                .select()
                .single();

            if (traceLinkError) {
                console.error('Failed to create trace link', traceLinkError);
                throw traceLinkError;
            }

            if (!traceLink) {
                throw new Error('Failed to create trace link');
            }

            return traceLink as TraceLink;
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

            const insertData = inputs.map((input) => ({
                ...input,
                version: 1,
            }));

            const { data: traceLinks, error: traceLinkError } = await supabase
                .from('trace_links')
                .insert(insertData)
                .select();

            if (traceLinkError) {
                console.error('Failed to create trace links', traceLinkError);
                throw traceLinkError;
            }

            if (!traceLinks) {
                throw new Error('Failed to create trace links');
            }

            return traceLinks as TraceLink[];
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
        mutationFn: async ({
            id,
            deletedBy,
        }: {
            id: string;
            deletedBy: string;
        }) => {
            console.log('Deleting trace link', id);

            const { data: traceLink, error: traceLinkError } = await supabase
                .from('trace_links')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();

            if (traceLinkError) {
                console.error('Failed to delete trace link', traceLinkError);
                throw traceLinkError;
            }

            if (!traceLink) {
                throw new Error('Failed to delete trace link');
            }

            return traceLink as TraceLink;
        },
        onSuccess: (data) => {
            invalidateTraceLinkQueries(queryClient, data);
        },
    });
}

const invalidateTraceLinkQueries = (
    queryClient: QueryClient,
    data: TraceLink,
) => {
    queryClient.invalidateQueries({
        queryKey: queryKeys.traceLinks.bySource(
            data.source_id,
            data.source_type,
        ),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.traceLinks.byTarget(
            data.target_id,
            data.target_type,
        ),
    });
};
