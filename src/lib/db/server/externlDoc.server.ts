import { createClient } from '@/lib/supabase/supabaseServer';

export async function getExternalDocumentsByOrgServer(orgId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('external_documents')
        .select('*')
        .eq('organization_id', orgId);

    if (error) throw error;
    return data;
}
