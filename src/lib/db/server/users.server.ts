import { withAuth } from '@workos-inc/authkit-nextjs';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/database';

export const getUserProfileServer = async (userId: string) => {
    const supabase = await createServerClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const getAuthUserServer = async () => {
    const { user } = await withAuth();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const profile = await getOrCreateProfileForWorkOSUser(user);

    if (!profile) {
        throw new Error('Supabase profile not found for authenticated user');
    }

    return {
        user: {
            id: profile.id,
            email: user.email ?? '',
            workosId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        profile,
        workosUser: user,
    };
};
