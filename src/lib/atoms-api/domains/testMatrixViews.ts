import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/base/database.types';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

type TestMatrixView = Tables<'test_matrix_views'>;

export function createTestMatrixViewsDomain(supabase: SupabaseAny) {
    return {
        async listByProject(projectId: string): Promise<TestMatrixView[]> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return (data as TestMatrixView[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to list test matrix views');
            }
        },
        async insert(view: TablesInsert<'test_matrix_views'>): Promise<TestMatrixView> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .insert(view)
                    .select()
                    .single();
                if (error) throw error;
                return data as TestMatrixView;
            } catch (e) {
                throw normalizeError(e, 'Failed to create test matrix view');
            }
        },
        async update(
            id: string,
            updates: TablesUpdate<'test_matrix_views'>,
        ): Promise<TestMatrixView> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as TestMatrixView;
            } catch (e) {
                throw normalizeError(e, 'Failed to update test matrix view');
            }
        },
        async softDelete(id: string) {
            try {
                const { error } = await supabase
                    .from('test_matrix_views')
                    .update({ is_active: false })
                    .eq('id', id);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete test matrix view');
            }
        },
        async getById(id: string): Promise<TestMatrixView> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .select('*')
                    .eq('id', id)
                    .eq('is_active', true)
                    .single();
                if (error) throw error;
                return data as TestMatrixView;
            } catch (e) {
                throw normalizeError(e, 'Failed to fetch test matrix view');
            }
        },
        async getDefault(projectId: string): Promise<TestMatrixView> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('is_default', true)
                    .eq('is_active', true)
                    .single();
                if (error) throw error;
                return data as TestMatrixView;
            } catch (e) {
                throw normalizeError(e, 'Failed to get default view');
            }
        },
        async getFirstActive(projectId: string): Promise<TestMatrixView | null> {
            try {
                const { data, error } = await supabase
                    .from('test_matrix_views')
                    .select('*')
                    .eq('project_id', projectId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (error) throw error;
                return (data as TestMatrixView) ?? null;
            } catch (e) {
                throw normalizeError(e, 'Failed to get first active view');
            }
        },
        async unsetDefaults(projectId: string, exceptId?: string) {
            try {
                let q = supabase
                    .from('test_matrix_views')
                    .update({ is_default: false })
                    .eq('project_id', projectId)
                    .eq('is_default', true);
                if (exceptId) q = q.neq('id', exceptId);
                const { error } = await q;
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to unset default views');
            }
        },
    };
}

export type TestMatrixViewsDomain = ReturnType<typeof createTestMatrixViewsDomain>;
