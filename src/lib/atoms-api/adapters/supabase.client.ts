import { supabase as browserClient } from '@/lib/supabase/supabaseBrowser';
import type { Database } from '@/types/base/database.types';

// Thin adapter around the browser Supabase client.
export type SupabaseBrowserClient = ReturnType<typeof getClient>;

export function getClient() {
    return browserClient as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;
}
