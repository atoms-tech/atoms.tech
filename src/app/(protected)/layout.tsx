import Sidebar from '@/components/base/Sidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getAuthUser, getUserProfile } from '@/lib/db';
import { OrganizationProvider } from '@/lib/providers/organization.provider';
import { UserProvider } from '@/lib/providers/user.provider';
import React from 'react';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();
    const profile = await getUserProfile(user.user.id);

    return (
        <OrganizationProvider>
            <UserProvider initialUser={user.user} initialProfile={profile}>
                <SidebarProvider>
                    <Sidebar />
                    <div className="relative flex-1 p-16">
                        {children}
                        <VerticalToolbar />
                    </div>
                </SidebarProvider>
            </UserProvider>
        </OrganizationProvider>
    );
}
