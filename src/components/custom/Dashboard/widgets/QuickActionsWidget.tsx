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
import { WidgetProps, OrganizationData } from '@/types/dashboard.types';

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
    shortcut?: string;
}

export function QuickActionsWidget({ instance, data }: WidgetProps) {
    const router = useRouter();

    // Get organizations and user data from props
    const organizations = data?.organizations || [];
    const userId = data?.userId;

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
        const personalOrg = (organizations as OrganizationData[]).find(
            (org) => org.type === 'individual',
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
        const personalOrg = (organizations as OrganizationData[]).find(
            (org) => org.type === 'individual',
        );
        if (personalOrg) {
            router.push(`/org/${personalOrg.id}/demo`);
        }
    };

    const quickActions: QuickAction[] = [
        {
            id: 'new-project',
            title: 'New Project',
            description: 'Start a new requirements project',
            icon: <Plus className="h-5 w-5" />,
            action: handleCreateProject,
            color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            shortcut: 'Ctrl+N',
        },
        {
            id: 'new-org',
            title: 'New Organization',
            description: 'Create a new organization',
            icon: <Building className="h-5 w-5" />,
            action: handleCreateOrganization,
            color: 'from-green-500/20 to-green-600/20 border-green-500/30',
            shortcut: 'Ctrl+O',
        },
        {
            id: 'ai-analysis',
            title: 'AI Analysis',
            description: 'Try AI-powered requirement analysis',
            icon: <Brain className="h-5 w-5" />,
            action: handleAIAnalysis,
            color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
            shortcut: 'Ctrl+A',
        },
        {
            id: 'invite-team',
            title: 'Invite Team',
            description: 'Collaborate with team members',
            icon: <Users className="h-5 w-5" />,
            action: handleInviteTeam,
            color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
            shortcut: 'Ctrl+I',
        },
        {
            id: 'documentation',
            title: 'Documentation',
            description: 'Learn how to use ATOMS.TECH',
            icon: <FileText className="h-5 w-5" />,
            action: handleDocumentation,
            color: 'from-teal-500/20 to-teal-600/20 border-teal-500/30',
        },
        {
            id: 'quick-start',
            title: 'Quick Start',
            description: 'Interactive tutorial and demo',
            icon: <Zap className="h-5 w-5" />,
            action: handleQuickStart,
            color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
        },
    ];

    // Get layout from config
    const layout = instance.config.layout || 'grid';
    const showShortcuts = instance.config.showShortcuts !== false;

    return (
        <Card className="h-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-auto">
                <div
                    className={`grid gap-3 h-full ${
                        layout === 'list'
                            ? 'grid-cols-1'
                            : instance.size.width > 400
                              ? 'grid-cols-3'
                              : 'grid-cols-2'
                    }`}
                >
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
                                className={`h-auto p-3 flex flex-col items-center gap-2 bg-gradient-to-br ${action.color} hover:scale-105 transition-all duration-200 group w-full`}
                            >
                                <div className="text-white group-hover:scale-110 transition-transform">
                                    {action.icon}
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-sm font-medium text-white truncate">
                                        {action.title}
                                    </div>
                                    {layout !== 'compact' && (
                                        <div className="text-xs text-gray-300 mt-1 line-clamp-2">
                                            {action.description}
                                        </div>
                                    )}
                                    {showShortcuts && action.shortcut && (
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
