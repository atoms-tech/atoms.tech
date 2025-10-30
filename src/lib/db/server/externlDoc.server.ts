import { withAuth } from '@workos-inc/authkit-nextjs';

import { createSupabaseClientWithToken } from '@/lib/supabase/supabase-authkit';

export async function getExternalDocumentsByOrgServer(orgId: string) {
    const { accessToken } = await withAuth();

    if (!accessToken) {
        throw new Error('Missing WorkOS access token for authenticated Supabase request');
    }

    const supabase = createSupabaseClientWithToken(accessToken);
    const { data, error } = await supabase
        .from('external_documents')
        .select('*')
        .eq('organization_id', orgId);

    if (error) throw error;
    return data;
}
