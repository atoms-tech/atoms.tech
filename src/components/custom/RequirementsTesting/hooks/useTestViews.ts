// In hooks/useTestMatrixViews.ts

import { PostgrestError } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    Json,
    TestMatrixViewConfiguration,
    TestMatrixViewState,
} from '@/components/custom/RequirementsTesting/types';
import { atomsApiClient } from '@/lib/atoms-api';

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

const _mapSupabaseError = (error: PostgrestError): ErrorResponse => ({
    message: error.message,
    status: error.code === 'PGRST116' ? 404 : 500,
    details: error,
});

export function useTestMatrixViews(projectId: string) {
    const queryClient = useQueryClient();

    // Fetch all views for a project
    const {
        data: _views = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: QUERY_KEYS.testMatrixViews.list(projectId),
        queryFn: async () => {
            const api = atomsApiClient();
            const rows = await api.testMatrixViews.listByProject(projectId);
            return rows.map((view: any) => ({
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
        enabled: !!projectId,
    });

    // Create a new view
    const createView = useMutation<
        TestMatrixViewState,
        ErrorResponse,
        Omit<TestMatrixViewState, 'id'>
    >({
        mutationFn: async (newView: Omit<TestMatrixViewState, 'id'>) => {
            // If setting as default, unset any existing defaults
            const api = atomsApiClient();
            if (newView.isDefault) {
                await api.testMatrixViews.unsetDefaults(newView.projectId);
            }
            const currentUser = await api.auth.getUser();
            const data = await api.testMatrixViews.insert({
                name: newView.name,
                project_id: newView.projectId,
                configuration: newView.configuration as unknown as Json,
                created_by: currentUser?.id || '',
                updated_by: currentUser?.id || '',
                is_default: newView.isDefault || false,
            });

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
            const api = atomsApiClient();
            if (updatedView.isDefault) {
                await api.testMatrixViews.unsetDefaults(
                    updatedView.projectId,
                    updatedView.id as string,
                );
            }
            const data = await api.testMatrixViews.update(updatedView.id as string, {
                name: updatedView.name,
                configuration: updatedView.configuration as unknown as Json,
                updated_at: new Date().toISOString(),
                is_default: updatedView.isDefault || false,
            });
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
            const api = atomsApiClient();
            await api.testMatrixViews.softDelete(id);
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
        const api = atomsApiClient();
        const data = await api.testMatrixViews.getById(viewId);

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
            const api = atomsApiClient();
            try {
                const data = await api.testMatrixViews.getDefault(projectId);
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
            } catch (error: any) {
                if (error.code === 'PGRST116') {
                    // No rows found
                    // If no default view, return the first active view or null
                    try {
                        const firstView =
                            await api.testMatrixViews.getFirstActive(projectId);
                        if (!firstView) return null;
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
                    } catch {
                        return null;
                    }
                }
                throw error;
            }
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
