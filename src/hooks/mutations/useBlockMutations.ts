import { useMutation } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
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

            const api = atomsApiClient();
            return api.documents.createBlock({
                content: input.content,
                document_id: input.document_id,
                position: input.position,
                type: input.type,
                created_by: input.created_by,
                updated_by: input.updated_by,
            } as any);
        },
    });
}

export function useUpdateBlock() {
    return useMutation({
        mutationFn: async (input: Partial<Block> & { id: string }) => {
            console.log('Updating block', input.id, input);

            // Separate content from other fields
            const { id, content, ...otherFields } = input;

            const api = atomsApiClient();
            return api.documents.updateBlock(id, {
                ...otherFields,
                content: content || null,
            } as any);
        },
    });
}

export function useDeleteBlock() {
    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting block', id);

            const api = atomsApiClient();
            return api.documents.softDeleteBlock(id, deletedBy);
        },
    });
}
