'use client';

// import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useOnboarding } from './OnboardingContext';

interface OnboardingNavigationProps {
    currentStep: number;
    totalSteps: number;
    canGoBack: boolean;
    canSkip: boolean;
    isLastStep: boolean;
    isCompleting: boolean;
}

export function OnboardingNavigation({
    currentStep,
    totalSteps: _totalSteps,
    canGoBack,
    canSkip,
    isLastStep,
    isCompleting,
}: OnboardingNavigationProps) {
    const {
        onNext,
        onPrevious,
        onSkip,
        onComplete,
        isStepValid,
        getStepErrors,
        data: _data,
    } = useOnboarding();

    // Get current step name for validation
    const getStepName = () => {
        const steps = [
            'welcome',
            'profile-setup',
            'role-selection',
            'first-project',
            'feature-tour',
            'completion',
        ];
        return steps[currentStep] || 'welcome';
    };

    const currentStepName = getStepName();
    const stepValid = isStepValid(currentStepName);
    const stepErrors = getStepErrors(currentStepName);

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            onNext();
        }
    };

    return (
        <div className="w-full">
            {/* Error messages */}
            {stepErrors.length > 0 && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm text-destructive">
                        <p className="font-medium mb-1 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Please complete the following:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-6">
                            {stepErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                {/* Back button */}
                {canGoBack ? (
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                        disabled={isCompleting}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                    </Button>
                ) : (
                    <div />
                )}

                {/* Forward buttons */}
                <div className="flex items-center space-x-3">
                    {canSkip && !isLastStep && (
                        <Button
                            variant="ghost"
                            onClick={onSkip}
                            disabled={isCompleting}
                        >
                            Skip
                        </Button>
                    )}

                    <Button
                        onClick={handleNext}
                        disabled={!stepValid || isCompleting}
                        className="flex items-center space-x-2"
                    >
                        {isCompleting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Finishing...</span>
                            </>
                        ) : isLastStep ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span>Complete</span>
                            </>
                        ) : (
                            <>
                                <span>Continue</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
