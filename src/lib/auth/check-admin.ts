import { createServerClient } from '@/lib/database';

/**
 * Check if a user is a platform admin
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from('platform_admins')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (error) {
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Check if a user is an organization admin
 */
export async function isOrganizationAdmin(
    userId: string,
    organizationId: string
): Promise<boolean> {
    try {
        const supabase = await createServerClient();

        const { data, error } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (error) {
            return false;
        }

        return data?.role === 'admin' || data?.role === 'owner';
    } catch (error) {
        console.error('Error checking organization admin status:', error);
        return false;
    }
}

