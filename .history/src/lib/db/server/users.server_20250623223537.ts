import { createClient } from '@/lib/supabase/supabaseServer';
import { BillingPlan, OrganizationType, PricingPlanInterval } from '@/types';

export const getUserProfileServer = async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // If profile doesn't exist, create it automatically
    if (error && error.code === 'PGRST116') {
        console.log('Profile not found for user', userId, 'creating new profile...');

        // Get user data from auth to populate profile
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);

        if (authUser?.user) {
            const newProfile = {
                id: userId,
                email: authUser.user.email || '',
                full_name: authUser.user.user_metadata?.full_name ||
                          authUser.user.user_metadata?.name ||
                          authUser.user.email?.split('@')[0] ||
                          'User',
                avatar_url: authUser.user.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select('*')
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                throw createError;
            }

            console.log('Successfully created profile for user', userId);
            return createdProfile;
        }
    }

    if (error) throw error;
    return data;
};

export const getAuthUserServer = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};

export const ensureUserPersonalOrganizationServer = async (userId: string, email: string) => {
    const supabase = await createClient();

    // Check if user already has a personal organization
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
            description: 'Your personal playground for projects and experiments',
            created_by: userId,
            updated_by: userId,
            type: OrganizationType.personal,
            billing_plan: BillingPlan.free,
            billing_cycle: PricingPlanInterval.month,
            max_members: 1,
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
        console.error('Error adding user to personal organization:', memberError);
        throw memberError;
    }

    return newOrg;
};
