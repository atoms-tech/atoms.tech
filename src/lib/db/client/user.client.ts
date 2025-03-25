import { supabase } from '@/lib/supabase/supabaseBrowser';

export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

export const getAuthUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};
