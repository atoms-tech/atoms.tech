'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';

import { OnboardingProvider } from './OnboardingContext';
import { OnboardingHeader } from './OnboardingHeader';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingSteps } from './OnboardingSteps';
import { OnboardingNavigation } from './OnboardingNavigation';
import { User } from '@/types/base/users.types';
import { Organization } from '@/types/base/organizations.types';
import { OnboardingProgress as OnboardingProgressType } from '@/lib/db/server/home.server';

interface OnboardingFlowProps {
    user: User;
    organizations: Organization[];
    onboardingProgress: OnboardingProgressType;
    onboardingType: 'account' | 'organization';
    targetOrgId?: string;
    initialStep: number;
}

export function OnboardingFlow({
    user,
    organizations,
    onboardingProgress,
    onboardingType,
    targetOrgId,
    initialStep
}: OnboardingFlowProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isCompleting, setIsCompleting] = useState(false);

    // Get the target organization if doing org-level onboarding
    const targetOrganization = targetOrgId 
        ? organizations.find(org => org.id === targetOrgId)
        : null;

    // Define steps based on onboarding type
    const getSteps = () => {
        if (onboardingType === 'organization') {
            return [
                'welcome-org',
                'org-setup',
                'team-roles',
                'project-creation',
                'collaboration-setup',
                'completion'
            ];
        } else {
            return [
                'welcome',
                'profile-setup',
                'role-selection',
                'first-project',
                'feature-tour',
                'completion'
            ];
        }
    };

    const steps = getSteps();
    const totalSteps = steps.length;

    // Update URL when step changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', currentStep.toString());
        if (onboardingType) params.set('type', onboardingType);
        if (targetOrgId) params.set('orgId', targetOrgId);
        
        router.replace(`/onboarding?${params.toString()}`, { scroll: false });
    }, [currentStep, onboardingType, targetOrgId, router, searchParams]);

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        
        try {
            // Mark onboarding as completed
            // This would typically involve an API call to update user preferences
            
            // Redirect based on onboarding type
            if (onboardingType === 'organization' && targetOrgId) {
                router.push(`/org/${targetOrgId}`);
            } else {
                router.push('/home');
            }
        } catch (error) {
            console.error('Error completing onboarding:', error);
            setIsCompleting(false);
        }
    };

    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

    return (
        <OnboardingProvider
            user={user}
            organizations={organizations}
            onboardingProgress={onboardingProgress}
            onboardingType={onboardingType}
            targetOrganization={targetOrganization}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onComplete={handleComplete}
            isCompleting={isCompleting}
        >
            {/* Clean, professional layout matching our login page */}
            <div className="min-h-screen bg-background flex flex-col">
                {/* Simple header */}
                <OnboardingHeader />

                {/* Main content area */}
                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        {/* Progress indicator */}
                        <div className="mb-8">
                            <OnboardingProgress
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                percentage={progressPercentage}
                            />
                        </div>

                        {/* Content card */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-card border rounded-lg shadow-sm"
                            >
                                <OnboardingSteps
                                    currentStep={steps[currentStep]}
                                    stepIndex={currentStep}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="mt-6">
                            <OnboardingNavigation
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                canGoBack={currentStep > 0}
                                canSkip={currentStep < totalSteps - 1}
                                isLastStep={currentStep === totalSteps - 1}
                                isCompleting={isCompleting}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </OnboardingProvider>
    );
}
