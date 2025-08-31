import { createClient } from '@/lib/supabase/supabaseServer';

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

export const getOrganizationServer = async (orgId: string) => {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .eq('is_deleted', false)
            .single();

        if (error) {
            console.error('Database error in getOrganizationServer:', {
                error,
                orgId,
                errorMessage: error.message,
                errorCode: error.code,
            });
            throw error;
        }

        if (!data) {
            const notFoundError = new Error(`Organization not found: ${orgId}`);
            (notFoundError as Error & { status?: number }).status = 404;
            throw notFoundError;
        }

        return data;
    } catch (error) {
        // Re-throw with additional context
        if (error instanceof Error) {
            error.message = `Failed to fetch organization ${orgId}: ${error.message}`;
        }
        throw error;
    }
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

    return data.map((member) => member.organizations);
};

// Get all organization ids for a user by membership
export const getOrganizationIdsByMembershipServer = async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (error) throw error;
    return data.map((member) => member.organization_id);
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
