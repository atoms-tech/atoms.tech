import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
    EditableColumnType,
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Column, Property, PropertyType } from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Json } from '@/types/base/database.types';

const columnTypeToPropertyType = (type: EditableColumnType): PropertyType => {
    switch (type) {
        case 'text':
            return PropertyType.text;
        case 'number':
            return PropertyType.number;
        case 'select':
            return PropertyType.select;
        case 'multi_select':
            return PropertyType.multi_select;
        case 'date':
            return PropertyType.date;
        default:
            return PropertyType.text;
    }
};

export interface UseColumnActionsProps {
    orgId: string;
    projectId?: string;
    documentId?: string;
}

export const useColumnActions = ({
    orgId,
    projectId,
    documentId,
}: UseColumnActionsProps) => {
    const queryClient = useQueryClient();

    const createPropertyAndColumn = useCallback(
        async (
            name: string,
            type: EditableColumnType,
            propertyConfig: PropertyConfig,
            defaultValue: string,
            blockId: string,
            userId: string,
        ) => {
            try {
                // Step 1: Create the property
                const { data: propertyData, error: propertyError } = await supabase
                    .from('properties')
                    .insert({
                        name,
                        property_type: columnTypeToPropertyType(type),
                        org_id: orgId,
                        project_id: propertyConfig.scope.includes('project')
                            ? projectId
                            : null,
                        document_id: propertyConfig.scope.includes('document')
                            ? documentId
                            : null,
                        is_base: propertyConfig.is_base,
                        options: propertyConfig.options
                            ? { values: propertyConfig.options }
                            : null,
                        scope: propertyConfig.scope.join(','),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: userId,
                        updated_by: userId,
                    })
                    .select()
                    .single();

                if (propertyError) {
                    throw propertyError;
                }

                const property = propertyData as Property;

                // Step 2: Create the column
                const { data: columnData, error: columnError } = await supabase
                    .from('columns')
                    .insert({
                        block_id: blockId,
                        property_id: property.id,
                        position: 0, // This will be updated in a subsequent query
                        width: null,
                        is_hidden: false,
                        is_pinned: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        default_value: defaultValue,
                        created_by: userId,
                        updated_by: userId,
                    })
                    .select()
                    .single();

                if (columnError) {
                    throw columnError;
                }

                const column = columnData as Column;

                // Step 3 Removed: TL;DR Adds clutter and useless db calls. Can safely skip, req saving handles.

                // Invalidate relevant queries
                queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.requirements.byBlock(blockId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byOrg(orgId),
                });

                return { property, column };
            } catch (error) {
                console.error('Error in createPropertyAndColumn:', error);
                throw error;
            }
        },
        [orgId, projectId, documentId, queryClient],
    );

    const createColumnFromProperty = useCallback(
        async (
            propertyId: string,
            defaultValue: string,
            blockId: string,
            userId: string,
        ) => {
            try {
                // Step 1: Get the property details
                const { data: propertyData, error: propertyError } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('id', propertyId)
                    .single();

                if (propertyError) {
                    throw propertyError;
                }

                const property = propertyData as Property;

                // Step 2: Create the column
                const { data: columnData, error: columnError } = await supabase
                    .from('columns')
                    .insert({
                        block_id: blockId,
                        property_id: property.id,
                        position: 0, // This will be updated in a subsequent query
                        width: null,
                        is_hidden: false,
                        is_pinned: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        default_value: defaultValue,
                        created_by: userId,
                        updated_by: userId,
                    })
                    .select()
                    .single();

                if (columnError) {
                    throw columnError;
                }

                const column = columnData as Column;

                // Step 3 Removed: TL;DR Adds clutter and useless db calls. Can safely skip, req saving handles.

                // Invalidate relevant queries
                queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.requirements.byBlock(blockId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byOrg(orgId),
                });

                return { property, column };
            } catch (error) {
                console.error('Error in createColumnFromProperty:', error);
                throw error;
            }
        },
        [queryClient, orgId],
    );

    const deleteColumn = useCallback(
        async (columnId: string, blockId: string) => {
            try {
                console.log('[ColumnActions] Deleting column:', columnId);

                // Step 1: Delete the column itself
                const { error: columnError } = await supabase
                    .from('columns')
                    .delete()
                    .eq('id', columnId);

                if (columnError) {
                    console.error(
                        '[ColumnActions] Failed to delete column record:',
                        columnError,
                    );
                    throw columnError;
                }

                // Step 2: Remove the column from each requirement's properties
                const { data: requirements, error: requirementsError } = await supabase
                    .from('requirements')
                    .select('*')
                    .eq('block_id', blockId)
                    .eq('is_deleted', false);

                if (requirementsError) throw requirementsError;

                const updatePromises = requirements.map((req) => {
                    const originalProps = req.properties;

                    // Ensure it's an object before spreading
                    const currentProps =
                        originalProps &&
                        typeof originalProps === 'object' &&
                        !Array.isArray(originalProps)
                            ? { ...originalProps }
                            : {};

                    // Delete any key that has matching column_id
                    for (const key of Object.keys(currentProps)) {
                        const entry = currentProps[key];
                        if (
                            typeof entry === 'object' &&
                            entry !== null &&
                            'column_id' in entry &&
                            entry.column_id === columnId
                        ) {
                            console.log(
                                `[ColumnActions] Deleting key "${key}" from requirement ${req.id}`,
                            );
                            delete currentProps[key];
                        }
                    }
                    delete currentProps[columnId]; // Clean up legacy bug. Should be remedied when editing a req but meh.

                    return supabase
                        .from('requirements')
                        .update({ properties: currentProps as Json })
                        .eq('id', req.id);
                });

                await Promise.all(updatePromises);

                // Invalidate related caches
                queryClient.invalidateQueries({
                    queryKey: queryKeys.blocks.detail(blockId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.requirements.byBlock(blockId),
                });
            } catch (error) {
                console.error('[ColumnActions] Error deleting column:', error);
                throw error;
            }
        },
        [queryClient],
    );

    return {
        createPropertyAndColumn,
        createColumnFromProperty,
        deleteColumn,
    };
};
