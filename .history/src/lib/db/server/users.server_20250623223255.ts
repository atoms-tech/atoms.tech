import { createClient } from '@/lib/supabase/supabaseServer';
import { BillingPlan, OrganizationType, PricingPlanInterval } from '@/types/base/organizations.types';

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
