'use client';

import { User } from '@supabase/supabase-js';
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

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
        const { data: updatedUser } = await supabase.auth.getUser();
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', updatedUser?.user?.id || '')
            .single();

        setUser(updatedUser?.user || null);
        setProfile(updatedProfile || null);
    };

    // Listen for auth state changes and update user/profile accordingly
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(
                'UserProvider: Auth state changed',
                event,
                session?.user?.id,
            );

            if (session?.user) {
                // User signed in - fetch fresh user and profile data
                setUser(session.user);

                try {
                    const { data: updatedProfile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    setProfile(updatedProfile || null);
                } catch (error) {
                    console.error(
                        'Error fetching profile after auth change:',
                        error,
                    );
                    setProfile(null);
                }
            } else {
                // User signed out
                setUser(null);
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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
