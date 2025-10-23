import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Returns a singleton Supabase client configured with the service role key.
 * This should only be used on the server for privileged operations.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient<Database> | null {
    if (typeof window !== 'undefined') {
        throw new Error(
            'getSupabaseServiceRoleClient should only be called on the server',
        );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Supabase service role client is not configured.');
        return null;
    }

    if (!cachedClient) {
        cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }

    return cachedClient;
}
