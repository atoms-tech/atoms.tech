'use client';

import { motion } from 'framer-motion';
import { Building } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '../OnboardingContext';

export function OrgSetupStep() {
    const { data, updateData } = useOnboarding();

    const handleInputChange = (field: string, value: string) => {
        updateData('organizationData', { [field]: value });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                <CardHeader className="text-center pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Building className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Organization Setup
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                        Configure your organization settings
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="orgName" className="text-sm font-medium">
                            Organization Name *
                        </Label>
                        <Input
                            id="orgName"
                            value={data.organizationData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Your organization name"
                            className="w-full"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <Label htmlFor="orgDescription" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="orgDescription"
                            value={data.organizationData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Brief description of your organization..."
                            rows={3}
                            className="w-full"
                        />
                    </motion.div>
                </CardContent>
            </Card>
        </div>
    );
}
