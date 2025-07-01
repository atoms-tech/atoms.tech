'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Crown, Eye, Shield, User, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useOnboarding } from '../OnboardingContext';

const roleOptions = [
    {
        id: 'individual',
        title: 'Individual Contributor',
        description:
            'I work on requirements independently or as part of a small team',
        icon: <User className="h-6 w-6" />,
        features: [
            'Personal workspace',
            'Basic collaboration',
            'AI assistance',
            'Template library',
        ],
        color: 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600',
    },
    {
        id: 'team-lead',
        title: 'Team Lead / Manager',
        description: 'I manage a team and need to oversee multiple projects',
        icon: <Users className="h-6 w-6" />,
        features: [
            'Team management',
            'Project oversight',
            'Advanced analytics',
            'Workflow automation',
        ],
        color: 'border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600',
    },
    {
        id: 'admin',
        title: 'Organization Admin',
        description:
            'I need to set up and manage the platform for my organization',
        icon: <Crown className="h-6 w-6" />,
        features: [
            'User management',
            'Organization settings',
            'Security controls',
            'Compliance features',
        ],
        color: 'border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600',
    },
];

export function RoleSelectionStep() {
    const { data, updateData } = useOnboarding();

    const handleRoleSelect = (roleId: string) => {
        updateData('profileData', { role: roleId });
    };

    return (
        <div className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-blue-50/30 dark:from-green-950/20 dark:to-blue-950/20" />

            <div className="relative p-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            type: 'spring',
                            stiffness: 200,
                        }}
                        className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-600/25"
                    >
                        <Shield className="h-8 w-8 text-white" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent mb-3"
                    >
                        What&apos;s your role?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-slate-600 dark:text-slate-300"
                    >
                        This helps us customize your experience and show
                        relevant features
                    </motion.p>
                </motion.div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roleOptions.map((role, index) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                delay: 0.4 + index * 0.1,
                                duration: 0.5,
                                type: 'spring',
                                stiffness: 200,
                            }}
                            className={`group relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                data.profileData.role === role.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-xl shadow-blue-600/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-600/10'
                            } backdrop-blur-sm`}
                            onClick={() => handleRoleSelect(role.id)}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {data.profileData.role === role.id && (
                                <div className="absolute top-4 right-4">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center">
                                <div
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                                        data.profileData.role === role.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    {role.icon}
                                </div>

                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {role.title}
                                </h3>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    {role.description}
                                </p>

                                <div className="space-y-2 w-full">
                                    {role.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Help Text */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50"
                >
                    <div className="flex items-center justify-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                            <span className="text-white text-sm">💡</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-center">
                            Don&apos;t worry - you can always change this later
                            in your settings
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
