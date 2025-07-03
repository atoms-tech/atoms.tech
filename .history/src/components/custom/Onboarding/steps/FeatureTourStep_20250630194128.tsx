'use client';

import { motion } from 'framer-motion';
import { BarChart3, Brain, FileText, Play, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
    {
        icon: <FileText className="h-6 w-6" />,
        title: 'Requirements Editor',
        description:
            'Create and edit requirements with our powerful block-based editor',
        demo: 'Try Editor',
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: 'Team Collaboration',
        description: 'Work together in real-time with comments and mentions',
        demo: 'See Collaboration',
    },
    {
        icon: <Brain className="h-6 w-6" />,
        title: 'AI Assistant',
        description:
            'Get intelligent suggestions and analysis for your requirements',
        demo: 'Try AI',
    },
    {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Analytics & Reports',
        description: 'Track progress and generate compliance reports',
        demo: 'View Analytics',
    },
];

export function FeatureTourStep() {
    return (
        <div className="max-w-4xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                <CardHeader className="text-center pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Play className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Explore key features
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                        Take a quick tour of the main features you&apos;ll be using
                    </p>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                            >
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    {feature.description}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    {feature.demo}
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
