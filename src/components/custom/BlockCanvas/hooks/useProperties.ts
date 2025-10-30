import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { Property, PropertyType } from '@/components/custom/BlockCanvas/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Database } from '@/types/base/database.types';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'] & {
    is_deleted?: boolean;
    deleted_by?: string | null;
    deleted_at?: string | null;
};

// Extended Property type for internal use, including extra fields used in the component
interface ExtendedProperty
    extends Omit<Property, 'document_id' | 'property_type' | 'project_id' | 'options'> {
    key?: string;
    position?: number;
    type?: PropertyType;
    document_id?: string | null;
    is_required?: boolean;
    is_hidden?: boolean;
    is_deleted?: boolean;
    is_schema?: boolean;
    description?: string;
    created_by?: string | null;
    updated_by?: string | null;
    deleted_by?: string | null;
    deleted_at?: string | null;
    org_id: string;
    project_id: string | null;
    property_type?: PropertyType;
    options?: Record<string, unknown>;
}

export interface UsePropertiesProps {
    documentId: string;
    blockId?: string;
}

export const useProperties = (documentId: string) => {
    const [isLoading, setIsLoading] = useState(true);
    const [properties, setProperties] = useState<ExtendedProperty[]>([]);
    const queryClient = useQueryClient();
    const { getClientOrThrow } = useAuthenticatedSupabase();

    // Fetch properties for a document or specific block
    const fetchProperties = useCallback(async () => {
        setIsLoading(true);
        try {
            const supabase = getClientOrThrow();
            const query = supabase
                .from('properties')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching properties:', error);
                throw error;
            }

            // Update local state with the fetched properties
            const fetchedProperties = data as ExtendedProperty[];
            setProperties(fetchedProperties);

            // Invalidate related queries to ensure other components get the updated data
            queryClient.invalidateQueries({
                queryKey: queryKeys.properties.byDocument(documentId),
            });

            return fetchedProperties;
        } catch (error) {
            console.error('Error in fetchProperties:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [documentId, getClientOrThrow, queryClient]);

    // Create a new property
    const createProperty = useCallback(
        async (propertyData: ExtendedProperty) => {
            try {
                const supabase = getClientOrThrow();
                const standardPropertyData = {
                    project_id: propertyData.project_id,
                    document_id: propertyData.document_id,
                    org_id: propertyData.org_id,
                    name: propertyData.name,
                    property_type: propertyData.type || PropertyType.text,
                    created_by: propertyData.created_by,
                    updated_by: propertyData.updated_by,
                    options: propertyData.options,
                };

                const insertData: PropertyInsert = {
                    ...standardPropertyData,
                    name:
                        propertyData.key ||
                        propertyData.name.toLowerCase().replace(/\s+/g, '_'),
                    options: standardPropertyData.options
                        ? JSON.stringify(standardPropertyData.options)
                        : null,
                };

                const { data, error } = await supabase
                    .from('properties')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating property:', error);
                throw error;
            }
        },
        [getClientOrThrow],
    );

    // Update a property
    const updateProperty = useCallback(
        async (propertyId: string, updates: Partial<ExtendedProperty>) => {
            try {
                const supabase = getClientOrThrow();
                // Convert updates to match the database schema
                const updateData: PropertyUpdate = {
                    ...updates,
                    options: updates.options
                        ? JSON.stringify(updates.options)
                        : undefined,
                };

                const { data, error } = await supabase
                    .from('properties')
                    .update(updateData)
                    .eq('id', propertyId)
                    .select();

                if (error) {
                    console.error('Error updating property:', error);
                    throw error;
                }

                // Update local state and invalidate queries
                const updatedProperty = data[0] as ExtendedProperty;
                setProperties((prev) =>
                    prev.map((p) => (p.id === propertyId ? updatedProperty : p)),
                );

                // Invalidate related queries
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byDocument(documentId),
                });

                return updatedProperty;
            } catch (error) {
                console.error('Error in updateProperty:', error);
                throw error;
            }
        },
        [documentId, getClientOrThrow, queryClient],
    );

    // Delete a property (soft delete)
    const deleteProperty = useCallback(
        async (propertyId: string, userId: string) => {
            try {
                const supabase = getClientOrThrow();
                const updateData: PropertyUpdate = {
                    is_deleted: true,
                    deleted_by: userId,
                    deleted_at: new Date().toISOString(),
                };

                const { error } = await supabase
                    .from('properties')
                    .update(updateData)
                    .eq('id', propertyId);

                if (error) {
                    console.error('Error deleting property:', error);
                    throw error;
                }

                // Update local state and invalidate queries
                setProperties((prev) => prev.filter((p) => p.id !== propertyId));

                // Invalidate related queries
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byDocument(documentId),
                });

                return true;
            } catch (error) {
                console.error('Error in deleteProperty:', error);
                throw error;
            }
        },
        [documentId, getClientOrThrow, queryClient],
    );

    // Create default properties for a block
    const createDefaultProperties = useCallback(
        async ({
            projectId,
            documentId,
            orgId,
            userId,
        }: {
            projectId: string;
            documentId: string;
            orgId: string;
            userId: string;
        }) => {
            try {
                const supabase = getClientOrThrow();
                const defaultProperties = [
                    {
                        project_id: projectId,
                        document_id: documentId,
                        org_id: orgId,
                        name: 'Name',
                        key: 'name',
                        property_type: PropertyType.text,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        project_id: projectId,
                        document_id: documentId,
                        org_id: orgId,
                        name: 'Description',
                        key: 'description',
                        property_type: PropertyType.text,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        project_id: projectId,
                        document_id: documentId,
                        org_id: orgId,
                        name: 'ID',
                        key: 'id',
                        property_type: PropertyType.text,
                        created_by: userId,
                        updated_by: userId,
                    },
                ];

                const { data, error } = await supabase
                    .from('properties')
                    .insert(defaultProperties)
                    .select();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating default properties:', error);
                throw error;
            }
        },
        [getClientOrThrow],
    );

    // Reorder properties
    const reorderProperties = useCallback(
        async (reorderedProperties: ExtendedProperty[], userId: string) => {
            try {
                const supabase = getClientOrThrow();
                // Update all positions in parallel for better performance
                await Promise.all(
                    reorderedProperties.map((property, index) =>
                        supabase
                            .from('properties')
                            .update({
                                position: (index + 1) * 10, // Use 10, 20, 30... for positions to allow inserting in between
                                updated_by: userId,
                                updated_at: new Date().toISOString(),
                            } as PropertyUpdate)
                            .eq('id', property.id),
                    ),
                );

                // Update local state with new positions
                setProperties(
                    reorderedProperties.map((property, index) => ({
                        ...property,
                        position: (index + 1) * 10,
                    })),
                );

                // Invalidate related queries
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byDocument(documentId),
                });

                return true;
            } catch (error) {
                console.error('Error in reorderProperties:', error);
                throw error;
            }
        },
        [documentId, getClientOrThrow, queryClient],
    );

    return {
        properties,
        isLoading,
        fetchProperties,
        createProperty,
        updateProperty,
        deleteProperty,
        createDefaultProperties,
        reorderProperties,
    };
};
