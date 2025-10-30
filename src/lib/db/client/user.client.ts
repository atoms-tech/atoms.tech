import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

export const getUserProfile = async (
    supabase: SupabaseClient<Database>,
    userId: string,
) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const getAuthUser = async (supabase: SupabaseClient<Database>) => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};
