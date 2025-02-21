'use client';

import { createContext, useContext, useState } from 'react';

import { Organization } from '@/types/base/organizations.types';

interface OrganizationContextType {
    organization: Organization | null;
    setOrganization: (organization: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
    undefined,
);

export const OrganizationProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [organization, setOrganization] = useState<Organization | null>(null);
    return (
        <OrganizationContext.Provider value={{ organization, setOrganization }}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error(
            'useOrganization must be used within an OrganizationProvider',
        );
    }
    return context;
};
