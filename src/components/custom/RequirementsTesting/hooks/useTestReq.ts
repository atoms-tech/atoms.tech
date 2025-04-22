import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    RequirementTest,
    TestReq,
} from '@/components/custom/RequirementsTesting/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';

interface TestFilters {
    status?: Database['public']['Enums']['test_status'][];
    priority?: Database['public']['Enums']['test_priority'][];
    test_type?: Database['public']['Enums']['test_type'][];
    search?: string;
}

/**
 * Hook to fetch test cases by project ID
 */
export function useProjectTestCases(
    projectId: string,
    filters: TestFilters = {},
    pagination = {
        page: 1,
        pageSize: 10,
        orderBy: 'created_at',
        orderDirection: 'desc' as 'asc' | 'desc',
    },
) {
    return useQuery({
        queryKey: [...queryKeys.testReq.list, projectId, filters, pagination],
        queryFn: async () => {
            let query = supabase
                .from('test_req')
                .select('*', { count: 'exact' })
                .eq('project_id', projectId)
                .eq('is_active', true);

            // Apply filters
            if (filters.status?.length) {
                query = query.in('status', filters.status);
            }
            if (filters.priority?.length) {
                query = query.in('priority', filters.priority);
            }
            if (filters.test_type?.length) {
                query = query.in('test_type', filters.test_type);
            }
            if (filters.search) {
                query = query.or(
                    `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
                );
            }

            // Apply pagination
            const { page, pageSize, orderBy, orderDirection } = pagination;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            query = query
                .order(orderBy, { ascending: orderDirection === 'asc' })
                .range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: data.map((test) => ({
                    ...test,
                    id: test.id,
                    name: test.title, // Map to expected property for view components
                    type: test.test_type, // Map to expected property
                    result: getResultFromStatus(test.status), // Derive result from status
                })),
                count: count || 0,
            };
        },
        enabled: !!projectId,
    });
}

/**
 * Helper to derive test result from status
 */
function getResultFromStatus(status: string): string {
    if (status === 'completed') return 'Pass';
    if (status === 'blocked' || status === 'failed') return 'Fail';
    return 'Not Run';
}

/**
 * Hook to get number of linked requirements for a test case
 */
export function useLinkedRequirementsCount(testId: string) {
    return useQuery({
        queryKey: [...queryKeys.testReq.detail(testId), 'linkedCount'],
        queryFn: async () => {
            if (!testId) return 0;

            const { data, error, count } = await supabase
                .from('requirement_tests')
                .select('*', { count: 'exact' })
                .eq('test_id', testId);

            if (error || !data) throw error;
            return count || 0;
        },
        enabled: !!testId,
    });
}

/**
 * Hook to fetch requirements linked to a test case
 */
export function useTestRequirements(testId: string) {
    return useQuery({
        queryKey: [...queryKeys.testReq.detail(testId), 'requirements'],
        queryFn: async () => {
            if (!testId) return [];

            const { data: relationData, error: relationError } = await supabase
                .from('requirement_tests')
                .select('requirement_id')
                .eq('test_id', testId);

            if (relationError) throw relationError;

            if (!relationData.length) return [];

            const requirementIds = relationData.map((r) => r.requirement_id);

            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('id', requirementIds);

            if (error) throw error;
            return data;
        },
        enabled: !!testId,
    });
}

/**
 * Hook to fetch test cases linked to a requirement
 */
export function useRequirementTestCases(requirementId: string) {
    return useQuery({
        queryKey: [
            ...queryKeys.requirements.detail(requirementId),
            'testCases',
        ],
        queryFn: async () => {
            if (!requirementId) return [];

            const { data: relationData, error: relationError } = await supabase
                .from('requirement_tests')
                .select('test_id, execution_status')
                .eq('requirement_id', requirementId);

            if (relationError) throw relationError;

            if (!relationData.length) return [];

            const testIds = relationData.map((r) => r.test_id);

            const { data, error } = await supabase
                .from('test_req')
                .select('*')
                .in('id', testIds);

            if (error) throw error;

            // Map the status from the junction table
            return data.map((test) => {
                const relation = relationData.find(
                    (r) => r.test_id === test.id,
                );
                return {
                    ...test,
                    name: test.title,
                    type: test.test_type,
                    execution_status:
                        relation?.execution_status || 'not_executed',
                    result: mapExecutionStatusToResult(
                        relation?.execution_status,
                    ),
                };
            });
        },
        enabled: !!requirementId,
    });
}

/**
 * Helper to map execution status to display result
 */
function mapExecutionStatusToResult(status?: string): string {
    if (!status) return 'Not Run';
    if (status === 'passed') return 'Pass';
    if (status === 'failed') return 'Fail';
    if (status === 'blocked') return 'Blocked';
    return 'Not Run';
}

/**
 * Hook to fetch all requirement-test relationships for a project
 */
export function useProjectRequirementTests(projectId: string) {
    return useQuery({
        queryKey: [...queryKeys.requirementTests.list, projectId],
        queryFn: async () => {
            // First get all tests for this project
            const { data: tests, error: testsError } = await supabase
                .from('test_req')
                .select('id')
                .eq('project_id', projectId)
                .eq('is_active', true);

            if (testsError) throw testsError;

            if (!tests.length) return [];

            const testIds = tests.map((t) => t.id);

            // Then get all requirement-test relations for these tests
            const { data, error } = await supabase
                .from('requirement_tests')
                .select('*')
                .in('test_id', testIds);

            if (error) throw error;

            return data.map((rt) => ({
                ...rt,
                requirementId: rt.requirement_id,
                testCaseId: rt.test_id,
                status: mapExecutionStatusToMatrixStatus(rt.execution_status),
            }));
        },
        enabled: !!projectId,
    });
}

/**
 * Helper to map execution status to matrix display status
 */
function mapExecutionStatusToMatrixStatus(status?: string): string {
    if (!status) return 'not-run';
    if (status === 'passed') return 'verified';
    if (status === 'in_progress') return 'in-progress';
    if (status === 'failed') return 'failed';
    if (status === 'blocked') return 'blocked';
    return 'not-run';
}

/**
 * Hook to create a new test case
 */
export function useCreateTestReq() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTestReq: {
            title: string;
            description: string;
            test_type: Database['public']['Enums']['test_type'];
            priority: Database['public']['Enums']['test_priority'];
            status: Database['public']['Enums']['test_status'];
            method: Database['public']['Enums']['test_method'];
            is_active: boolean;
            project_id: string;
            test_id?: string;
        }) => {
            // Ensure required fields are present
            if (!newTestReq.title) {
                throw new Error('Test title is required');
            }

            // Set default values for required fields if not provided
            const testData = {
                ...newTestReq,
                project_id: newTestReq.project_id || '0',
                test_type: newTestReq.test_type || 'unit',
                priority: newTestReq.priority || 'medium',
                status: newTestReq.status || 'draft',
                method: newTestReq.method || 'manual',
                is_active:
                    typeof newTestReq.is_active === 'boolean'
                        ? newTestReq.is_active
                        : true,
                test_id: newTestReq.test_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('test_req')
                .insert(testData)
                .select()
                .single();

            if (error) throw error;
            return data as TestReq;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.testReq.root,
            });

            // If the test is created for a specific project, invalidate that project's tests
            if (data.project_id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.testReq.byProject(data.project_id),
                });
            }

            // Add the new test to the query cache
            queryClient.setQueryData(queryKeys.testReq.detail(data.id!), data);
        },
    });
}

/**
 * Hook to create a new requirement-test relationship
 */
export function useCreateRequirementTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newRelation: {
            requirement_id: string;
            test_id: string;
            execution_status?: Database['public']['Enums']['execution_status'];
            result_notes?: string;
        }) => {
            // Ensure required fields are present
            if (!newRelation.requirement_id || !newRelation.test_id) {
                throw new Error('Both requirement ID and test ID are required');
            }

            // Set default values
            const relationData = {
                ...newRelation,
                execution_status:
                    newRelation.execution_status || 'not_executed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('requirement_tests')
                .insert(relationData)
                .select()
                .single();

            if (error) {
                // Handle unique constraint violation (relationship already exists)
                if (error.code === '23505') {
                    throw new Error(
                        'This requirement is already linked to this test',
                    );
                }
                throw error;
            }

            return data as RequirementTest;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementTests.root,
            });

            // Invalidate specific requirement and test queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementTests.byRequirement(
                    data.requirement_id,
                ),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementTests.byTest(data.test_id),
            });

            // Invalidate linked requirements count for the test
            queryClient.invalidateQueries({
                queryKey: [
                    ...queryKeys.testReq.detail(data.test_id),
                    'linkedCount',
                ],
            });

            // Invalidate test cases for the requirement
            queryClient.invalidateQueries({
                queryKey: [
                    ...queryKeys.requirements.detail(data.requirement_id),
                    'testCases',
                ],
            });

            // Add the new relationship to the query cache
            queryClient.setQueryData(
                queryKeys.requirementTests.detail(data.id!),
                data,
            );
        },
    });
}
