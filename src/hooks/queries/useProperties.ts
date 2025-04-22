import { useQuery } from '@tanstack/react-query';

import { Property } from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

/**
 * Hook to fetch and cache properties for an organization
 */
export function useOrganizationProperties(orgId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.properties.byOrg(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('org_id', orgId)
                .order('name');

            if (error) throw error;
            return data as Property[];
        },
        enabled: !!orgId && enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch and cache properties for a document
 */
export function useDocumentProperties(documentId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.properties.byDocument(documentId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('document_id', documentId)
                .order('name');

            if (error) throw error;
            return data as Property[];
        },
        enabled: !!documentId && enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
