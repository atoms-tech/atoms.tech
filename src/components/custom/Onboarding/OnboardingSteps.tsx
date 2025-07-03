'use client';

import { WelcomeStep } from './steps/WelcomeStep';
import { WelcomeOrgStep } from './steps/WelcomeOrgStep';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { FirstProjectStep } from './steps/FirstProjectStep';
import { FeatureTourStep } from './steps/FeatureTourStep';
import { CompletionStep } from './steps/CompletionStep';
import { OrgSetupStep } from './steps/OrgSetupStep';
import { TeamRolesStep } from './steps/TeamRolesStep';
import { ProjectCreationStep } from './steps/ProjectCreationStep';
import { CollaborationSetupStep } from './steps/CollaborationSetupStep';

interface OnboardingStepsProps {
    currentStep: string;
    stepIndex: number;
}

export function OnboardingSteps({ currentStep, stepIndex }: OnboardingStepsProps) {
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

    return (
        <div className="w-full">
            {renderStep()}
        </div>
    );
}
