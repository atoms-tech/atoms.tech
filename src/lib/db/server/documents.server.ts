import { createClient } from '@/lib/supabase/supabaseServer';

export const getProjectDocumentsServer = async (projectId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};

export const getDocumentBlocksAndRequirementsServer = async (
    documentId: string,
) => {
    const supabase = await createClient();
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
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};

export const getDocumentDataServer = async (documentId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};
