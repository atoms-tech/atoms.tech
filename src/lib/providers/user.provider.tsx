'use client';

import { User } from '@supabase/supabase-js';
import { ReactNode, createContext, use } from 'react';

import { Profile } from '@/types';

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
        <UserContext value={{ user: initialUser, profile: initialProfile }}>
            {children}
        </UserContext>
    );
}

export function useUser() {
    const context = use(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
