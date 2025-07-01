'use client';

import { User } from '@supabase/supabase-js';
import { ReactNode, createContext, useContext, useState } from 'react';

import { OnboardingProgress } from '@/lib/db/server/home.server';
import { Organization } from '@/types/base/organizations.types';

interface OnboardingData {
    // User profile data
    profileData: {
        displayName?: string;
        role?: string;
        department?: string;
        goals?: string[];
    };

    // Organization setup data
    organizationData: {
        name?: string;
        description?: string;
        industry?: string;
        size?: string;
        customization?: {
            welcomeMessage?: string;
            requiredSteps?: string[];
            optionalSteps?: string[];
        };
    };

    // Project creation data
    projectData: {
        name?: string;
        description?: string;
        template?: string;
        visibility?: 'private' | 'team' | 'organization';
    };

    // Team invitation data
    teamData: {
        invitations?: {
            email: string;
            role: string;
            department?: string;
        }[];
    };

    // Feature preferences
    featurePreferences: {
        enabledFeatures?: string[];
        notifications?: {
            email: boolean;
            inApp: boolean;
            mentions: boolean;
        };
    };
}

interface OnboardingContextType {
    // Core data
    user: User;
    organizations: Organization[];
    onboardingProgress: OnboardingProgress;
    onboardingType: 'account' | 'organization';
    targetOrganization?: Organization | null;

    // Step management
    currentStep: number;
    totalSteps: number;

    // Onboarding data
    data: OnboardingData;
    updateData: (
        section: keyof OnboardingData,
        updates: Partial<OnboardingData[keyof OnboardingData]>,
    ) => void;

    // Navigation
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
    onComplete: () => void;
    isCompleting: boolean;

    // Validation
    isStepValid: (step: string) => boolean;
    getStepErrors: (step: string) => string[];
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
    undefined,
);

interface OnboardingProviderProps {
    children: ReactNode;
    user: User;
    organizations: Organization[];
    onboardingProgress: OnboardingProgress;
    onboardingType: 'account' | 'organization';
    targetOrganization?: Organization | null;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
    onComplete: () => void;
    isCompleting: boolean;
}

export function OnboardingProvider({
    children,
    user,
    organizations,
    onboardingProgress,
    onboardingType,
    targetOrganization,
    currentStep,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
    onComplete,
    isCompleting,
}: OnboardingProviderProps) {
    const [data, setData] = useState<OnboardingData>({
        profileData: {
            displayName: user.user_metadata?.full_name || '',
        },
        organizationData: {},
        projectData: {},
        teamData: {},
        featurePreferences: {
            notifications: {
                email: true,
                inApp: true,
                mentions: true,
            },
        },
    });

    const updateData = (
        section: keyof OnboardingData,
        updates: Partial<OnboardingData[keyof OnboardingData]>,
    ) => {
        setData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...updates,
            },
        }));
    };

    const isStepValid = (step: string): boolean => {
        switch (step) {
            case 'welcome':
            case 'welcome-org':
                return true;

            case 'profile-setup':
                return (
                    !!data.profileData.displayName && !!data.profileData.role
                );

            case 'org-setup':
                return !!data.organizationData.name;

            case 'role-selection':
                return !!data.profileData.role;

            case 'first-project':
            case 'project-creation':
                return !!data.projectData.name;

            case 'team-roles':
                return true; // Optional step

            case 'collaboration-setup':
                return true; // Optional step

            case 'feature-tour':
                return true; // Always valid

            case 'completion':
                return true;

            default:
                return true;
        }
    };

    const getStepErrors = (step: string): string[] => {
        const errors: string[] = [];

        switch (step) {
            case 'profile-setup':
                if (!data.profileData.displayName) {
                    errors.push('Display name is required');
                }
                if (!data.profileData.role) {
                    errors.push('Role selection is required');
                }
                break;

            case 'org-setup':
                if (!data.organizationData.name) {
                    errors.push('Organization name is required');
                }
                break;

            case 'role-selection':
                if (!data.profileData.role) {
                    errors.push('Please select your role');
                }
                break;

            case 'first-project':
            case 'project-creation':
                if (!data.projectData.name) {
                    errors.push('Project name is required');
                }
                break;
        }

        return errors;
    };

    const contextValue: OnboardingContextType = {
        user,
        organizations,
        onboardingProgress,
        onboardingType,
        targetOrganization,
        currentStep,
        totalSteps,
        data,
        updateData,
        onNext,
        onPrevious,
        onSkip,
        onComplete,
        isCompleting,
        isStepValid,
        getStepErrors,
    };

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error(
            'useOnboarding must be used within an OnboardingProvider',
        );
    }
    return context;
}
