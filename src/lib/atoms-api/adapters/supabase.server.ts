import { createClient } from '@/lib/supabase/supabaseServer';
import type { Database } from '@/types/base/database.types';

// Server adapter returns a per-request Supabase client.
export type SupabaseServerClient = Awaited<ReturnType<typeof getClient>>;

export async function getClient() {
  const client = await createClient();
  return client as unknown as import('@supabase/supabase-js').SupabaseClient<Database>;
}

