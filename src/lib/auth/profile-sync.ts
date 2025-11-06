import { randomUUID } from 'node:crypto';

import { getServiceRoleClient } from '@/lib/database';
import { Database } from '@/types/base/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type WorkOSUserLike = {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
};

/**
 * Ensure there is a Supabase profile for the given WorkOS user.
 * Returns the profile if found or created.
 */
export async function getOrCreateProfileForWorkOSUser(
    workosUser: WorkOSUserLike,
): Promise<ProfileRow | null> {
    const supabase = getServiceRoleClient();

    if (!supabase) {
        console.warn('Supabase service role client unavailable - cannot sync profile.');
        return null;
    }

    const email = workosUser.email;

    if (!email) {
        console.warn('WorkOS user missing email - cannot sync profile.');
        return null;
    }

    // Attempt to find existing profile by email
    const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (fetchError) {
        console.error('Failed to fetch Supabase profile by email:', fetchError);
        throw fetchError;
    }

    if (existingProfile) {
        if (!existingProfile.workos_id && workosUser.id) {
            const { data, error } = await supabase
                .from('profiles')
                .update({ workos_id: workosUser.id })
                .eq('id', existingProfile.id)
                .select('*')
                .maybeSingle();

            if (error) {
                console.error('Failed to update workos_id for profile:', error);
                throw error;
            }

            if (data) {
                return data;
            }
        }

        return existingProfile;
    }

    const fullName = [workosUser.firstName, workosUser.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

    const insertPayload: Database['public']['Tables']['profiles']['Insert'] = {
        id: randomUUID(),
        email,
        full_name: fullName || null,
        status: 'active',
        is_approved: false,
        workos_id: workosUser.id,
    };

    const { data: insertedProfiles, error: insertError } = await supabase
        .from('profiles')
        .insert(insertPayload)
        .select('*')
        .maybeSingle();

    if (insertError) {
        console.error('Failed to create Supabase profile for WorkOS user:', insertError);
        throw insertError;
    }

    return insertedProfiles;
}

/**
 * Fetch a Supabase profile by its primary key using the service client.
 */
export async function getProfileById(userId: string): Promise<ProfileRow | null> {
    const supabase = getServiceRoleClient();

    if (!supabase) {
        console.warn('Supabase service role client unavailable - cannot fetch profile.');
        return null;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Failed to fetch Supabase profile by id:', error);
        throw error;
    }

    return data;
}
