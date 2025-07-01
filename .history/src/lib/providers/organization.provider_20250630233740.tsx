'use client';

import { createContext, use, useState } from 'react';

import { Organization } from '@/types/base/organizations.types';

interface OrganizationContextType {
    organizations: Organization[];
    setOrganizations: (organizations: Organization[]) => void;
    currentOrganization: Organization | null;
    setCurrentOrganization: (organization: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
    undefined,
);

export const OrganizationProvider = ({
    children,
    initialOrganizations,
}: {
    children: React.ReactNode;
    initialOrganizations: Organization[];
}) => {
    const [organizations, setOrganizations] =
        useState<Organization[]>(initialOrganizations);
    const [currentOrganization, setCurrentOrganization] =
        useState<Organization | null>(
            initialOrganizations.length > 0 ? initialOrganizations[0] : null,
        );

    // Listen for auth state changes and refresh organizations when user signs in
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(
                'OrganizationProvider: Auth state changed',
                event,
                session?.user?.id,
            );

            if (event === 'SIGNED_IN' && session?.user) {
                // User signed in - fetch fresh organizations
                try {
                    const freshOrganizations = await getUserOrganizations(
                        session.user.id,
                    );
                    setOrganizations(freshOrganizations);

                    // Set current organization to first one if we don't have one
                    if (!currentOrganization && freshOrganizations.length > 0) {
                        setCurrentOrganization(freshOrganizations[0]);
                    }
                } catch (error) {
                    console.error(
                        'Error fetching organizations after auth change:',
                        error,
                    );
                }
            } else if (event === 'SIGNED_OUT') {
                // User signed out - clear organizations
                setOrganizations([]);
                setCurrentOrganization(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [currentOrganization]);

    return (
        <OrganizationContext.Provider
            value={{
                organizations,
                setOrganizations,
                currentOrganization,
                setCurrentOrganization,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
};

export function useOrganization() {
    const context = use(OrganizationContext);
    if (context === undefined) {
        throw new Error(
            'useOrganization must be used within an OrganizationProvider',
        );
    }
    return context;
}
