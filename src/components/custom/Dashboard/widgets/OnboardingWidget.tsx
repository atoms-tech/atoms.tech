'use client';

import { motion } from 'framer-motion';
import {
    Brain,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Circle,
    FileText,
    FolderPlus,
    Rocket,
    UserPlus,
    X,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WidgetProps, OrganizationData } from '@/types/dashboard.types';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    icon: React.ReactNode;
    action?: () => void;
    actionLabel?: string;
    isOptional?: boolean;
}

export function OnboardingWidget({ instance: _instance, data, isEditing }: WidgetProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    // Mock progress data - in real app this would come from props/API
    const progress = data?.onboardingProgress || {
        is_new_user: true,
        completion_percentage: 25,
        project_count: 0,
        requirement_count: 0,
        team_member_count: 0,
        ai_usage_count: 0,
    };

    const organizations = data?.organizations || [];

    const steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: 'Welcome to Atoms!',
            description: 'Learn the basics of requirements management',
            completed: false,
            icon: <Rocket className="h-4 w-4" />,
            action: () => {
                window.open(
                    'https://atoms.tech/docs/getting-started',
                    '_blank',
                );
            },
            actionLabel: 'Start Tutorial',
        },
        {
            id: 'create-project',
            title: 'Create your first project',
            description: 'Start organizing your requirements',
            completed: progress.project_count > 0,
            icon: <FolderPlus className="h-4 w-4" />,
            action: () => {
                if (organizations.length === 1) {
                    router.push(`/org/${organizations[0].id}`);
                } else {
                    router.push('/home/user');
                }
            },
            actionLabel: 'Create Project',
        },
        {
            id: 'add-requirement',
            title: 'Add your first requirement',
            description: 'Document what your system needs to do',
            completed: progress.requirement_count > 0,
            icon: <FileText className="h-4 w-4" />,
            action: () => {
                if (organizations.length > 0) {
                    const personalOrg = (organizations as OrganizationData[]).find(
                        (org) => org.type === 'individual',
                    );
                    if (personalOrg) {
                        router.push(`/org/${personalOrg.id}/demo`);
                    }
                }
            },
            actionLabel: 'Try Demo',
        },
        {
            id: 'invite-team',
            title: 'Invite team members',
            description: 'Collaborate with your team on requirements',
            completed: progress.team_member_count > 1,
            icon: <UserPlus className="h-4 w-4" />,
            action: () => {
                if (organizations.length > 0) {
                    router.push(`/org/${organizations[0].id}/settings/members`);
                }
            },
            actionLabel: 'Invite Team',
            isOptional: true,
        },
        {
            id: 'try-ai',
            title: 'Try AI assistance',
            description: 'Use AI to help write and analyze requirements',
            completed: progress.ai_usage_count > 0,
            icon: <Brain className="h-4 w-4" />,
            action: () => {
                if (organizations.length > 0) {
                    const personalOrg = (organizations as OrganizationData[]).find(
                        (org) => org.type === 'individual',
                    );
                    if (personalOrg) {
                        router.push(`/org/${personalOrg.id}/demo?ai=true`);
                    }
                }
            },
            actionLabel: 'Try AI',
            isOptional: true,
        },
        {
            id: 'explore-features',
            title: 'Explore all features',
            description: 'Discover traceability, templates, and more',
            completed: progress.completion_percentage >= 80,
            icon: <Zap className="h-4 w-4" />,
            action: () => {
                window.open('https://atoms.tech/docs', '_blank');
            },
            actionLabel: 'View Docs',
            isOptional: true,
        },
    ];

    const completedSteps = steps.filter((step) => step.completed).length;
    const requiredSteps = steps.filter((step) => !step.isOptional);
    const completedRequiredSteps = requiredSteps.filter(
        (step) => step.completed,
    ).length;

    if (
        isDismissed ||
        (!progress.is_new_user && progress.completion_percentage >= 80)
    ) {
        return null;
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                            <Rocket className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                Getting Started
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Complete these steps to get the most out of
                                Atoms
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {completedSteps}/{steps.length} complete
                        </Badge>
                        {!isEditing && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsDismissed(true)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                            {Math.round((completedSteps / steps.length) * 100)}%
                        </span>
                    </div>
                    <Progress
                        value={(completedSteps / steps.length) * 100}
                        className="h-2"
                    />
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-3">
                    {steps
                        .slice(0, isExpanded ? steps.length : 3)
                        .map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                    step.completed
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex-shrink-0">
                                    {step.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="text-gray-600 dark:text-gray-400">
                                            {step.icon}
                                        </div>
                                        <h4
                                            className={`font-medium text-sm ${step.completed ? 'text-green-700 dark:text-green-300' : ''}`}
                                        >
                                            {step.title}
                                        </h4>
                                        {step.isOptional && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                Optional
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {step.description}
                                    </p>
                                </div>

                                {!step.completed && step.action && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={step.action}
                                        className="flex-shrink-0 text-xs"
                                    >
                                        {step.actionLabel}
                                    </Button>
                                )}
                            </motion.div>
                        ))}
                </div>

                {steps.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-3 text-xs"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show {steps.length - 3} More Steps
                            </>
                        )}
                    </Button>
                )}

                {completedRequiredSteps === requiredSteps.length && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium text-sm">
                                Great job!
                            </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            You&apos;ve completed the essential steps. Continue
                            exploring to unlock more features!
                        </p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
