import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
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
            const api = atomsApiClient();
            const profile = await api.auth.getProfile(userId);
            console.log('useAuth: Profile fetched successfully:', profile?.full_name);
            setUserProfile(profile as Profile);
        } catch (error) {
            console.error('useAuth: Error in fetchUserProfile:', error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        if (initialized) return;

        const isDevelopment = process.env.NODE_ENV === 'development';

        const checkUser = async () => {
            try {
                console.log('useAuth: Checking session...');
                setInitialized(true);

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
                const api = atomsApiClient();
                // In prod, rely on atoms-api auth (SSR-aware elsewhere)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session check timeout')), 3000),
                );

                const resultUser = await Promise.race([api.auth.getUser(), timeoutPromise]);
                const sessionUser = resultUser as { id?: string } | null;

                setIsAuthenticated(!!sessionUser);
                if (sessionUser?.id) {
                    console.log('useAuth: Fetching user profile for:', sessionUser.id);
                    await fetchUserProfile(sessionUser.id);
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

        // Listen for auth state changes
        // Minimal: rely on page reload or atomsApi-based polling if needed

        return () => {
            clearTimeout(fallbackTimeout);
        };
    }, [initialized]);

    const signOut = async () => {
        try {
            // Atoms-api does not expose signOut; handled server-side elsewhere
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
