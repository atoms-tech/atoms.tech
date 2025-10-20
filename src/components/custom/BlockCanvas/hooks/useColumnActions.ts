import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    EditableColumnType,
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Column, Property, PropertyType } from '@/components/custom/BlockCanvas/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
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
    const { getClientOrThrow } = useAuthenticatedSupabase();

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
                const supabase = getClientOrThrow();
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

                // step 2: get the max position of existing columns for this block
                const { data: existingColumns } = await supabase
                    .from('columns')
                    .select('position')
                    .eq('block_id', blockId);

                const maxPosition =
                    existingColumns && existingColumns.length > 0
                        ? Math.max(...existingColumns.map((c) => c.position ?? 0))
                        : -1;

                // step 3: create the column at the end
                const { data: columnData, error: columnError } = await supabase
                    .from('columns')
                    .insert({
                        block_id: blockId,
                        property_id: property.id,
                        position: maxPosition + 1, // place at the end, not at 0
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
        [documentId, getClientOrThrow, orgId, projectId, queryClient],
    );

    const createColumnFromProperty = useCallback(
        async (
            propertyId: string,
            defaultValue: string,
            blockId: string,
            userId: string,
        ) => {
            try {
                const supabase = getClientOrThrow();
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

                // step 2: get the max position of existing columns for this block
                const { data: existingColumns } = await supabase
                    .from('columns')
                    .select('position')
                    .eq('block_id', blockId);

                const maxPosition =
                    existingColumns && existingColumns.length > 0
                        ? Math.max(...existingColumns.map((c) => c.position ?? 0))
                        : -1;

                // step 3: create the column at the end
                const { data: columnData, error: columnError } = await supabase
                    .from('columns')
                    .insert({
                        block_id: blockId,
                        property_id: property.id,
                        position: maxPosition + 1, // place at the end
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
        [getClientOrThrow, orgId, queryClient],
    );

    // Append options to a property's options.values list
    const appendPropertyOptions = useCallback(
        async (propertyId: string, newValues: string[]) => {
            const supabase = getClientOrThrow();
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
        [getClientOrThrow, queryClient],
    );

    const deleteColumn = useCallback(
        async (columnId: string, blockId: string) => {
            try {
                console.log('[ColumnActions] Deleting column:', columnId);
                const supabase = getClientOrThrow();

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

                    // ensure it's an object before spreading
                    const currentProps =
                        originalProps &&
                        typeof originalProps === 'object' &&
                        !Array.isArray(originalProps)
                            ? { ...originalProps }
                            : {};

                    // safely get keys - handle null/undefined case
                    const keys = currentProps ? Object.keys(currentProps) : [];

                    // delete any key that has matching column_id
                    for (const key of keys) {
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
        [getClientOrThrow, queryClient],
    );

    // rename a property and update associated column
    const renameProperty = useCallback(
        async (propertyId: string, newName: string) => {
            try {
                const supabase = getClientOrThrow();
                // First get the old property name
                const { data: oldProperty, error: fetchError } = await supabase
                    .from('properties')
                    .select('name')
                    .eq('id', propertyId)
                    .single();

                if (fetchError) throw fetchError;
                const oldName = oldProperty.name;

                // Update the property name
                const { data, error } = await supabase
                    .from('properties')
                    .update({
                        name: newName,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', propertyId)
                    .select()
                    .single();

                if (error) throw error;

                // CRITICAL: Migrate existing data in requirements table
                // Find all requirements that have this property
                const { data: requirements, error: reqError } = await supabase
                    .from('requirements')
                    .select('id, properties')
                    .not('properties', 'is', null);

                if (!reqError && requirements) {
                    // Update each requirement's properties JSON
                    const updates = requirements
                        .filter((req) => {
                            // Type guard to ensure properties is an object
                            if (
                                !req.properties ||
                                typeof req.properties !== 'object' ||
                                Array.isArray(req.properties)
                            ) {
                                return false;
                            }
                            // Check if old name exists in properties
                            return oldName in (req.properties as Record<string, any>);
                        })
                        .map((req) => {
                            // We know properties is an object here due to the filter above
                            const props = req.properties as Record<string, any>;
                            const newProps: Record<string, any> = {};

                            // Copy all properties, renaming the key if it matches oldName
                            Object.keys(props).forEach((key) => {
                                if (key === oldName) {
                                    newProps[newName] = props[key];
                                } else {
                                    newProps[key] = props[key];
                                }
                            });

                            return {
                                id: req.id,
                                properties: newProps as Json,
                            };
                        });

                    // Batch update all affected requirements
                    for (const update of updates) {
                        await supabase
                            .from('requirements')
                            .update({ properties: update.properties })
                            .eq('id', update.id);
                    }
                }

                // Invalidate relevant queries
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.root,
                });
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.requirements.root,
                });

                return data;
            } catch (error) {
                console.error('[useColumnActions] Failed to rename property:', error);
                throw error;
            }
        },
        [getClientOrThrow, queryClient],
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
        renameProperty,
    };
};
