import { useMutation, useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import {
    BlockPropertySchema,
    DocumentPropertySchema,
    PropertyKeyValue,
} from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

// Document Property Schemas
export function useDocumentPropertySchemas(documentId: string) {
    return useQuery({
        queryKey: queryKeys.documentPropertySchemas.byDocument(documentId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('document_property_schemas')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false);

            if (error) throw error;
            return data as DocumentPropertySchema[];
        },
        enabled: !!documentId,
    });
}

export function useCreateDocumentPropertySchema() {
    return useMutation({
        mutationFn: async (schema: Partial<DocumentPropertySchema>) => {
            const { data, error } = await supabase
                .from('document_property_schemas')
                .insert({
                    ...schema,
                    id: schema.id || uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data as DocumentPropertySchema;
        },
    });
}

export function useUpdateDocumentPropertySchema() {
    return useMutation({
        mutationFn: async (schema: Partial<DocumentPropertySchema>) => {
            const { data, error } = await supabase
                .from('document_property_schemas')
                .update({
                    ...schema,
                    updated_at: new Date().toISOString(),
                    version: (schema.version || 1) + 1,
                })
                .eq('id', schema.id)
                .select()
                .single();

            if (error) throw error;
            return data as DocumentPropertySchema;
        },
    });
}

// Block Property Schemas
export function useBlockPropertySchemas(blockId: string) {
    console.log('🔍 useBlockPropertySchemas hook called', { blockId });

    return useQuery({
        queryKey: queryKeys.blockPropertySchemas.byBlock(blockId),
        queryFn: async () => {
            console.log('🚀 Fetching block property schemas', { blockId });

            const { data, error } = await supabase
                .from('block_property_schemas')
                .select('*')
                .eq('block_id', blockId)
                .eq('is_deleted', false);

            if (error) {
                console.error(
                    '❌ Error fetching block property schemas:',
                    error,
                );
                throw error;
            }

            console.log('✅ Block property schemas fetched successfully', {
                count: data?.length,
                schemas: data,
            });

            return data as BlockPropertySchema[];
        },
        enabled: !!blockId,
    });
}

export function useCreateBlockPropertySchema() {
    console.log('🔧 useCreateBlockPropertySchema hook initialized');

    return useMutation({
        mutationFn: async (schema: Partial<BlockPropertySchema>) => {
            console.log('🚀 Creating block property schema', schema);

            const { data, error } = await supabase
                .from('block_property_schemas')
                .insert({
                    ...schema,
                    id: schema.id || uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) {
                console.error(
                    '❌ Error creating block property schema:',
                    error,
                );
                throw error;
            }

            console.log('✅ Block property schema created successfully', data);
            return data as BlockPropertySchema;
        },
    });
}

export function useUpdateBlockPropertySchema() {
    return useMutation({
        mutationFn: async (schema: Partial<BlockPropertySchema>) => {
            const { data, error } = await supabase
                .from('block_property_schemas')
                .update({
                    ...schema,
                    updated_at: new Date().toISOString(),
                    version: (schema.version || 1) + 1,
                })
                .eq('id', schema.id)
                .select()
                .single();

            if (error) throw error;
            return data as BlockPropertySchema;
        },
    });
}

// Property Key Values
export function useRequirementPropertyKVs(
    blockId: string,
    requirementId?: string,
) {
    return useQuery({
        queryKey: queryKeys.requirementPropertyKVs.byBlockAndRequirement(
            blockId,
            requirementId,
        ),
        queryFn: async () => {
            let query = supabase
                .from('requirement_property_kv')
                .select('*')
                .eq('block_id', blockId)
                .eq('is_deleted', false);

            if (requirementId) {
                query = query.eq('requirement_id', requirementId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as PropertyKeyValue[];
        },
        enabled: !!blockId,
    });
}

export function useCreatePropertyKV() {
    return useMutation({
        mutationFn: async (kv: Partial<PropertyKeyValue>) => {
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

            if (error) throw error;
            return data as PropertyKeyValue;
        },
    });
}

export function useUpdatePropertyKV() {
    return useMutation({
        mutationFn: async (kv: Partial<PropertyKeyValue>) => {
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

            if (error) throw error;
            return data as PropertyKeyValue;
        },
    });
}

export function useDeletePropertyKV() {
    return useMutation({
        mutationFn: async (kvId: string) => {
            const { data, error } = await supabase
                .from('requirement_property_kv')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                })
                .eq('id', kvId)
                .select()
                .single();

            if (error) throw error;
            return data as PropertyKeyValue;
        },
    });
}
