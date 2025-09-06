import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createOrgInvitationsDomain(supabase: SupabaseAny) {
    return {
        async listByEmail(email: string) {
            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('email', email)
                .neq('status', 'rejected');
            if (error) throw error;
            return data ?? [];
        },
        async listByCreator(userId: string) {
            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('created_by', userId);
            if (error) throw error;
            return data ?? [];
        },
        async listByOrganization(orgId: string) {
            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('organization_id', orgId);
            if (error) throw error;
            return data ?? [];
        },

        async updateStatus(
            id: string,
            status: import('@/types/base/database.types').Database['public']['Enums']['invitation_status'],
            updated_by: string,
        ) {
            const { error } = await supabase
                .from('organization_invitations')
                .update({ status, updated_by })
                .eq('id', id);
            if (error) throw error;
            return { id, status };
        },
    };
}

export type OrgInvitationsDomain = ReturnType<typeof createOrgInvitationsDomain>;
