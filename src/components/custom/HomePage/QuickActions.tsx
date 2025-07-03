'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Brain,
    Building,
    FileText,
    Plus,
    Users,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Organization } from '@/types/base/organizations.types';

interface QuickActionsProps {
    organizations: Organization[];
    userId: string;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
    shortcut?: string;
}

export function QuickActions({ organizations, userId }: QuickActionsProps) {
    const router = useRouter();

    const handleCreateProject = () => {
        if (organizations.length === 1) {
            router.push(`/org/${organizations[0].id}`);
        } else {
            router.push('/home/user');
        }
    };

    const handleCreateOrganization = () => {
        router.push('/home/user');
    };

    const handleAIAnalysis = () => {
        const personalOrg = organizations.find(
            (org) => org.type === 'personal',
        );
        if (personalOrg) {
            router.push(`/org/${personalOrg.id}/demo`);
        }
    };

    const handleInviteTeam = () => {
        if (organizations.length > 0) {
            router.push(`/org/${organizations[0].id}`);
        }
    };

    const handleDocumentation = () => {
        window.open('https://atoms.tech/docs', '_blank');
    };

    const handleQuickStart = () => {
        const personalOrg = organizations.find(
            (org) => org.type === 'personal',
        );
        if (personalOrg) {
            router.push(`/org/${personalOrg.id}/demo`);
        }
    };

    // Setup keyboard shortcuts
    const { shortcuts } = useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'n',
                ctrlKey: true,
                action: handleCreateProject,
                description: 'Create new project',
            },
            {
                key: 'o',
                ctrlKey: true,
                action: handleCreateOrganization,
                description: 'Create new organization',
            },
            {
                key: 'a',
                ctrlKey: true,
                action: handleAIAnalysis,
                description: 'Open AI analysis',
            },
            {
                key: 'i',
                ctrlKey: true,
                action: handleInviteTeam,
                description: 'Invite team members',
            },
        ],
        enabled: true,
    });

    const quickActions: QuickAction[] = [
        {
            id: 'new-project',
            title: 'New Project',
            description: 'Start a new requirements project',
            icon: <Plus className="h-6 w-6" />,
            action: handleCreateProject,
            color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            shortcut: 'Ctrl+N',
        },
        {
            id: 'new-org',
            title: 'New Organization',
            description: 'Create a new organization',
            icon: <Building className="h-6 w-6" />,
            action: handleCreateOrganization,
            color: 'from-green-500/20 to-green-600/20 border-green-500/30',
            shortcut: 'Ctrl+O',
        },
        {
            id: 'ai-analysis',
            title: 'AI Analysis',
            description: 'Try AI-powered requirement analysis',
            icon: <Brain className="h-6 w-6" />,
            action: handleAIAnalysis,
            color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
            shortcut: 'Ctrl+A',
        },
        {
            id: 'invite-team',
            title: 'Invite Team',
            description: 'Collaborate with team members',
            icon: <Users className="h-6 w-6" />,
            action: handleInviteTeam,
            color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
            shortcut: 'Ctrl+I',
        },
        {
            id: 'documentation',
            title: 'Documentation',
            description: 'Learn how to use ATOMS.TECH',
            icon: <FileText className="h-6 w-6" />,
            action: handleDocumentation,
            color: 'from-teal-500/20 to-teal-600/20 border-teal-500/30',
        },
        {
            id: 'quick-start',
            title: 'Quick Start',
            description: 'Interactive tutorial and demo',
            icon: <Zap className="h-6 w-6" />,
            action: handleQuickStart,
            color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
        },
    ];

    return (
        <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Button
                                variant="ghost"
                                onClick={action.action}
                                className={`h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-br ${action.color} hover:scale-105 transition-all duration-200 group w-full`}
                            >
                                <div className="text-white group-hover:scale-110 transition-transform">
                                    {action.icon}
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-medium text-white">
                                        {action.title}
                                    </div>
                                    <div className="text-xs text-gray-300 mt-1">
                                        {action.description}
                                    </div>
                                    {action.shortcut && (
                                        <div className="text-xs text-gray-400 mt-1 font-mono">
                                            {action.shortcut}
                                        </div>
                                    )}
                                </div>
                                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
