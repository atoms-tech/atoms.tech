import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import type { Database } from '@/types/base/database.types';

export function usePeopleOptions(orgId?: string, projectId?: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: ['people-options', orgId ?? null, projectId ?? null],
        queryFn: async () => {
            const supabase = getClientOrThrow();
            // Prefer project members; fallback to org members
            if (projectId) {
                type MemberRow = Pick<
                    Database['public']['Tables']['project_members']['Row'],
                    'user_id'
                >;
                const { data: members, error } = await supabase
                    .from('project_members')
                    .select('user_id')
                    .eq('project_id', projectId)
                    .eq('status', 'active')
                    .returns<MemberRow[]>();
                if (error) throw error;
                const userIds = (members ?? []).map((m) => m.user_id);
                if (userIds.length === 0) return [] as string[];
                type ProfileRow = Pick<
                    Database['public']['Tables']['profiles']['Row'],
                    'id' | 'full_name'
                >;
                const { data: profiles, error: pErr } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds)
                    .returns<ProfileRow[]>();
                if (pErr) throw pErr;
                return (profiles ?? []).map((p) => p.full_name || '').filter((x) => x);
            }

            if (orgId) {
                type OrgMemberRow = Pick<
                    Database['public']['Tables']['organization_members']['Row'],
                    'user_id'
                >;
                const { data: members, error } = await supabase
                    .from('organization_members')
                    .select('user_id')
                    .eq('organization_id', orgId)
                    .eq('status', 'active')
                    .returns<OrgMemberRow[]>();
                if (error) throw error;
                const userIds = (members ?? []).map((m) => m.user_id);
                if (userIds.length === 0) return [] as string[];
                type ProfileRow = Pick<
                    Database['public']['Tables']['profiles']['Row'],
                    'id' | 'full_name'
                >;
                const { data: profiles, error: pErr } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds)
                    .returns<ProfileRow[]>();
                if (pErr) throw pErr;
                return (profiles ?? []).map((p) => p.full_name || '').filter((x) => x);
            }

            return [] as string[];
        },
        enabled: Boolean((orgId || projectId) && supabase && !authLoading && !authError),
        staleTime: 600_000,
    });
}
