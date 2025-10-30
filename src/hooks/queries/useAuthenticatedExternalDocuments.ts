import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useAuthenticatedExternalDocumentsByOrg(orgId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: _authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.externalDocuments.byOrg(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            const { data, error } = await supabase
                .from('external_documents')
                .select('*')
                .eq('organization_id', orgId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching external documents:', error);
                throw error;
            }

            return data || [];
        },
        enabled: !!orgId && !authLoading && !!supabase,
    });
}
