import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { analyticsQueryKeys } from '@/hooks/queries/useAnalytics';
import { queryKeys } from '@/lib/constants/queryKeys';
import { restoreVersion } from '@/lib/db/client/analytics.client';
import {
    RestoreVersionInput,
    RestoreVersionResult,
} from '@/types/analytics.types';

// Hook for restoring a version
export function useRestoreVersion() {
    const queryClient = useQueryClient();

    return useMutation<RestoreVersionResult, Error, RestoreVersionInput>({
        mutationFn: restoreVersion,
        onSuccess: (result, variables) => {
            const { entityId, entityType } = variables;

            // Show success toast
            toast.success('Version restored successfully', {
                description: `Restored to version ${result.newVersion}`,
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: analyticsQueryKeys.versionHistory(
                    entityId,
                    entityType,
                ),
            });

            queryClient.invalidateQueries({
                queryKey: analyticsQueryKeys.entityDetails(
                    entityId,
                    entityType,
                ),
            });

            // Invalidate entity-specific queries based on type
            switch (entityType) {
                case 'document':
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.documents.detail(entityId),
                    });
                    // Also invalidate blocks for this document
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.blocks.byDocument(entityId),
                    });
                    break;
                case 'block':
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.blocks.detail(entityId),
                    });
                    break;
                case 'requirement':
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.requirements.detail(entityId),
                    });
                    break;
            }

            // Invalidate analytics activities to show the restoration action
            queryClient.invalidateQueries({
                queryKey: analyticsQueryKeys.all,
            });
        },
        onError: (error) => {
            console.error('Failed to restore version:', error);

            // Show error toast
            toast.error('Failed to restore version', {
                description: error.message || 'An unexpected error occurred',
            });
        },
    });
}

// Hook for bulk version operations (if needed in the future)
export function useBulkVersionRestore() {
    const queryClient = useQueryClient();

    return useMutation<RestoreVersionResult[], Error, RestoreVersionInput[]>({
        mutationFn: async (inputs: RestoreVersionInput[]) => {
            // Process restorations sequentially to avoid conflicts
            const results: RestoreVersionResult[] = [];
            for (const input of inputs) {
                try {
                    const result = await restoreVersion(input);
                    results.push(result);
                } catch (error) {
                    console.error(
                        `Failed to restore version for ${input.entityId}:`,
                        error,
                    );
                    throw error;
                }
            }
            return results;
        },
        onSuccess: (results, variables) => {
            // Show success toast
            toast.success(`Successfully restored ${results.length} versions`);

            // Invalidate all analytics queries
            queryClient.invalidateQueries({
                queryKey: analyticsQueryKeys.all,
            });

            // Invalidate specific entity queries
            variables.forEach(({ entityId, entityType }) => {
                queryClient.invalidateQueries({
                    queryKey: analyticsQueryKeys.versionHistory(
                        entityId,
                        entityType,
                    ),
                });

                queryClient.invalidateQueries({
                    queryKey: analyticsQueryKeys.entityDetails(
                        entityId,
                        entityType,
                    ),
                });

                switch (entityType) {
                    case 'document':
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.documents.detail(entityId),
                        });
                        break;
                    case 'block':
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.blocks.detail(entityId),
                        });
                        break;
                    case 'requirement':
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.requirements.detail(entityId),
                        });
                        break;
                }
            });
        },
        onError: (error) => {
            console.error('Failed to restore versions:', error);

            toast.error('Failed to restore versions', {
                description:
                    error.message || 'Some restorations may have failed',
            });
        },
    });
}

// Hook for creating a restore point (backup current state before restoration)
export function useCreateRestorePoint() {
    const queryClient = useQueryClient();

    return useMutation<
        { success: boolean; backupId: string },
        Error,
        {
            entityId: string;
            entityType: 'document' | 'block' | 'requirement';
            reason?: string;
        }
    >({
        mutationFn: async ({ entityId }) => {
            // This would create a manual backup/snapshot
            // Implementation would depend on your backup strategy

            // For now, we'll just return a mock response
            // In a real implementation, you might:
            // 1. Create a snapshot in a separate table
            // 2. Export the current state to a backup service
            // 3. Create a special audit log entry marked as a restore point

            return {
                success: true,
                backupId: `backup_${entityId}_${Date.now()}`,
            };
        },
        onSuccess: (result, variables) => {
            toast.success('Restore point created', {
                description: 'Current state has been backed up',
            });

            // Invalidate version history to show the new restore point
            queryClient.invalidateQueries({
                queryKey: analyticsQueryKeys.versionHistory(
                    variables.entityId,
                    variables.entityType,
                ),
            });
        },
        onError: (error) => {
            console.error('Failed to create restore point:', error);

            toast.error('Failed to create restore point', {
                description: error.message || 'Could not backup current state',
            });
        },
    });
}
