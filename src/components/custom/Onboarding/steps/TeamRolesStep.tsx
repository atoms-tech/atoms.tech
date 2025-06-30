'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TeamRolesStep() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                <CardHeader className="text-center pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Team Roles
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                        Set up team roles and permissions
                    </p>
                </CardHeader>

                <CardContent>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8"
                    >
                        <p className="text-gray-600 dark:text-gray-300">
                            Team roles configuration will be implemented here
                        </p>
                    </motion.div>
                </CardContent>
            </Card>
        </div>
    );
}
