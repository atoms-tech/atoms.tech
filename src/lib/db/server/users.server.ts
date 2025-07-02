import { createClient } from '@/lib/supabase/supabaseServer';

export const getUserProfileServer = async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const getAuthUserServer = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};
