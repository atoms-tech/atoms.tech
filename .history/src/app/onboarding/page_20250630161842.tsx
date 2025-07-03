import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { OnboardingFlow } from '@/components/custom/Onboarding/OnboardingFlow';
import { OnboardingLoadingSkeleton } from '@/components/custom/Onboarding/OnboardingLoadingSkeleton';
import { getAuthUserServer } from '@/lib/db/server';
import { getUserOnboardingProgressServer } from '@/lib/db/server/home.server';
import { createClient } from '@/lib/supabase/supabaseServer';

interface OnboardingPageProps {
    searchParams: Promise<{
        type?: 'account' | 'organization';
        orgId?: string;
        step?: string;
    }>;
}

export default async function OnboardingPage({
    searchParams,
}: OnboardingPageProps) {
    const params = await searchParams;
    const authData = await getAuthUserServer();

    if (!authData?.user) {
        redirect('/login');
    }

    const user = authData.user;

    const [organizations, onboardingProgress] = await Promise.all([
        getUserOrganizationsServer(user.id),
        getUserOnboardingProgressServer(user.id),
    ]);

    // Determine onboarding type
    const onboardingType = params.type || 'account';
    const targetOrgId = params.orgId;
    const currentStep = params.step ? parseInt(params.step) : 0;

    // If organization onboarding is requested, verify user has access
    if (onboardingType === 'organization' && targetOrgId) {
        const hasAccess = organizations.some(
            (org) =>
                org.id === targetOrgId &&
                (org.role === 'owner' || org.role === 'admin'),
        );

        if (!hasAccess) {
            redirect('/onboarding?type=account');
        }
    }

    return (
        <Suspense fallback={<OnboardingLoadingSkeleton />}>
            <OnboardingFlow
                user={user}
                organizations={organizations}
                onboardingProgress={onboardingProgress}
                onboardingType={onboardingType}
                targetOrgId={targetOrgId}
                initialStep={currentStep}
            />
        </Suspense>
    );
}
