import { createClient } from '@/lib/supabase/supabaseServer';

export async function getExternalDocumentsByOrgServer(orgId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('external_documents')
            .select('*')
            .eq('organization_id', orgId);

        if (error) {
            console.error('Database error in getExternalDocumentsByOrgServer:', {
                error,
                orgId,
                errorMessage: error.message,
                errorCode: error.code,
            });
            throw error;
        }

        return data || [];
    } catch (error) {
        // Re-throw with additional context
        if (error instanceof Error) {
            error.message = `Failed to fetch external documents for org ${orgId}: ${error.message}`;
        }
        throw error;
    }
}
