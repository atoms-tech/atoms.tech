import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import type { Tables, TablesInsert } from '@/types/base/database.types';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export type Diagram = Tables<'excalidraw_diagrams'>;

export function createDiagramsDomain(supabase: SupabaseAny) {
    return {
        async listByProject(
            projectId: string,
        ): Promise<
            Pick<Diagram, 'id' | 'name' | 'thumbnail_url' | 'updated_at' | 'created_by'>[]
        > {
            try {
                const { data, error } = await supabase
                    .from('excalidraw_diagrams')
                    .select('id, name, thumbnail_url, updated_at, created_by')
                    .eq('project_id', projectId)
                    .order('updated_at', { ascending: false });
                if (error) throw error;
                return (
                    (data as unknown as Pick<
                        Diagram,
                        'id' | 'name' | 'thumbnail_url' | 'updated_at' | 'created_by'
                    >[]) ?? []
                );
            } catch (e) {
                throw normalizeError(e, 'Failed to list diagrams');
            }
        },

        async getById(id: string): Promise<Diagram | null> {
            try {
                const { data, error } = await supabase
                    .from('excalidraw_diagrams')
                    .select('id, name, diagram_data, project_id, organization_id')
                    .eq('id', id)
                    .single();
                if (error && (error as unknown as { code?: string }).code !== 'PGRST116')
                    throw error;
                return (data as Diagram) ?? null;
            } catch (e) {
                throw normalizeError(e, 'Failed to fetch diagram');
            }
        },

        async updateName(id: string, name: string): Promise<void> {
            try {
                const { error } = await supabase
                    .from('excalidraw_diagrams')
                    .update({ name })
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to rename diagram');
            }
        },

        async delete(id: string): Promise<void> {
            try {
                const { error } = await supabase
                    .from('excalidraw_diagrams')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete diagram');
            }
        },

        async upsert(record: TablesInsert<'excalidraw_diagrams'>): Promise<void> {
            try {
                const { error } = await supabase
                    .from('excalidraw_diagrams')
                    .upsert(record);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to save diagram');
            }
        },
    };
}

export type DiagramsDomain = ReturnType<typeof createDiagramsDomain>;
