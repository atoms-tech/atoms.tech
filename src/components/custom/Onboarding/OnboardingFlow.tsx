'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from './OnboardingContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { RoleSelectionStep } from './steps/RoleSelectionStep';
import { GoalsStep } from './steps/GoalsStep';
import { ProjectSetupStep } from './steps/ProjectSetupStep';
import { CompletionStep } from './steps/CompletionStep';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle,
  Circle
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Welcome', component: WelcomeStep },
  { id: 2, title: 'Personal Info', component: PersonalInfoStep },
  { id: 3, title: 'Role Selection', component: RoleSelectionStep },
  { id: 4, title: 'Goals', component: GoalsStep },
  { id: 5, title: 'Project Setup', component: ProjectSetupStep },
  { id: 6, title: 'Complete', component: CompletionStep },
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
}

export function OnboardingFlow({ onComplete, onSkip, onClose }: OnboardingFlowProps) {
  const { state, nextStep, previousStep, completeOnboarding } = useOnboarding();

  const currentStepData = steps.find(step => step.id === state.currentStep);
  const CurrentStepComponent = currentStepData?.component || WelcomeStep;

  const progressPercentage = (state.currentStep / state.totalSteps) * 100;

  const handleNext = () => {
    if (state.currentStep === state.totalSteps) {
      completeOnboarding();
      onComplete?.();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    onSkip?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to ATOMS.tech
              </h2>
              <Badge variant="secondary" className="text-xs">
                Setup
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {state.canSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip Setup
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {state.currentStep} of {state.totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center space-y-1">
                <div className="flex items-center">
                  {state.progress[step.id] ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : step.id === state.currentStep ? (
                    <Circle className="h-6 w-6 text-blue-500 fill-current" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  step.id === state.currentStep 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : state.progress[step.id]
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <CurrentStepComponent />
        </CardContent>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={state.currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStepData?.title}
            </span>
          </div>

          <Button
            onClick={handleNext}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <span>
              {state.currentStep === state.totalSteps ? 'Complete Setup' : 'Next'}
            </span>
            {state.currentStep !== state.totalSteps && (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
