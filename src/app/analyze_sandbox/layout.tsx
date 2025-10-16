'use client';

import { Suspense } from 'react';
import LayoutManager from '@/components/base/LayoutManager';
import { Button } from '@/components/ui/button';
import { LiveRegionProvider } from '@/components/ui/live-region';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AccessibilityProvider } from '@/lib/providers/accessibility.provider';
import { OrganizationProvider } from '@/lib/providers/organization.provider';
import { UserProvider } from '@/lib/providers/user.provider';
import type { Profile } from '@/types';
import type { Organization } from '@/types/base/organizations.types';
import type { User } from '@supabase/supabase-js';

function SandboxLayoutSkeleton() {
    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
}

export default function AnalyzeSandboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Minimal mock Supabase user
    const mockUser = {
        id: 'demo-user',
        email: 'demo@atoms.tech',
        app_metadata: {},
        user_metadata: { full_name: 'Demo User' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    } as unknown as User;

    // Minimal mock Profile (casting to satisfy types)
    const mockProfile = {
        id: 'demo-user',
        full_name: 'Demo User',
        email: 'demo@atoms.tech',
        current_organization_id: 'demo-org',
        pinned_organization_id: 'demo-org',
        // add any additional fields as undefined
    } as unknown as Profile;

    // Minimal mock Organizations
    const mockOrganizations = [
        {
            id: 'demo-org',
            name: 'Demo Organization',
            is_deleted: false,
        },
    ] as unknown as Organization[];

    return (
        <UserProvider initialUser={mockUser as User} initialProfile={mockProfile}>
            <OrganizationProvider initialOrganizations={mockOrganizations}>
                <LiveRegionProvider>
                    <AccessibilityProvider>
                        <Suspense fallback={<SandboxLayoutSkeleton />}>
                            <LayoutManager>{children}</LayoutManager>
                        </Suspense>
                    </AccessibilityProvider>
                </LiveRegionProvider>
            </OrganizationProvider>
        </UserProvider>
    );
}
