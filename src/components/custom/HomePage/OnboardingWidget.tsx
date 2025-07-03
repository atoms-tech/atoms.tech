'use client';

import { motion } from 'framer-motion';
import {
    Brain,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Circle,
    ExternalLink,
    FileText,
    FolderPlus,
    Rocket,
    UserPlus,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { OnboardingProgress } from '@/lib/db/server/home.server';
import { Organization } from '@/types/base/organizations.types';

interface OnboardingWidgetProps {
    progress: OnboardingProgress;
    organizations: Organization[];
    userId: string;
}

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    icon: React.ReactNode;
    action?: () => void;
    actionLabel?: string;
}

export function OnboardingWidget({
    progress,
    organizations,
    userId,
}: OnboardingWidgetProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(progress.is_new_user);
    const [isDismissed, setIsDismissed] = useState(false);

    const steps: OnboardingStep[] = [
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
                // Navigate to demo or first project
                if (organizations.length > 0) {
                    const personalOrg = organizations.find(
                        (org) => org.type === 'personal',
                    );
                    if (personalOrg) {
                        router.push(`/org/${personalOrg.id}/demo`);
                    }
                }
            },
            actionLabel: 'Try Demo',
        },
        {
            id: 'use-ai-analysis',
            title: 'Try AI analysis',
            description: 'Let AI help improve your requirements',
            completed: progress.has_used_ai_analysis,
            icon: <Brain className="h-4 w-4" />,
            action: () => {
                if (organizations.length > 0) {
                    const personalOrg = organizations.find(
                        (org) => org.type === 'personal',
                    );
                    if (personalOrg) {
                        router.push(`/org/${personalOrg.id}/demo`);
                    }
                }
            },
            actionLabel: 'Try AI Features',
        },
        {
            id: 'invite-members',
            title: 'Invite team members',
            description: 'Collaborate with your team',
            completed: progress.has_invited_members,
            icon: <UserPlus className="h-4 w-4" />,
            action: () => {
                if (organizations.length > 0) {
                    router.push(`/org/${organizations[0].id}`);
                }
            },
            actionLabel: 'Invite Team',
        },
        {
            id: 'explore-features',
            title: 'Explore all features',
            description: 'Discover traceability, templates, and more',
            completed: progress.completion_percentage >= 80,
            icon: <Rocket className="h-4 w-4" />,
            action: () => {
                window.open('https://atoms.tech/docs', '_blank');
            },
            actionLabel: 'View Docs',
        },
    ];

    const completedSteps = steps.filter((step) => step.completed).length;

    if (
        isDismissed ||
        (!progress.is_new_user && progress.completion_percentage >= 80)
    ) {
        return null;
    }

    return (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Rocket className="h-5 w-5" />
                        Quick Start
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDismissed(true)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {completedSteps} of {steps.length} completed
                        </span>
                        <span className="font-medium">
                            {progress.completion_percentage}%
                        </span>
                    </div>
                    <Progress
                        value={progress.completion_percentage}
                        className="h-2"
                    />
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {step.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {step.icon}
                                        <h4 className="text-sm font-medium">
                                            {step.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {step.description}
                                    </p>
                                    {!step.completed && step.action && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={step.action}
                                            className="text-xs h-7"
                                        >
                                            {step.actionLabel}
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {progress.is_new_user && (
                        <div className="pt-3 border-t">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Need help getting started?
                                </p>
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                'https://atoms.tech/docs',
                                                '_blank',
                                            )
                                        }
                                    >
                                        Documentation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const personalOrg =
                                                organizations.find(
                                                    (org) =>
                                                        org.type === 'personal',
                                                );
                                            if (personalOrg) {
                                                router.push(
                                                    `/org/${personalOrg.id}/demo`,
                                                );
                                            }
                                        }}
                                    >
                                        Try Demo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
