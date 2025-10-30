import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Profile } from '@/types';

/**
 * useAuth Hook - WorkOS Authentication
 *
 * Manages authentication state and user profile on the client side.
 * Checks for WorkOS session via API and fetches user profile.
 */
export function useAuth() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);

    /**
     * Fetch user profile from database
     */
    const fetchUserProfile = useCallback(async (userId: string, token: string) => {
        try {
            console.log('useAuth: Fetching profile for user:', userId);

            if (!userId) {
                throw new Error('Missing profile identifier');
            }

            const response = await fetch(`/api/auth/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            const profile: Profile = await response.json();
            console.log('useAuth: Profile fetched successfully:', profile?.full_name);
            setUserProfile(profile);
        } catch (error) {
            console.error('useAuth: Error in fetchUserProfile:', error);
            setUserProfile(null);
        }
    }, []);

    /**
     * Check current session and fetch user data
     */
    const checkSession = useCallback(async () => {
        try {
            console.log('useAuth: Checking session...');

            // Check if user is logged in via API
            const response = await fetch('/api/auth/session', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                console.log(
                    'useAuth: Session check failed with status:',
                    response.status,
                );
                setIsAuthenticated(false);
                setUserProfile(null);
                setAccessToken(null);
                return;
            }

            const data = await response.json();

            if (data.user && data.user.id && data.accessToken) {
                console.log('useAuth: User session found:', data.user.id, {
                    workosId: data.user.workosId,
                });
                setIsAuthenticated(true);
                setAccessToken(data.accessToken);
                if (data.profile) {
                    setUserProfile(data.profile as Profile);
                } else {
                    await fetchUserProfile(data.user.id, data.accessToken);
                }
            } else {
                console.log('useAuth: No valid session found');
                setIsAuthenticated(false);
                setUserProfile(null);
                setAccessToken(null);
            }
        } catch (error) {
            console.error('useAuth: Error checking session:', error);
            setIsAuthenticated(false);
            setUserProfile(null);
            setAccessToken(null);
        } finally {
            setIsLoading(false);
        }
    }, [fetchUserProfile]);

    /**
     * Sign out the user
     */
    const signOut = useCallback(async () => {
        try {
            await fetch('/api/auth/signout', {
                method: 'POST',
                credentials: 'include',
            });

            setUserProfile(null);
            setIsAuthenticated(false);
            setAccessToken(null);
            router.push('/login');
        } catch (error) {
            console.error('useAuth: Error signing out:', error);
        }
    }, [router]);

    useEffect(() => {
        if (initialized) return;

        setInitialized(true);

        // Check initial session state
        checkSession();

        // Set up polling to check session periodically (every 5 minutes)
        const pollInterval = setInterval(checkSession, 5 * 60 * 1000);

        // Set fallback timeout to ensure loading doesn't persist
        const fallbackTimeout = setTimeout(() => {
            console.log('useAuth: Fallback timeout - forcing loading to false');
            setIsLoading(false);
        }, 3000);

        return () => {
            clearInterval(pollInterval);
            clearTimeout(fallbackTimeout);
        };
    }, [initialized, checkSession]);

    return {
        isAuthenticated,
        isLoading,
        signOut,
        userProfile,
        accessToken,
    };
}
