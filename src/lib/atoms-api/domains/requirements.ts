import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import { generateNextRequirementId } from '@/lib/utils/requirementIdGenerator';
import type { Tables, TablesInsert } from '@/types/base/database.types';

export type Requirement = Tables<'requirements'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export type CreateRequirementInput = Omit<
    Requirement,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function createRequirementsDomain(supabase: SupabaseAny) {
    return {
        async getById(id: string): Promise<Requirement | null> {
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return (data as Requirement) ?? null;
        },

        async listWithFilters(filters?: Record<string, unknown>): Promise<Requirement[]> {
            let query = supabase.from('requirements').select('*');
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
            return (data as Requirement[]) ?? [];
        },

        async listByProject(projectId: string): Promise<Requirement[]> {
            const { data, error } = await supabase
                .from('requirements')
                .select(`*, documents!inner(id, project_id)`) // join to filter by project
                .eq('documents.project_id', projectId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as Requirement[]) ?? [];
        },

        async listByDocument(documentId: string): Promise<Requirement[]> {
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as Requirement[]) ?? [];
        },

        async listByBlock(blockId: string): Promise<Requirement[]> {
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('block_id', blockId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as Requirement[]) ?? [];
        },

        async listByBlockIds(blockIds: string[]): Promise<Requirement[]> {
            if (!blockIds.length) return [];
            try {
                const { data: rows, error } = await supabase
                    .from('requirements')
                    .select(`* , blocks!inner(name)`) // include block name used by scanner
                    .in('block_id', blockIds)
                    .eq('is_deleted', false);
                if (error) throw error;
                return (rows as Requirement[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to list requirements by block IDs');
            }
        },

        async listByIds(ids: string[]): Promise<Requirement[]> {
            if (!ids.length) return [];
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('id', ids);
            if (error) throw error;
            return (data as Requirement[]) ?? [];
        },

        async create(input: CreateRequirementInput): Promise<Requirement> {
            // Determine organization via the document's project
            const { data: document, error: docError } = await supabase
                .from('documents')
                .select(`project_id, projects!inner(organization_id)`)
                .eq('id', input.document_id)
                .single();
            if (docError) throw docError;

            const organizationId = (
                document as { projects?: { organization_id?: string } }
            )?.projects?.organization_id;

            let externalId = 'REQ-001';
            if (organizationId) {
                try {
                    externalId = await generateNextRequirementId(organizationId);
                } catch {
                    const ts = Date.now().toString().slice(-6);
                    externalId = `REQ-${ts}`;
                }
            }

            const insertData: TablesInsert<'requirements'> = {
                block_id: input.block_id,
                document_id: input.document_id,
                name: input.name,
                ai_analysis: input.ai_analysis,
                description: input.description,
                enchanced_requirement: input.enchanced_requirement,
                external_id: externalId,
                format: input.format,
                level: input.level,
                original_requirement: input.original_requirement,
                priority: input.priority,
                status: input.status,
                tags: input.tags,
                created_by: input.created_by,
                updated_by: input.updated_by,
                properties: input.properties || {},
                version: 1,
                position: input.position,
                type: input.type || null,
            };

            const { data: requirement, error } = await supabase
                .from('requirements')
                .insert(insertData)
                .select()
                .single();
            if (error) throw error;
            return requirement as Requirement;
        },

        async update(id: string, input: Partial<Requirement>): Promise<Requirement> {
            const { data, error } = await supabase
                .from('requirements')
                .update({ ...input, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data as Requirement;
        },

        async softDelete(id: string, deletedBy: string): Promise<Requirement> {
            const { data, error } = await supabase
                .from('requirements')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data as Requirement;
        },
    };
}

export type RequirementsDomain = ReturnType<typeof createRequirementsDomain>;
