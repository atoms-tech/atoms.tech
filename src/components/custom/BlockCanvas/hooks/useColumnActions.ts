import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
    EditableColumnType,
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Column, Property, PropertyType } from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database, Json } from '@/types/base/database.types';

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
        case 'people':
            // Store as multi_select in DB, with options.format = 'people'
            return PropertyType.multi_select;
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
                        options:
                            type === 'people'
                                ? ({
                                      values: propertyConfig.options ?? [],
                                      format: 'people',
                                  } as unknown as Json)
                                : propertyConfig.options
                                  ? ({
                                        values: propertyConfig.options,
                                    } as unknown as Json)
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

    // Append options to a property's options.values list
    const appendPropertyOptions = useCallback(
        async (propertyId: string, newValues: string[]) => {
            // Fetch current property
            const { data: prop, error: fetchErr } = await supabase
                .from('properties')
                .select('id, options')
                .eq('id', propertyId)
                .single();
            if (fetchErr) throw fetchErr;

            type PropertyRow = Database['public']['Tables']['properties']['Row'];
            const typedProp = prop as unknown as PropertyRow;
            const rawValues = (typedProp as { options: { values?: unknown } } | null)
                ?.options?.values;
            const currValues: string[] = Array.isArray(rawValues)
                ? (rawValues as string[])
                : [];

            const merged = Array.from(
                new Set([...(currValues || []), ...newValues].filter((v) => !!v)),
            );

            const { error: updErr } = await supabase
                .from('properties')
                .update({ options: { values: merged } as unknown as Json })
                .eq('id', propertyId);
            if (updErr) throw updErr;

            // Invalidate property caches
            await queryClient.invalidateQueries({ queryKey: queryKeys.properties.root });
            return merged;
        },
        [queryClient],
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

    // Not needed as we manage metadata at the block level.
    // const updateColumnsMetadata = useCallback(
    //     async (
    //         blockId: string,
    //         updates: { propertyName: string; width?: number; position: number }[],
    //     ) => {
    //         if (!blockId) {
    //             throw new Error(
    //                 '[updateColumnsMetadata] blockId is required but was undefined.',
    //             );
    //         }

    //         // 1. Load all columns for this block (including their associated properties)
    //         const { data: columnsData, error: fetchError } = await supabase
    //             .from('columns')
    //             .select('id, width, position, property:properties(name)')
    //             .eq('block_id', blockId);

    //         if (fetchError) {
    //             console.error(
    //                 '[updateColumnsMetadata] Failed to fetch columns:',
    //                 fetchError,
    //             );
    //             throw fetchError;
    //         }

    //         const dbColumns = columnsData as {
    //             id: string;
    //             position: number;
    //             width: number | null;
    //             property: { name: string };
    //         }[];

    //         // 2. Match and prepare update payloads
    //         const updatesToApply = updates
    //             .map((col) => {
    //                 const match = dbColumns.find(
    //                     (c) => c.property?.name === col.propertyName,
    //                 );
    //                 if (!match) return null;

    //                 return {
    //                     id: match.id,
    //                     position: col.position,
    //                     width: col.width ?? match.width ?? 150,
    //                     updated_at: new Date().toISOString(),
    //                 };
    //             })
    //             .filter(
    //                 (
    //                     colFormat,
    //                 ): colFormat is {
    //                     id: string;
    //                     position: number;
    //                     width: number;
    //                     updated_at: string;
    //                 } => colFormat !== null,
    //             );

    //         if (updatesToApply.length === 0) {
    //             console.warn('[updateColumnsMetadata] No matching columns to update.');
    //             return;
    //         }

    //         // 3. Perform batch update
    //         for (const update of updatesToApply) {
    //             const { error: updateError } = await supabase
    //                 .from('columns')
    //                 .update({
    //                     position: update.position,
    //                     width: update.width,
    //                     updated_at: update.updated_at,
    //                 })
    //                 .eq('id', update.id);

    //             if (updateError) {
    //                 console.error(
    //                     `[updateColumnsMetadata] Failed to update column ${update.id}:`,
    //                     updateError,
    //                 );
    //                 throw updateError;
    //             }
    //         }

    //         // 4. Invalidate cache
    //         await queryClient.invalidateQueries({
    //             queryKey: queryKeys.blocks.detail(blockId),
    //         });
    //     },
    //     [queryClient],
    // );

    return {
        createPropertyAndColumn,
        createColumnFromProperty,
        appendPropertyOptions,
        deleteColumn,
    };
};
