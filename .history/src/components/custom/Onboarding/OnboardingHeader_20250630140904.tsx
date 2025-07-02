'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { useOnboarding } from './OnboardingContext';

export function OnboardingHeader() {
    const router = useRouter();
    const { onboardingType, targetOrganization, user } = useOnboarding();

    const handleExit = () => {
        if (onboardingType === 'organization' && targetOrganization) {
            router.push(`/org/${targetOrganization.id}`);
        } else {
            router.push('/home');
        }
    };

    const getTitle = () => {
        if (onboardingType === 'organization') {
            return `Welcome to ${targetOrganization?.name || 'Your Organization'}`;
        }
        return 'Welcome to ATOMS.TECH';
    };

    const getSubtitle = () => {
        if (onboardingType === 'organization') {
            return "Let's set up your organization for success";
        }
        return "Let's get you started with requirements management";
    };

    return (
        <header className="border-b bg-background">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">
                                A
                            </span>
                        </div>
                        <span className="font-semibold text-foreground">
                            ATOMS.TECH
                        </span>
                    </div>

                    {/* Exit Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExit}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Exit setup</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
