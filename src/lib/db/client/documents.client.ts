import { supabase } from '@/lib/supabase/supabaseBrowser';
import { DocumentSchema } from '@/types/validation/documents.validation';

export const getProjectDocuments = async (projectId: string) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_deleted', false);

    if (error) throw error;
    return data.map((doc) => DocumentSchema.parse(doc));
};

export const getDocumentBlocksAndRequirements = async (documentId: string) => {
    const { data, error } = await supabase
    .from('blocks')
    .select(`
        *,
        requirements:requirements(*)
    `)
    .eq('document_id', documentId)
    .eq('requirements.document_id', documentId)
    .eq('requirements.is_deleted', false)
    .eq('is_deleted', false);

  if (error) throw error;
  return data;
};

export const getDocumentData = async (documentId: string) => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('is_deleted', false)
        .single();

    if (error) throw error;
    return DocumentSchema.parse(data);
};
