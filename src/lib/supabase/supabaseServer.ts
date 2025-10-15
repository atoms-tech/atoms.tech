import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { Database } from '@/types/base/database.types';

export async function createClient() {
    const cookieStore = await cookies();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            auth: {
                autoRefreshToken: !(isDevelopment && bypassAuth),
                persistSession: !(isDevelopment && bypassAuth),
                detectSessionInUrl: !(isDevelopment && bypassAuth),
            },
        },
    );
}
