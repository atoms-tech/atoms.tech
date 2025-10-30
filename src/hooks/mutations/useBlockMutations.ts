import { useMutation } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { Block } from '@/types';
import { Json } from '@/types/base/database.types';

export type BlockContent = {
    columns?: Json | null;
    order?: Json | null;
    requirements?: Json | null;
};

export type CreateBlockInput = Omit<
    Block,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export type UpdateBlockContent = {
    id: string;
    content?: BlockContent;
} & Partial<Block>;

const useSupabaseClientOrThrow = () => {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return () => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    };
};

export function useCreateBlock() {
    return useMutation({
        mutationFn: async (input: CreateBlockInput) => {
            console.log('Creating block via API', input);

            const body = {
                type: input.type,
                position: input.position,
                content: (input as { content?: Json | null })?.content ?? ({} as Json),
                name: (input as { name?: string | null }).name ?? null,
                orgId: (input as { org_id?: string | null }).org_id ?? null,
            } as {
                type: string;
                position?: number | null;
                content?: Json | null;
                name?: string | null;
                orgId?: string | null;
            };

            const res = await fetch(`/api/documents/${input.document_id}/blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to create block: ${res.status} ${text}`);
            }
            const payload = (await res.json()) as {
                block: Block;
                columns?: unknown[];
            };
            return payload.block;
        },
    });
}

export function useUpdateBlock() {
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async (input: Partial<Block> & { id: string }) => {
            console.log('Updating block', input.id, input);

            // Separate content from other fields
            const { id, content, ...otherFields } = input;

            // Build update payload. Only include `content` if explicitly provided.
            const updatePayload: Record<string, unknown> = {
                ...otherFields,
                updated_at: new Date().toISOString(),
            };
            if (content !== undefined) {
                updatePayload.content = (content as Json) ?? null;
            }

            const client = ensureSupabaseClient();
            const { data: block, error: blockError } = await client
                .from('blocks')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (blockError) {
                console.error('Failed to update block', blockError);
                throw blockError;
            }

            if (!block) {
                throw new Error('Failed to update block');
            }

            return block;
        },
    });
}

export function useDeleteBlock() {
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting block', id);

            const client = ensureSupabaseClient();
            const { data: block, error: blockError } = await client
                .from('blocks')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select('*')
                .single();

            if (blockError) {
                console.error('Failed to delete block', blockError);
                throw blockError;
            }

            if (!block) {
                throw new Error('Failed to delete block');
            }

            return block;
        },
    });
}
