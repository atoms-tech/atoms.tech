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
    const isDevelopment = process.env.NODE_ENV === 'development';
    const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
    const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;

    // Development auth bypass
    if (isDevelopment && bypassAuth && devUserId) {
        return {
            user: {
                id: devUserId,
                email: 'dev@example.com',
                aud: 'authenticated',
                role: 'authenticated',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                app_metadata: {},
                user_metadata: {},
            },
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
};
