import { supabase } from '@/lib/supabase/supabaseBrowser';
import { OrganizationSchema } from '@/types/validation/organizations.validation';

export const getUserOrganizations = async (userId: string) => {
    const { data, error } = await supabase
        .from('organization_members')
        .select(
            `
            organizations!inner(*)
        `,
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching memberships:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        console.log('No memberships found for user:', userId);
        return [];
    }

    const organizations = data.map((member) => member.organizations);
    return organizations.map((org) => OrganizationSchema.parse(org));
};

export const getOrganizationMembers = async (organizationId: string) => {
    const { data, error } = await supabase
        .from('organization_members')
        .select('*, profiles(*)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
}; 