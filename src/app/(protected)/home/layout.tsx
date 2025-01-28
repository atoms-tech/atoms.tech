import { SidebarProvider } from '@/components/ui/sidebar';
import { HomeSidebar } from './components/HomeSidebar.client';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { OrganizationProvider } from '@/lib/providers/organization.provider';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            <SidebarProvider>
                <HomeSidebar />
                <div className="relative flex-1 p-16">
                    {children}
                    <VerticalToolbar />
                </div>
            </SidebarProvider>
        </OrganizationProvider>
    );
}
