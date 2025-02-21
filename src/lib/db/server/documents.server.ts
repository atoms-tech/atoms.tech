import { createClient } from '@/lib/supabase/supabaseServer';
import { Document } from '@/types/base/documents.types';
import { DocumentSchema } from '@/types/validation/documents.validation';

export const getProjectDocumentsServer = async (projectId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data.map((doc) => DocumentSchema.parse(doc));
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
    return DocumentSchema.parse(data) as Document;
};
