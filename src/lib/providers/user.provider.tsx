'use client';

import { User } from '@supabase/supabase-js';
import { ReactNode, createContext, useContext, useState } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
import { Profile } from '@/types';

interface UserContextType {
    user: User | null;
    profile: Profile | null;
    refreshUser: () => Promise<void>; // Add refreshUser function
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
    children,
    initialUser,
    initialProfile,
}: {
    children: ReactNode;
    initialUser: User | null;
    initialProfile: Profile | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [profile, setProfile] = useState<Profile | null>(initialProfile);

    const refreshUser = async () => {
        const api = atomsApiClient();
        const updatedUser = await api.auth.getUser();
        const updatedProfile = updatedUser?.id
            ? await api.auth.getProfile(updatedUser.id)
            : null;
        setUser(updatedUser || null);
        setProfile(updatedProfile || null);
    };

    return (
        <UserContext.Provider value={{ user, profile, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
