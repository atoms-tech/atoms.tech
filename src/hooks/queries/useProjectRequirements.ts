import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Requirement } from '@/types/base/requirements.types';

export function useProjectRequirements(projectId: string) {
    return useQuery({
        queryKey: queryKeys.requirements.byProject(projectId),
        queryFn: async () => {
            if (!projectId) return [];

            // Get all documents for the project first
            const { data: documents } = await supabase
                .from('documents')
                .select('id')
                .eq('project_id', projectId);

            if (!documents || documents.length === 0) return [];

            const documentIds = documents.map((doc) => doc.id);

            // Get all requirements for these documents
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('document_id', documentIds)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Requirement[];
        },
        enabled: !!projectId,
    });
}

export function useSearchProjectRequirements(
    projectId: string,
    searchQuery: string,
) {
    return useQuery({
        queryKey: [
            ...queryKeys.requirements.byProject(projectId),
            'search',
            searchQuery,
        ],
        queryFn: async () => {
            if (!projectId || !searchQuery.trim()) return [];

            // Get all documents for the project first
            const { data: documents } = await supabase
                .from('documents')
                .select('id')
                .eq('project_id', projectId);

            if (!documents || documents.length === 0) return [];

            const documentIds = documents.map((doc) => doc.id);
            const query = searchQuery.toLowerCase();

            // Search requirements with text search
            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('document_id', documentIds)
                .eq('is_deleted', false)
                .or(
                    `name.ilike.%${query}%,description.ilike.%${query}%,external_id.ilike.%${query}%`,
                )
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Additional filtering for tags (since Supabase doesn't support array text search easily)
            const filtered = (data as Requirement[]).filter((req) => {
                if (req.tags && Array.isArray(req.tags)) {
                    return req.tags.some((tag) =>
                        tag.toLowerCase().includes(query),
                    );
                }
                return true; // Include if already matched by name/description/external_id
            });

            return filtered;
        },
        enabled: !!projectId && !!searchQuery.trim(),
    });
}
