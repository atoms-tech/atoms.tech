import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Profile } from '@/types';

export function useAuth() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);

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
            console.log('useAuth: Profile fetched successfully:', profile?.full_name);
            setUserProfile(profile);
        } catch (error) {
            console.error('useAuth: Error in fetchUserProfile:', error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        if (initialized) return;

        const isDevelopment = process.env.NODE_ENV === 'development';
        const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
        const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;

        const checkUser = async () => {
            try {
                console.log('useAuth: Checking session...');
                setInitialized(true);

                // Development auth bypass
                if (isDevelopment && bypassAuth && devUserId) {
                    console.log('useAuth: 🔓 Development auth bypass enabled');
                    console.log('useAuth: Using dev user ID:', devUserId);
                    setIsAuthenticated(true);
                    await fetchUserProfile(devUserId);
                    setIsLoading(false);
                    return;
                }

                // In development, try to get user from cookies first
                if (isDevelopment) {
                    console.log(
                        'useAuth: Development mode - checking for user_id cookie',
                    );

                    // Try to get user_id from cookie
                    const userIdCookie = document.cookie
                        .split('; ')
                        .find((row) => row.startsWith('user_id='))
                        ?.split('=')[1];

                    if (userIdCookie) {
                        console.log('useAuth: Found user_id in cookie:', userIdCookie);
                        setIsAuthenticated(true);
                        await fetchUserProfile(userIdCookie);
                        setIsLoading(false);
                        return;
                    } else {
                        console.log('useAuth: No user_id cookie found in development');
                        setIsAuthenticated(false);
                        setUserProfile(null);
                        setIsLoading(false);
                        return;
                    }
                }

                // Add timeout to prevent hanging in production
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session check timeout')), 3000),
                );

                const result = await Promise.race([sessionPromise, timeoutPromise]);
                const {
                    data: { session },
                    error,
                } = result as {
                    data: { session: { user?: { id: string } } | null };
                    error: unknown;
                };

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
                    console.log('useAuth: Fetching user profile for:', session.user.id);
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
        }, 2000); // Reduced to 2 seconds since we're skipping session check in dev

        // Listen for auth state changes (skip in dev bypass mode)
        let subscription: { unsubscribe: () => void } | null = null;

        if (!(isDevelopment && bypassAuth && devUserId)) {
            const {
                data: { subscription: authSubscription },
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
                console.log('useAuth: Auth state change - setting loading to false');
                setIsLoading(false);
            });
            subscription = authSubscription;
        }

        return () => {
            subscription?.unsubscribe();
            clearTimeout(fallbackTimeout);
        };
    }, [initialized]);

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
