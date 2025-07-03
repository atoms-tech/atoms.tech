'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Brain,
    CheckCircle,
    FileText,
    Sparkles,
    Users,
} from 'lucide-react';

import { useOnboarding } from '@/components/custom/Onboarding/OnboardingContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const nextSteps = [
    {
        icon: <FileText className="h-5 w-5" />,
        title: 'Create your first requirement',
        description: 'Start documenting what your system needs to do',
        action: 'Create Requirement',
        color: 'bg-blue-500',
    },
    {
        icon: <Users className="h-5 w-5" />,
        title: 'Invite your team',
        description: 'Collaborate with colleagues on your requirements',
        action: 'Invite Team',
        color: 'bg-green-500',
    },
    {
        icon: <Brain className="h-5 w-5" />,
        title: 'Try AI assistance',
        description: 'Get intelligent suggestions for your requirements',
        action: 'Try AI',
        color: 'bg-purple-500',
    },
];

const achievements = [
    'Profile setup complete',
    'First project created',
    'Platform tour completed',
    'Ready to collaborate',
];

export function CompletionStep() {
    const { data, onboardingType, targetOrganization } = useOnboarding();

    const getCompletionMessage = () => {
        if (onboardingType === 'organization') {
            return {
                title: `Welcome to ${targetOrganization?.name}!`,
                subtitle:
                    'Your organization is now set up and ready for collaboration',
                message:
                    "You've successfully configured your organization settings, team roles, and collaboration features.",
            };
        } else {
            return {
                title: `Welcome to ATOMS.TECH, ${data.profileData.displayName}!`,
                subtitle:
                    'You&apos;re all set up and ready to start managing requirements',
                message:
                    'You&apos;ve completed the setup process and can now start creating and managing requirements with your team.',
            };
        }
    };

    const completion = getCompletionMessage();

    return (
        <div className="max-w-3xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg">
                        <CardHeader className="text-center pb-6 pt-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 0.6 }}
                                className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle className="h-8 w-8 text-white" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {completion.title}
                                </CardTitle>
                                <p className="text-lg text-gray-600 dark:text-gray-300">
                                    {completion.subtitle}
                                </p>
                            </motion.div>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* Completion Message */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-center"
                            >
                                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                    {completion.message}
                                </p>
                            </motion.div>

                            {/* Achievements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6"
                            >
                                <div className="flex items-center justify-center mb-4">
                                    <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        What you've accomplished
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {achievements.map((achievement, index) => (
                                        <motion.div
                                            key={achievement}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: 0.6 + index * 0.1,
                                            }}
                                            className="flex items-center space-x-2"
                                        >
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {achievement}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Next Steps */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="space-y-4"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                                    Recommended next steps
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {nextSteps.map((step, index) => (
                                        <motion.div
                                            key={step.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                delay: 0.8 + index * 0.1,
                                            }}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                        >
                                            <div
                                                className={`w-8 h-8 ${step.color} rounded-lg flex items-center justify-center text-white mb-3`}
                                            >
                                                {step.icon}
                                            </div>
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                {step.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                                {step.description}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                            >
                                                {step.action}
                                                <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Final CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1 }}
                                className="text-center pt-4"
                            >
                                <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-4"
                                >
                                    🎉 Setup Complete
                                </Badge>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You can always access help and tutorials
                                    from the main menu
                                </p>
                            </motion.div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    );
}
