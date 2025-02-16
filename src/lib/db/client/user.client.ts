import { supabase } from '@/lib/supabase/supabaseBrowser';
import { ProfileSchema } from '@/types/validation/profiles.validation';

export const getUserProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return ProfileSchema.parse(data);
};

export const getAuthUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
}; 