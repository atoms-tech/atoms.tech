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
