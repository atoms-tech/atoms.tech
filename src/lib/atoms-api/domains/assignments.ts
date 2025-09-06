import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Database, Tables } from '@/types/base/database.types';

export type Assignment = Tables<'assignments'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createAssignmentsDomain(supabase: SupabaseAny) {
    return {
        async listByEntity(
            entityId: string,
            entityType: Database['public']['Enums']['entity_type'],
            extra?: Record<string, unknown>,
        ): Promise<Assignment[]> {
            let query = supabase
                .from('assignments')
                .select('*')
                .eq('entity_id', entityId)
                .eq('entity_type', entityType);

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
            return (data as Assignment[]) ?? [];
        },

        async listByUser(
            userId: string,
            extra?: Record<string, unknown>,
        ): Promise<Assignment[]> {
            let query = supabase
                .from('assignments')
                .select('*')
                .eq('assignee_id', userId)
                .order('created_at', { ascending: false });

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
            return (data as Assignment[]) ?? [];
        },
    };
}

export type AssignmentsDomain = ReturnType<typeof createAssignmentsDomain>;
