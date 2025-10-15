'use client';

import { User } from '@supabase/supabase-js';
import { ReactNode, createContext, useContext, useState } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';
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
    initialUser: User;
    initialProfile: Profile;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [profile, setProfile] = useState<Profile | null>(initialProfile);

    const refreshUser = async () => {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const bypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
        const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;

        let userId = null;

        if (isDevelopment && bypassAuth && devUserId) {
            // Development bypass: use dev user ID directly
            userId = devUserId;
        } else {
            // Production: get user from Supabase auth
            const { data: updatedUser } = await supabase.auth.getUser();
            userId = updatedUser?.user?.id;
            setUser(updatedUser?.user || null);
        }

        if (userId) {
            const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            setProfile(updatedProfile || null);
        } else {
            setProfile(null);
        }
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
