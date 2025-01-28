import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Profile } from '@/types';

export function useAuth() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const router = useRouter();

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUserProfile(profile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                setIsAuthenticated(!!user);
                if (user) {
                    await fetchUserProfile(user.id);
                }
            } catch (error) {
                setIsAuthenticated(false);
                setUserProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Check initial user state
        checkUser();

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setIsAuthenticated(!!session);
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setUserProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setUserProfile(null);
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return {
        isAuthenticated,
        isLoading,
        signOut,
        userProfile,
    };
}
