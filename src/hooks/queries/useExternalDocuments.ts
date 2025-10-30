import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useExternalDocument(documentId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.externalDocuments.detail(documentId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!documentId && !authLoading,
    });
}

export function useExternalDocumentsByOrg(orgId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.externalDocuments.byOrg(orgId),
        queryFn: async () => {
            if (!orgId) return [];

            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;
            return data;
        },
        enabled: !!orgId && !authLoading,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
}
