import { supabase } from '@/lib/supabase/supabaseBrowser';
import { BillingPlan, OrganizationType, PricingPlanInterval } from '@/types';

export const getUserOrganizations = async (userId: string) => {
    if (!userId) {
        console.log('No userId provided to getUserOrganizations');
        return [];
    }

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

    try {
        return data.map((member) => member.organizations);
    } catch (error) {
        console.error('Error parsing organizations:', error);
        return [];
    }
};

export const getOrganizationMembers = async (organizationId: string) => {
    // Fetch all members of the organization along with their roles
    const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .eq('is_deleted', false);

    if (membersError) {
        console.error('Error fetching organization members:', membersError);
        throw membersError;
    }

    if (!members || members.length === 0) {
        console.log('No members found for organization:', organizationId);
        return [];
    }

    // Extract user IDs and roles from the members
    const userIds = members.map((member) => member.user_id);
    const userRoles = members.reduce(
        (acc, member) => {
            acc[member.user_id] = member.role;
            return acc;
        },
        {} as Record<string, string>,
    );

    // Fetch profiles for the extracted user IDs
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
    }

    // Attach roles to the profiles
    return profiles.map((profile) => ({
        ...profile,
        role: userRoles[profile.id],
    }));
};

/**
 * Ensures that a user has a personal organization, creating one if it doesn't exist
 * @param userId The user ID to ensure has a personal organization
 * @param email The user's email (used for naming the organization)
 * @returns The personal organization
 */
export const ensurePersonalOrganization = async (
    userId: string,
    email: string,
) => {
    // First, check if the user already has a personal organization
    const { data: existingOrgs, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', userId)
        .eq('type', OrganizationType.personal)
        .eq('is_deleted', false);

    if (fetchError) {
        console.error('Error checking for personal organization:', fetchError);
        throw fetchError;
    }

    // If the user already has a personal organization, return it
    if (existingOrgs && existingOrgs.length > 0) {
        return existingOrgs[0];
    }

    // Otherwise, create a new personal organization
    const username = email.split('@')[0];
    const orgName = `${username}'s Playground`;
    const orgSlug = `${username.toLowerCase()}-playground`.replace(
        /[^a-z0-9-]/g,
        '-',
    );

    const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
            name: orgName,
            slug: orgSlug,
            description:
                'Your personal playground for projects and experiments',
            created_by: userId,
            updated_by: userId,
            type: OrganizationType.personal,
            billing_plan: BillingPlan.free,
            billing_cycle: PricingPlanInterval.month,
            max_members: 1, // Personal orgs are just for the user
            max_monthly_requests: 1000,
            status: 'active',
        })
        .select('*')
        .single();

    if (createError) {
        console.error('Error creating personal organization:', createError);
        throw createError;
    }

    // Add the user as an owner of the organization
    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            organization_id: newOrg.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
        });

    if (memberError) {
        console.error(
            'Error adding user to personal organization:',
            memberError,
        );
        throw memberError;
    }

    return newOrg;
};
