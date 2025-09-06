import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Tables } from '@/types/base/database.types';

export type AuditLog = Tables<'audit_logs'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createAuditLogsDomain(supabase: SupabaseAny) {
    return {
        async listByEntity(
            entityId: string,
            entityType: string,
            extra?: Record<string, unknown>,
        ): Promise<AuditLog[]> {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .eq('entity_id', entityId)
                .eq('entity_type', entityType)
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
            return (data as AuditLog[]) ?? [];
        },
    };
}

export type AuditLogsDomain = ReturnType<typeof createAuditLogsDomain>;
