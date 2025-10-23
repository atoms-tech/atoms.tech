'use client';

import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { Profile } from '@/types';

/**
 * Authenticated user representation that stores the Supabase profile id and optional WorkOS id.
 */
interface AppUser {
    id: string;
    email: string;
    workosId: string;
}

interface UserContextType {
    user: AppUser | null;
    profile: Profile | null;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider - Manages user and profile context
 *
 * Replaces Supabase-specific User type with simplified WorkOSUser.
 * Initial data is populated server-side during SSR.
 */
export function UserProvider({
    children,
    initialUser,
    initialProfile,
}: {
    children: ReactNode;
    initialUser?: AppUser;
    initialProfile?: Profile;
}) {
    const [user, _setUser] = useState<AppUser | null>(initialUser || null);
    const [profile, setProfile] = useState<Profile | null>(initialProfile || null);

    /**
     * Refresh user and profile data from server
     */
    const refreshUser = useCallback(async () => {
        try {
            if (!user?.id) return;

            // Fetch fresh profile data
            const profileResponse = await fetch(`/api/auth/profile/${user.id}`);

            if (profileResponse.ok) {
                const updatedProfile = await profileResponse.json();
                setProfile(updatedProfile);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    }, [user?.id]);

    return (
        <UserContext.Provider value={{ user, profile, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

/**
 * Hook to access user context
 * Throws error if used outside UserProvider
 */
export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
