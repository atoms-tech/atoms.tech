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
            console.log('useAuth: Fetching profile for user:', userId);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('useAuth: Error fetching user profile:', error);
                throw error;
            }
            console.log(
                'useAuth: Profile fetched successfully:',
                profile?.full_name,
            );
            setUserProfile(profile);
        } catch (error) {
            console.error('useAuth: Error in fetchUserProfile:', error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                console.log('useAuth: Checking session...');
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                console.log('useAuth: Session check result:', {
                    session: !!session,
                    error,
                });

                if (error) {
                    console.error('useAuth: Session error:', error);
                    throw error;
                }

                setIsAuthenticated(!!session);
                if (session?.user) {
                    console.log(
                        'useAuth: Fetching user profile for:',
                        session.user.id,
                    );
                    await fetchUserProfile(session.user.id);
                } else {
                    console.log('useAuth: No session, clearing profile');
                    setUserProfile(null);
                }
            } catch (error) {
                console.error('useAuth: Error checking auth session:', error);
                setIsAuthenticated(false);
                setUserProfile(null);
            } finally {
                console.log('useAuth: Setting loading to false');
                setIsLoading(false);
            }
        };

        // Check initial session state
        checkUser();

        // Fallback timeout to ensure loading state doesn't persist indefinitely
        const fallbackTimeout = setTimeout(() => {
            console.log('useAuth: Fallback timeout - forcing loading to false');
            setIsLoading(false);
        }, 5000); // 5 second fallback

        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('useAuth: Auth state change:', event, !!session);
            setIsAuthenticated(!!session);
            if (session?.user) {
                console.log(
                    'useAuth: Auth state change - fetching profile for:',
                    session.user.id,
                );
                await fetchUserProfile(session.user.id);
            } else {
                console.log(
                    'useAuth: Auth state change - no session, clearing profile',
                );
                setUserProfile(null);
            }
            // Ensure loading state is set to false after auth state change
            console.log(
                'useAuth: Auth state change - setting loading to false',
            );
            setIsLoading(false);
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
