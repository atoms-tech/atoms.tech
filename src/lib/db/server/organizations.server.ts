import { createClient } from '@/lib/supabase/supabaseServer';
import { OrganizationSchema } from '@/types/validation/organizations.validation';

export const getOrganizationIdBySlugServer = async (slug: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single();
    if (error) throw error;
    return data.id;
};

export const getUserOrganizationsServer = async (userId: string) => {
    const supabase = await createClient();
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

export const getOrganizationMembersServer = async (organizationId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organization_members')
        .select('*, profiles(*)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (error) throw error;
    return data;
};
