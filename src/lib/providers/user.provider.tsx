'use client';

import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext } from 'react';

interface UserContextType {
    user: User | null;
    profile: Profile | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
    children,
    initialUser,
    initialProfile,
}: {
    children: ReactNode;
    initialUser: User;
    initialProfile: Profile;
}) {
    return (
        <UserContext.Provider
            value={{ user: initialUser, profile: initialProfile }}
        >
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
