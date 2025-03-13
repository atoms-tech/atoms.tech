// src/app/(auth)/layout.tsx
import { Navbar } from '@/components/custom/LandingPage/navbar';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    );
}
