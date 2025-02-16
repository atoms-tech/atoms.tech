import { createClient } from '@/lib/supabase/supabaseServer';
import { ProfileSchema } from '@/types/validation/profiles.validation';

export const getUserProfileServer = async (userId: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return ProfileSchema.parse(data);
};

export const getAuthUserServer = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};
