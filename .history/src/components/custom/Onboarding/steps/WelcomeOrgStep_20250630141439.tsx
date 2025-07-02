'use client';

import { motion } from 'framer-motion';
import { Building, Settings, Shield, Users } from 'lucide-react';

import { useOnboarding } from '@/components/custom/Onboarding/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WelcomeOrgStep() {
    const { targetOrganization } = useOnboarding();

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                <CardContent className="p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building className="h-8 w-8 text-white" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to {targetOrganization?.name}!
                        </h1>

                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Let's set up your organization for success with
                            requirements management
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Users className="h-6 w-6" />,
                                title: 'Team Setup',
                                description:
                                    'Configure roles and permissions for your team members',
                            },
                            {
                                icon: <Shield className="h-6 w-6" />,
                                title: 'Security & Compliance',
                                description:
                                    'Set up security policies and compliance requirements',
                            },
                            {
                                icon: <Settings className="h-6 w-6" />,
                                title: 'Organization Settings',
                                description:
                                    'Customize workflows and templates for your organization',
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white mb-3">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
