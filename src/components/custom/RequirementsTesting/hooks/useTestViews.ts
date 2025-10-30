// In hooks/useTestMatrixViews.ts

import { PostgrestError } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    Json,
    TestMatrixViewConfiguration,
    TestMatrixViewState,
} from '@/components/custom/RequirementsTesting/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

// We'll need to add these queryKeys
const QUERY_KEYS = {
    testMatrixViews: {
        root: ['testMatrixViews'],
        list: (projectId: string) => [
            ...QUERY_KEYS.testMatrixViews.root,
            'list',
            projectId,
        ],
        detail: (id: string) => [...QUERY_KEYS.testMatrixViews.root, 'detail', id],
    },
};

interface ErrorResponse {
    message: string;
    status: number;
    details?: unknown;
}

// Intentionally unused for now, will be used in future development
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SuccessResponse<T> {
    data: T;
    status: number;
}

const mapSupabaseError = (error: PostgrestError): ErrorResponse => ({
    message: error.message,
    status: error.code === 'PGRST116' ? 404 : 500,
    details: error,
});

export function useTestMatrixViews(projectId: string) {
    const queryClient = useQueryClient();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    // Fetch all views for a project
    const {
        data: _views = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: QUERY_KEYS.testMatrixViews.list(projectId),
        queryFn: async () => {
            const supabase = getClientOrThrow();
            const { data, error } = await supabase
                .from('test_matrix_views')
                .select('*')
                .eq('project_id', projectId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map((view) => ({
                id: view.id,
                name: view.name,
                projectId: view.project_id,
                configuration:
                    view.configuration as unknown as TestMatrixViewConfiguration,
                isDefault: view.is_default,
                createdAt: view.created_at,
                updatedAt: view.updated_at,
            })) as TestMatrixViewState[];
        },
        enabled: !!projectId && !!supabase && !authLoading && !authError,
    });

    // Create a new view
    const createView = useMutation<
        TestMatrixViewState,
        ErrorResponse,
        Omit<TestMatrixViewState, 'id'>
    >({
        mutationFn: async (newView: Omit<TestMatrixViewState, 'id'>) => {
            // If setting as default, unset any existing defaults
            if (newView.isDefault) {
                const supabase = getClientOrThrow();
                await supabase
                    .from('test_matrix_views')
                    .update({ is_default: false })
                    .eq('project_id', newView.projectId)
                    .eq('is_default', true);
            }

            const supabase = getClientOrThrow();
            const currentUser = (await supabase.auth.getUser()).data.user;
            const currentUserId = currentUser?.id || '';

            const { data, error } = await supabase
                .from('test_matrix_views')
                .insert({
                    name: newView.name,
                    project_id: newView.projectId,
                    configuration: newView.configuration as unknown as Json,
                    created_by: currentUserId,
                    updated_by: currentUserId,
                    is_default: newView.isDefault || false,
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                name: data.name,
                projectId: data.project_id,
                configuration:
                    data.configuration as unknown as TestMatrixViewConfiguration,
                isDefault: data.is_default,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            } as TestMatrixViewState;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.testMatrixViews.list(data.projectId),
            });
        },
    });

    // Update an existing view
    const updateView = useMutation<
        TestMatrixViewState,
        ErrorResponse,
        TestMatrixViewState
    >({
        mutationFn: async (updatedView: TestMatrixViewState) => {
            if (!updatedView.id) throw new Error('View ID is required for updates');

            // If setting as default, unset any existing defaults
            if (updatedView.isDefault) {
                const supabase = getClientOrThrow();
                await supabase
                    .from('test_matrix_views')
                    .update({ is_default: false })
                    .eq('project_id', updatedView.projectId)
                    .eq('is_default', true)
                    .neq('id', updatedView.id);
            }

            const supabase = getClientOrThrow();
            const { data, error } = await supabase
                .from('test_matrix_views')
                .update({
                    name: updatedView.name,
                    configuration: updatedView.configuration as unknown as Json,
                    updated_at: new Date().toISOString(),
                    is_default: updatedView.isDefault || false,
                })
                .eq('id', updatedView.id)
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                name: data.name,
                projectId: data.project_id,
                configuration:
                    data.configuration as unknown as TestMatrixViewConfiguration,
                isDefault: data.is_default,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            } as TestMatrixViewState;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.testMatrixViews.list(data.projectId),
            });
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.testMatrixViews.detail(data.id as string),
            });
        },
    });

    // Delete a view (soft delete by setting is_active to false)
    const deleteView = useMutation<void, ErrorResponse, { id: string }>({
        mutationFn: async ({ id }) => {
            const supabase = getClientOrThrow();
            const { error } = await supabase
                .from('test_matrix_views')
                .update({ is_active: false })
                .eq('id', id);

            if (error) {
                throw mapSupabaseError(error);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.setQueryData(
                QUERY_KEYS.testMatrixViews.list(projectId),
                (oldData: TestMatrixViewState[] = []) =>
                    oldData.filter((view) => view.id !== variables.id),
            );
        },
    });

    // Get a view by ID
    const getViewById = async (viewId: string) => {
        const supabase = getClientOrThrow();
        const { data, error } = await supabase
            .from('test_matrix_views')
            .select('*')
            .eq('id', viewId)
            .eq('is_active', true)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            projectId: data.project_id,
            configuration: data.configuration as unknown as TestMatrixViewConfiguration,
            isDefault: data.is_default,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        } as TestMatrixViewState;
    };

    // Get the default view
    const getDefaultView = async () => {
        try {
            const supabase = getClientOrThrow();
            const { data, error } = await supabase
                .from('test_matrix_views')
                .select('*')
                .eq('project_id', projectId)
                .eq('is_default', true)
                .eq('is_active', true)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    // If no default view, return the first active view or null
                    const { data: firstView, error: firstViewError } = await supabase
                        .from('test_matrix_views')
                        .select('*')
                        .eq('project_id', projectId)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (firstViewError || !firstView) {
                        return null;
                    }

                    return {
                        id: firstView.id,
                        name: firstView.name,
                        projectId: firstView.project_id,
                        configuration:
                            firstView.configuration as unknown as TestMatrixViewConfiguration,
                        isDefault: firstView.is_default,
                        createdAt: firstView.created_at,
                        updatedAt: firstView.updated_at,
                    } as TestMatrixViewState;
                }
                throw error;
            }

            return {
                id: data.id,
                name: data.name,
                projectId: data.project_id,
                configuration:
                    data.configuration as unknown as TestMatrixViewConfiguration,
                isDefault: data.is_default,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            } as TestMatrixViewState;
        } catch (error) {
            // If there's any other error, return null instead of throwing
            console.error('Error fetching default view:', error);
            return null;
        }
    };

    return {
        views: _views,
        isLoading,
        error,
        createView,
        updateView,
        deleteView,
        getViewById,
        getDefaultView,
    };
}
