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

            if (error) {
                console.error('Error fetching user profile:', error);
                throw error;
            }
            setUserProfile(profile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                setIsAuthenticated(!!session);
                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('Error checking auth session:', error);
                setIsAuthenticated(false);
                setUserProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Check initial session state
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
    }, [router]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setUserProfile(null);
            setIsAuthenticated(false);
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
