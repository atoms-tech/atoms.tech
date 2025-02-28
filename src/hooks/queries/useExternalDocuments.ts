import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export function useExternalDocument(documentId: string) {
    return useQuery({
        queryKey: queryKeys.externalDocuments.detail(documentId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!documentId,
    });
}

export function useExternalDocumentsByOrg(orgId: string) {
    return useQuery({
        queryKey: queryKeys.externalDocuments.byOrg(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;
            return data;
        },
        enabled: !!orgId,
    });
}
