import { UserProvider } from '@/lib/providers/user.provider';
import { getAuthUser, getUserProfile } from '@/lib/db';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();
    const profile = await getUserProfile(user.user.id);

    return (
        <UserProvider initialUser={user.user} initialProfile={profile}>
            {children}
        </UserProvider>
    );
}
