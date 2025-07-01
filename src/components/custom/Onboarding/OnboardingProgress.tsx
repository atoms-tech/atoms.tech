'use client';

import { motion } from 'framer-motion';
// import { Check } from 'lucide-react';

// import { Progress } from '@/components/ui/progress';

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
    percentage: number;
}

export function OnboardingProgress({
    currentStep,
    totalSteps,
    percentage,
}: OnboardingProgressProps) {
    return (
        <div className="w-full">
            {/* Step Counter */}
            <div className="text-center mb-4">
                <div className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {totalSteps}
                </div>
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Step Dots */}
            <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: totalSteps }, (_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                            index <= currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
