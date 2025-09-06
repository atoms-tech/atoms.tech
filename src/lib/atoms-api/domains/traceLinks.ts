import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Database, Tables, TablesInsert } from '@/types/base/database.types';

export type TraceLink = Tables<'trace_links'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createTraceLinksDomain(supabase: SupabaseAny) {
    return {
        async create(
            input: Omit<
                TablesInsert<'trace_links'>,
                | 'id'
                | 'version'
                | 'created_at'
                | 'updated_at'
                | 'deleted_at'
                | 'deleted_by'
                | 'is_deleted'
            >,
        ): Promise<TraceLink> {
            const insertData: TablesInsert<'trace_links'> = { ...input, version: 1 };
            const { data, error } = await supabase
                .from('trace_links')
                .insert(insertData)
                .select()
                .single();
            if (error) throw error;
            return data as TraceLink;
        },

        async createMany(
            inputs: Array<
                Omit<
                    TablesInsert<'trace_links'>,
                    | 'id'
                    | 'version'
                    | 'created_at'
                    | 'updated_at'
                    | 'deleted_at'
                    | 'deleted_by'
                    | 'is_deleted'
                >
            >,
        ): Promise<TraceLink[]> {
            const insertData = inputs.map((i) => ({ ...i, version: 1 }));
            const { data, error } = await supabase
                .from('trace_links')
                .insert(insertData)
                .select();
            if (error) throw error;
            return (data as TraceLink[]) ?? [];
        },

        async softDelete(id: string, deletedBy: string): Promise<TraceLink> {
            const { data, error } = await supabase
                .from('trace_links')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data as TraceLink;
        },

        async listBySource(
            sourceId: string,
            sourceType: Database['public']['Enums']['entity_type'],
            extra?: Record<string, unknown>,
        ) {
            let query = supabase
                .from('trace_links')
                .select('*')
                .eq('source_id', sourceId)
                .eq('source_type', sourceType)
                .eq('is_deleted', false);
            if (extra) {
                for (const [k, v] of Object.entries(extra)) {
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
            return data ?? [];
        },

        async listByTarget(
            targetId: string,
            targetType: Database['public']['Enums']['entity_type'],
            extra?: Record<string, unknown>,
        ) {
            let query = supabase
                .from('trace_links')
                .select('*')
                .eq('target_id', targetId)
                .eq('target_type', targetType)
                .eq('is_deleted', false);
            if (extra) {
                for (const [k, v] of Object.entries(extra)) {
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
            return data ?? [];
        },
    };
}

export type TraceLinksDomain = ReturnType<typeof createTraceLinksDomain>;
