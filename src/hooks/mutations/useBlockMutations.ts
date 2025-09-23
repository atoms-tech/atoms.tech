import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/supabaseBrowser';
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

export function useCreateBlock() {
    return useMutation({
        mutationFn: async (input: CreateBlockInput) => {
            console.log('Creating block', input);

            const { data: block, error: blockError } = await supabase
                .from('blocks')
                .insert({
                    content:
                        (input as { content?: Json | null })?.content ?? ({} as Json),
                    document_id: input.document_id,
                    position: input.position,
                    type: input.type,
                    created_by: input.created_by,
                    updated_by: input.updated_by,
                })
                .select()
                .single();

            if (blockError) {
                console.error('Failed to create block', blockError);
                throw blockError;
            }

            if (!block) {
                throw new Error('Failed to create block');
            }

            return block;
        },
    });
}

export function useUpdateBlock() {
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

            const { data: block, error: blockError } = await supabase
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
    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting block', id);

            const { data: block, error: blockError } = await supabase
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
