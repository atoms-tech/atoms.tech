import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from './components/DashboardSidebar.client';
import VerticalToolbar from '@/components/custom/VerticalToolbar';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <div className="relative flex-1 p-16">
                {children}
                <VerticalToolbar />
            </div>
        </SidebarProvider>
    );
}
