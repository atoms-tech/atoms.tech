import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { PropertyKeyValue } from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

import { useSyncRequirementData } from './useRequirementMutations';

// Create a single property KV
export function useCreatePropertyKV() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (kv: Partial<PropertyKeyValue>) => {
            console.log('🚀 Creating property KV', kv);

            // Ensure position is set
            if (kv.position === undefined) {
                console.warn(
                    '⚠️ Position not provided for property KV, defaulting to 0',
                );
                kv.position = 0;
            }

            const { data, error } = await supabase
                .from('requirement_property_kv')
                .insert({
                    ...kv,
                    id: kv.id || uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating property KV:', error);
                throw error;
            }

            console.log('✅ Property KV created successfully', data);
            return data as PropertyKeyValue;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementPropertyKVs.byRequirement(
                    data.requirement_id,
                ),
            });
        },
    });
}

// Update a single property KV
export function useUpdatePropertyKV() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (kv: Partial<PropertyKeyValue>) => {
            console.log('🚀 Updating property KV', kv);

            const { data, error } = await supabase
                .from('requirement_property_kv')
                .update({
                    ...kv,
                    updated_at: new Date().toISOString(),
                    version: (kv.version || 1) + 1,
                })
                .eq('id', kv.id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating property KV:', error);
                throw error;
            }

            console.log('✅ Property KV updated successfully', data);
            return data as PropertyKeyValue;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementPropertyKVs.byRequirement(
                    data.requirement_id,
                ),
            });
        },
    });
}

// Delete a property KV (soft delete)
export function useDeletePropertyKV() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            requirementId,
        }: {
            id: string;
            requirementId: string;
        }) => {
            console.log('🚀 Deleting property KV', { id, requirementId });

            const { data, error } = await supabase
                .from('requirement_property_kv')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error deleting property KV:', error);
                throw error;
            }

            console.log('✅ Property KV deleted successfully', data);
            return data as PropertyKeyValue;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.requirementPropertyKVs.byRequirement(
                    data.requirement_id,
                ),
            });
        },
    });
}

// Sync requirement data with property KVs
export function useSyncRequirementDataWithKVs() {
    const createPropertyKVMutation = useCreatePropertyKV();
    const updatePropertyKVMutation = useUpdatePropertyKV();
    const syncRequirementDataMutation = useSyncRequirementData();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            requirementId,
            blockId,
            data,
            userId,
        }: {
            requirementId: string;
            blockId: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: Record<string, any>;
            userId: string;
        }) => {
            console.log('🔄 Syncing requirement data with KVs', {
                requirementId,
                blockId,
                data,
            });

            try {
                // First, sync the requirement data field
                console.log('🚀 Updating requirement data field');
                await syncRequirementDataMutation.mutateAsync({
                    requirementId,
                    data,
                    userId,
                });

                // Then, get existing KVs for this requirement
                console.log('🔍 Fetching existing KVs for requirement');
                const { data: existingKVs, error: fetchError } = await supabase
                    .from('requirement_property_kv')
                    .select('*')
                    .eq('requirement_id', requirementId)
                    .eq('is_deleted', false);

                if (fetchError) {
                    console.error(
                        '❌ Error fetching existing KVs:',
                        fetchError,
                    );
                    throw fetchError;
                }

                console.log('✅ Fetched existing KVs', {
                    count: existingKVs?.length,
                });

                // Create or update KVs for each property in the data object
                const kvPromises = Object.entries(data).map(
                    async ([key, value], index) => {
                        const existingKV = existingKVs?.find(
                            (kv) => kv.property_name === key,
                        );

                        if (existingKV) {
                            // Update existing KV if value changed
                            if (existingKV.property_value !== String(value)) {
                                console.log('🔄 Updating existing KV', {
                                    key,
                                    value,
                                    existingValue: existingKV.property_value,
                                });
                                return updatePropertyKVMutation.mutateAsync({
                                    id: existingKV.id,
                                    property_value: String(value),
                                    position: existingKV.position,
                                    updated_by: userId,
                                });
                            }
                            return existingKV;
                        } else {
                            // Create new KV
                            console.log('➕ Creating new KV', { key, value });
                            return createPropertyKVMutation.mutateAsync({
                                requirement_id: requirementId,
                                block_id: blockId,
                                property_name: key,
                                property_value: String(value),
                                position: index,
                                created_by: userId,
                                updated_by: userId,
                            } as Partial<PropertyKeyValue>);
                        }
                    },
                );

                const results = await Promise.all(kvPromises);
                console.log('✅ All KVs synced successfully', {
                    count: results.length,
                });

                // Invalidate queries to ensure UI is updated
                queryClient.invalidateQueries({
                    queryKey:
                        queryKeys.requirementPropertyKVs.byRequirement(
                            requirementId,
                        ),
                });

                return results;
            } catch (error) {
                console.error(
                    '❌ Error syncing requirement data with KVs:',
                    error,
                );
                throw error;
            }
        },
    });
}
