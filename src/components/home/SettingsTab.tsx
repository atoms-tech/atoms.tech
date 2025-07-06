'use client';

import { motion } from 'framer-motion';
import { Bell, Link, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { InProgressContainer } from '@/components/ui/in-progress-container';
import { InProgressModal } from '@/components/ui/in-progress-modal';

interface ModalData {
    title: string;
    description: string;
    features: string[];
    estimatedCompletion: string;
}

export function SettingsTab() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<ModalData | null>(null);

    const openModal = (data: ModalData) => {
        setModalData(data);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalData(null);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
            >
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account preferences and application settings
                </p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2"
            >
                {/* Account Settings - Implemented */}
                <motion.div variants={itemVariants}>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-300"
                        onClick={() => router.push('/home/user/account')}
                    >
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <User className="h-6 w-6 text-primary" />
                                <div>
                                    <CardTitle className="text-lg">
                                        Account Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Manage your profile and account details
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Update your personal information, change
                                password, and manage account security.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notification Preferences - In Progress */}
                <motion.div variants={itemVariants}>
                    <InProgressContainer
                        title="Notification Preferences"
                        description="Configure how and when you receive notifications"
                        requiresModal={true}
                        onModalOpen={() =>
                            openModal({
                                title: 'Notification Preferences',
                                description:
                                    'Comprehensive notification management system is currently being developed.',
                                features: [
                                    'Email notification controls',
                                    'In-app notification settings',
                                    'Mobile push notifications',
                                    'Digest and summary options',
                                    'Team and project-specific settings',
                                ],
                                estimatedCompletion: 'Q2 2025',
                            })
                        }
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <Bell className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-lg">
                                            Notification Preferences
                                        </CardTitle>
                                        <CardDescription>
                                            Control your notification settings
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Customize when and how you receive
                                    notifications from the platform.
                                </p>
                            </CardContent>
                        </Card>
                    </InProgressContainer>
                </motion.div>

                {/* Privacy & Security - In Progress */}
                <motion.div variants={itemVariants}>
                    <InProgressContainer
                        title="Privacy & Security"
                        description="Advanced security and privacy controls"
                        requiresModal={true}
                        onModalOpen={() =>
                            openModal({
                                title: 'Privacy & Security',
                                description:
                                    'Enhanced security features and privacy controls are being implemented.',
                                features: [
                                    'Two-factor authentication',
                                    'Session management',
                                    'Data export and deletion',
                                    'Privacy settings',
                                    'Security audit logs',
                                ],
                                estimatedCompletion: 'Q1 2025',
                            })
                        }
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <Shield className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-lg">
                                            Privacy & Security
                                        </CardTitle>
                                        <CardDescription>
                                            Manage your security preferences
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Configure security settings and privacy
                                    controls for your account.
                                </p>
                            </CardContent>
                        </Card>
                    </InProgressContainer>
                </motion.div>

                {/* Integrations - In Progress */}
                <motion.div variants={itemVariants}>
                    <InProgressContainer
                        title="Integrations"
                        description="Connect with external tools and services"
                        requiresModal={true}
                        onModalOpen={() =>
                            openModal({
                                title: 'Integrations',
                                description:
                                    'Third-party integrations and API connections are being developed.',
                                features: [
                                    'GitHub integration',
                                    'Slack notifications',
                                    'Jira synchronization',
                                    'Microsoft Teams',
                                    'Custom webhooks',
                                ],
                                estimatedCompletion: 'Q3 2025',
                            })
                        }
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <Link className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle className="text-lg">
                                            Integrations
                                        </CardTitle>
                                        <CardDescription>
                                            Connect external tools
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Integrate with your favorite tools and
                                    services.
                                </p>
                            </CardContent>
                        </Card>
                    </InProgressContainer>
                </motion.div>
            </motion.div>

            {/* Modal */}
            {modalData && (
                <InProgressModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={modalData.title}
                    description={modalData.description}
                    features={modalData.features}
                    estimatedCompletion={modalData.estimatedCompletion}
                />
            )}
        </div>
    );
}
