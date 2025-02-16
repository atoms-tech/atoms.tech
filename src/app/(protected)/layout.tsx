'use server';

import { getAuthUserServer, getUserProfileServer } from '@/lib/db/server';
import { OrganizationProvider } from '@/lib/providers/organization.provider';
import { UserProvider } from '@/lib/providers/user.provider';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUserServer();
    const profile = await getUserProfileServer(user.user.id);

    return (
        <OrganizationProvider>
            <UserProvider initialUser={user.user} initialProfile={profile}>
                {children}
            </UserProvider>
        </OrganizationProvider>
    );
}
