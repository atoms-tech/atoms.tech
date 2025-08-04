'use client';

import { Settings, User, Bell, Shield, Palette, Database } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InProgressContainer } from '@/components/ui/in-progress-container';
import { useUser } from '@/lib/providers/user.provider';

export function SettingsTab() {
    const { user, profile } = useUser();

    const settingsCategories = [
        {
            id: 'profile',
            title: 'Account Settings',
            description: 'Manage your profile and account details',
            icon: User,
            available: true,
        },
        {
            id: 'notifications',
            title: 'Notification Preferences',
            description: 'Control your notification settings',
            icon: Bell,
            available: false,
            estimatedCompletion: 'Q2 2024',
            features: [
                'Email notification controls',
                'In-app notification settings',
                'Digest frequency options',
                'Team mention alerts',
            ],
        },
        {
            id: 'security',
            title: 'Privacy & Security',
            description: 'Manage your security preferences',
            icon: Shield,
            available: false,
            estimatedCompletion: 'Q3 2024',
            features: [
                'Two-factor authentication',
                'Session management',
                'Data export controls',
                'Privacy settings',
            ],
        },
        {
            id: 'appearance',
            title: 'Appearance',
            description: 'Customize the look and feel of your workspace',
            icon: Palette,
            available: false,
            estimatedCompletion: 'Q2 2024',
            features: [
                'Dark/light theme toggle',
                'Custom color schemes',
                'Font size preferences',
                'Layout density options',
            ],
        },
        {
            id: 'integrations',
            title: 'Integrations',
            description: 'Connect external tools',
            icon: Database,
            available: false,
            estimatedCompletion: 'Q4 2024',
            features: [
                'GitHub integration',
                'Slack notifications',
                'API key management',
                'Webhook configurations',
            ],
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                </div>
                <p className="text-muted-foreground">
                    Manage your account preferences
                </p>
            </div>

            {/* User Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                        Your current account details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">
                                {profile?.full_name || 'Not set'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {user?.email}
                            </p>
                        </div>
                        <Button variant="outline">Edit Profile</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Settings Categories */}
            <div className="grid gap-4">
                {settingsCategories.map((category) => {
                    const IconComponent = category.icon;

                    if (category.available) {
                        return (
                            <Card key={category.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <IconComponent className="h-5 w-5" />
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {category.title}
                                            </CardTitle>
                                            <CardDescription>
                                                {category.description}
                                            </CardDescription>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Configure
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    }

                    return (
                        <InProgressContainer
                            key={category.id}
                            title={category.title}
                            description={category.description}
                            requiresModal={true}
                            estimatedCompletion={category.estimatedCompletion}
                            features={category.features}
                        >
                            <Card className="opacity-60">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <IconComponent className="h-5 w-5" />
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                {category.title}
                                            </CardTitle>
                                            <CardDescription>
                                                {category.description}
                                            </CardDescription>
                                        </div>
                                        <Button variant="ghost" size="sm" disabled>
                                            Coming Soon
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>
                        </InProgressContainer>
                    );
                })}
            </div>
        </motion.div>
    );
}