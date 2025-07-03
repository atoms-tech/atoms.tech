'use client';

import { CollaborationSetupStep } from './steps/CollaborationSetupStep';
import { CompletionStep } from './steps/CompletionStep';
import { FeatureTourStep } from './steps/FeatureTourStep';
import { FirstProjectStep } from './steps/FirstProjectStep';
import { OrgSetupStep } from './steps/OrgSetupStep';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { ProjectCreationStep } from './steps/ProjectCreationStep';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { TeamRolesStep } from './steps/TeamRolesStep';
import { WelcomeOrgStep } from './steps/WelcomeOrgStep';
import { WelcomeStep } from './steps/WelcomeStep';

interface OnboardingStepsProps {
    currentStep: string;
    stepIndex: number;
}

export function OnboardingSteps({
    currentStep,
    stepIndex: _stepIndex,
}: OnboardingStepsProps) {
    const renderStep = () => {
        switch (currentStep) {
            // Account-level onboarding steps
            case 'welcome':
                return <WelcomeStep />;
            case 'profile-setup':
                return <ProfileSetupStep />;
            case 'role-selection':
                return <RoleSelectionStep />;
            case 'first-project':
                return <FirstProjectStep />;
            case 'feature-tour':
                return <FeatureTourStep />;

            // Organization-level onboarding steps
            case 'welcome-org':
                return <WelcomeOrgStep />;
            case 'org-setup':
                return <OrgSetupStep />;
            case 'team-roles':
                return <TeamRolesStep />;
            case 'project-creation':
                return <ProjectCreationStep />;
            case 'collaboration-setup':
                return <CollaborationSetupStep />;

            // Shared steps
            case 'completion':
                return <CompletionStep />;

            default:
                return <WelcomeStep />;
        }
    };

    return <div className="w-full">{renderStep()}</div>;
}
