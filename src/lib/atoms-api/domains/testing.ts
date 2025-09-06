import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import { normalizeError } from '@/lib/atoms-api/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/base/database.types';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export interface TestFilters {
    status?: import('@/types/base/database.types').Database['public']['Enums']['test_status'][];
    priority?: import('@/types/base/database.types').Database['public']['Enums']['test_priority'][];
    test_type?: import('@/types/base/database.types').Database['public']['Enums']['test_type'][];
    search?: string;
}

export interface Pagination {
    page: number;
    pageSize: number;
    orderBy: string;
    orderDirection: 'asc' | 'desc';
}

export function createTestingDomain(supabase: SupabaseAny) {
    return {
        async listProjectTests(
            projectId: string,
            filters: TestFilters = {},
            pagination: Pagination = {
                page: 1,
                pageSize: 10,
                orderBy: 'created_at',
                orderDirection: 'desc',
            },
        ): Promise<{ data: Tables<'test_req'>[]; count: number }> {
            let query = supabase
                .from('test_req')
                .select('*', { count: 'exact' })
                .eq('project_id', projectId)
                .eq('is_active', true);

            if (filters.status?.length) query = query.in('status', filters.status);
            if (filters.priority?.length) query = query.in('priority', filters.priority);
            if (filters.test_type?.length)
                query = query.in('test_type', filters.test_type);
            if (filters.search) {
                query = query.or(
                    `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
                );
            }

            const from = (pagination.page - 1) * pagination.pageSize;
            const to = from + pagination.pageSize - 1;
            query = query
                .order(pagination.orderBy, {
                    ascending: pagination.orderDirection === 'asc',
                })
                .range(from, to);

            try {
                const { data, error, count } = (await query) as unknown as {
                    data: Tables<'test_req'>[];
                    error: unknown;
                    count: number;
                };
                if (error) throw error;
                return { data: data ?? [], count: count ?? 0 };
            } catch (e) {
                throw normalizeError(e, 'Failed to list tests');
            }
        },

        async getTestsByIds(ids: string[]): Promise<Tables<'test_req'>[]> {
            if (!ids.length) return [];
            try {
                const { data, error } = await supabase
                    .from('test_req')
                    .select('*')
                    .in('id', ids);
                if (error) throw error;
                return (data as Tables<'test_req'>[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to fetch tests');
            }
        },

        async getLinkedRequirementsCount(testId: string): Promise<number> {
            try {
                const { count, error } = await supabase
                    .from('requirement_tests')
                    .select('*', { count: 'exact', head: true })
                    .eq('test_id', testId);
                if (error) throw error;
                return count ?? 0;
            } catch (e) {
                throw normalizeError(e, 'Failed to count linked requirements');
            }
        },

        async listRelationsByTest(
            testId: string,
        ): Promise<Tables<'requirement_tests'>[]> {
            try {
                const { data, error } = await supabase
                    .from('requirement_tests')
                    .select('*')
                    .eq('test_id', testId);
                if (error) throw error;
                return (data as Tables<'requirement_tests'>[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to list test relations');
            }
        },

        async listRelationsByRequirement(
            requirementId: string,
        ): Promise<Tables<'requirement_tests'>[]> {
            try {
                const { data, error } = await supabase
                    .from('requirement_tests')
                    .select('*')
                    .eq('requirement_id', requirementId);
                if (error) throw error;
                return (data as Tables<'requirement_tests'>[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to list requirement relations');
            }
        },

        async listRelationsByTests(
            testIds: string[],
        ): Promise<Tables<'requirement_tests'>[]> {
            if (!testIds.length) return [];
            try {
                const { data, error } = await supabase
                    .from('requirement_tests')
                    .select('*')
                    .in('test_id', testIds);
                if (error) throw error;
                return (data as Tables<'requirement_tests'>[]) ?? [];
            } catch (e) {
                throw normalizeError(e, 'Failed to list relations by tests');
            }
        },

        async createTest(
            testData: TablesInsert<'test_req'>,
        ): Promise<Tables<'test_req'>> {
            try {
                const { data, error } = await supabase
                    .from('test_req')
                    .insert(testData)
                    .select()
                    .single();
                if (error) throw error;
                return data as Tables<'test_req'>;
            } catch (e) {
                throw normalizeError(e, 'Failed to create test');
            }
        },

        async updateTest(
            id: string,
            updates: TablesUpdate<'test_req'>,
        ): Promise<Tables<'test_req'>> {
            try {
                const { data, error } = await supabase
                    .from('test_req')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as Tables<'test_req'>;
            } catch (e) {
                throw normalizeError(e, 'Failed to update test');
            }
        },

        async softDeleteTest(id: string): Promise<Tables<'test_req'>> {
            try {
                const { data, error } = await supabase
                    .from('test_req')
                    .update({ is_active: false })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return data as Tables<'test_req'>;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete test');
            }
        },

        async createRelation(
            relationData: TablesInsert<'requirement_tests'>,
        ): Promise<Tables<'requirement_tests'>> {
            try {
                const { data, error } = await supabase
                    .from('requirement_tests')
                    .insert(relationData)
                    .select()
                    .single();
                if (error) throw error;
                return data as Tables<'requirement_tests'>;
            } catch (e) {
                throw normalizeError(e, 'Failed to create test relation');
            }
        },

        async updateRelation(
            requirementId: string,
            testId: string,
            updates: TablesUpdate<'requirement_tests'>,
        ): Promise<Tables<'requirement_tests'>> {
            try {
                const { data, error } = await supabase
                    .from('requirement_tests')
                    .update(updates)
                    .eq('requirement_id', requirementId)
                    .eq('test_id', testId)
                    .select()
                    .single();
                if (error) throw error;
                return data as Tables<'requirement_tests'>;
            } catch (e) {
                throw normalizeError(e, 'Failed to update test relation');
            }
        },

        async deleteRelation(requirementId: string, testId: string): Promise<void> {
            try {
                const { error } = await supabase
                    .from('requirement_tests')
                    .delete()
                    .eq('requirement_id', requirementId)
                    .eq('test_id', testId);
                if (error) throw error;
            } catch (e) {
                throw normalizeError(e, 'Failed to delete test relation');
            }
        },
    };
}

export type TestingDomain = ReturnType<typeof createTestingDomain>;
