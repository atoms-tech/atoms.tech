import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import type { Tables, TablesInsert } from '@/types/base/database.types';

export type Document = Tables<'documents'>;
export type Block = Tables<'blocks'>;
export type ColumnRow = Tables<'columns'>;
export type Column = Tables<'columns'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createDocumentsDomain(supabase: SupabaseAny) {
    return {
        async create(insertData: TablesInsert<'documents'>): Promise<Document> {
            try {
                const { data, error } = await supabase
                    .from('documents')
                    .insert(insertData)
                    .select()
                    .single();
                if (error) throw error;
                return data as Document;
            } catch (e) {
                throw normalizeError(e, 'Failed to create document');
            }
        },
        async getById(documentId: string): Promise<Document | null> {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .eq('is_deleted', false)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return (data as Document) ?? null;
        },

        async listByProject(projectId: string): Promise<Document[]> {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('project_id', projectId)
                .eq('is_deleted', false);
            if (error) throw error;
            return (data as Document[]) ?? [];
        },

        async listWithFilters(filters?: Record<string, unknown>): Promise<Document[]> {
            let query = supabase.from('documents').select('*');
            if (filters) {
                for (const [k, v] of Object.entries(filters)) {
                    if (v !== undefined) {
                        const col = k as string;
                        const val = v as string | number | boolean | null;
                        const builder = query as unknown as {
                            eq: (
                                col: string,
                                val: string | number | boolean | null,
                            ) => typeof query;
                        };
                        query = builder.eq(col, val);
                    }
                }
            }
            const { data, error } = await query;
            if (error) throw error;
            return (data as Document[]) ?? [];
        },

        async update(documentId: string, document: Partial<Document>): Promise<Document> {
            try {
                const { data, error } = await supabase
                    .from('documents')
                    .update(document)
                    .eq('id', documentId)
                    .single();
                if (error) throw error;
                return data as Document;
            } catch (e) {
                throw normalizeError(e, 'Failed to update document');
            }
        },

        async softDelete(id: string, deletedBy: string): Promise<Document> {
            try {
                const { data, error } = await supabase
                    .from('documents')
                    .update({
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_by: deletedBy,
                    })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as Document;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete document');
            }
        },

        async blocksAndRequirements(documentId: string) {
            const { data, error } = await supabase
                .from('blocks')
                .select(`*, requirements:requirements(*)`)
                .eq('document_id', documentId)
                .eq('requirements.document_id', documentId)
                .eq('requirements.is_deleted', false)
                .eq('is_deleted', false);
            if (error) throw error;
            return data as unknown[];
        },

        async getBlockById(blockId: string): Promise<Block | null> {
            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('id', blockId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return (data as Block) ?? null;
        },

        async listBlocks(documentId: string): Promise<Block[]> {
            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position');
            if (error) throw error;
            return (data as Block[]) ?? [];
        },

        async listColumnsByBlockIds(
            blockIds: string[],
        ): Promise<(ColumnRow & { property: Tables<'properties'> | null })[]> {
            if (blockIds.length === 0) return [];
            const { data, error } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .in('block_id', blockIds)
                .order('position', { ascending: true });
            if (error) throw error;
            return (
                (data as unknown as Array<
                    ColumnRow & { property: Tables<'properties'> | null }
                >) ?? []
            );
        },

        async createBlock(insert: TablesInsert<'blocks'>): Promise<Block> {
            try {
                const { data, error } = await supabase
                    .from('blocks')
                    .insert(insert)
                    .select()
                    .single();
                if (error) throw error;
                return data as Block;
            } catch (e) {
                throw normalizeError(e, 'Failed to create block');
            }
        },

        async updateBlock(id: string, update: Partial<Block>): Promise<Block> {
            try {
                const { data, error } = await supabase
                    .from('blocks')
                    .update({ ...update, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as Block;
            } catch (e) {
                throw normalizeError(e, 'Failed to update block');
            }
        },

        async softDeleteBlock(id: string, deletedBy: string): Promise<Block> {
            try {
                const { data, error } = await supabase
                    .from('blocks')
                    .update({
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_by: deletedBy,
                    })
                    .eq('id', id)
                    .select('*')
                    .single();
                if (error) throw error;
                return data as Block;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete block');
            }
        },

        async createColumn(insert: TablesInsert<'columns'>): Promise<Column> {
            try {
                const { data, error } = await supabase
                    .from('columns')
                    .insert(insert)
                    .select()
                    .single();
                if (error) throw error;
                return data as Column;
            } catch (e) {
                throw normalizeError(e, 'Failed to create column');
            }
        },

        async deleteColumn(id: string): Promise<void> {
            try {
                const { error } = await supabase.from('columns').delete().eq('id', id);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete column');
            }
        },
    };
}

export type DocumentsDomain = ReturnType<typeof createDocumentsDomain>;
