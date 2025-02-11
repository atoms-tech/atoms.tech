import { OrganizationProvider } from '@/lib/providers/organization.provider';
import React from 'react';

export default async function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <OrganizationProvider>{children}</OrganizationProvider>;
}
