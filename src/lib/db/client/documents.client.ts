import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

export const getProjectDocuments = async (
    supabase: SupabaseClient<Database>,
    projectId: string,
) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};

export const getDocumentBlocksAndRequirements = async (
    supabase: SupabaseClient<Database>,
    documentId: string,
) => {
    const { data, error } = await supabase
        .from('blocks')
        .select(
            `
        *,
        requirements:requirements(*)
    `,
        )
        .eq('document_id', documentId)
        .eq('requirements.document_id', documentId)
        .eq('requirements.is_deleted', false)
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};

export const getDocumentData = async (
    supabase: SupabaseClient<Database>,
    documentId: string,
) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('is_deleted', false)
        .single();

    if (error) throw error;
    return data;
};
