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
    projectId: _projectId,
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
            _userId: string,
        ) => {
            try {
                // Route through API to enforce membership and use service role
                const res = await fetch(`/api/documents/${documentId}/columns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mode: 'new',
                        blockId,
                        name,
                        propertyType: columnTypeToPropertyType(type),
                        propertyConfig,
                        defaultValue,
                    }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Create property+column failed: ${res.status} ${text}`,
                    );
                }
                const payload = (await res.json()) as {
                    property: Property;
                    column: Column;
                };
                const property = payload.property as Property;
                const column = payload.column as Column;

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
        [documentId, orgId, queryClient],
    );

    const createColumnFromProperty = useCallback(
        async (
            propertyId: string,
            defaultValue: string,
            blockId: string,
            _userId: string,
        ) => {
            try {
                const res = await fetch(`/api/documents/${documentId}/columns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mode: 'fromProperty',
                        blockId,
                        propertyId,
                        defaultValue,
                    }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Create column from property failed: ${res.status} ${text}`,
                    );
                }
                const payload = (await res.json()) as {
                    property?: Property;
                    column: Column;
                };
                const property = payload.property as Property | undefined;
                const column = payload.column as Column;

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

                return property ? { property, column } : { column };
            } catch (error) {
                console.error('Error in createColumnFromProperty:', error);
                throw error;
            }
        },
        [documentId, orgId, queryClient],
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
                            (entry as Record<string, unknown>).column_id === columnId
                        ) {
                            console.log(
                                `[ColumnActions] Deleting key "${key}" from requirement ${req.id}`,
                            );
                            delete currentProps[key];
                        }
                    }
                    delete (currentProps as Record<string, unknown>)[columnId]; // Clean up legacy bug.

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
                const oldName = (oldProperty as { name: string }).name;

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
                            return (
                                (oldName as string) in
                                (req.properties as Record<string, any>)
                            );
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

    return {
        createPropertyAndColumn,
        createColumnFromProperty,
        appendPropertyOptions,
        deleteColumn,
        renameProperty,
    };
};
