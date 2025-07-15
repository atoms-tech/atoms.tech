'use client';

import { motion } from 'framer-motion';
import {
    Bot,
    CheckCircle,
    ExternalLink,
    Github,
    Globe,
    Settings,
    Slack,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demo
const oauthIntegrations = [
    {
        id: 'google',
        name: 'Google Workspace',
        description: 'Access Gmail, Drive, Calendar, and other Google services',
        icon: Globe,
        status: 'disconnected' as const,
        permissions: ['Drive Access', 'Gmail Read', 'Calendar Events'],
        lastConnected: null,
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Sync repositories, issues, and pull requests',
        icon: Github,
        status: 'connected' as const,
        permissions: [
            'Repository Access',
            'Issues Read/Write',
            'Pull Requests',
        ],
        lastConnected: '2024-01-15T10:30:00Z',
    },
    {
        id: 'jira',
        name: 'Jira',
        description: 'Manage projects, issues, and workflows',
        icon: Settings,
        status: 'disconnected' as const,
        permissions: ['Project Access', 'Issue Management', 'Workflow Read'],
        lastConnected: null,
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Send notifications and manage channels',
        icon: Slack,
        status: 'error' as const,
        permissions: ['Channel Access', 'Message Send', 'User Info'],
        lastConnected: '2024-01-10T14:20:00Z',
    },
];

const mcpIntegrations = [
    {
        id: 'n8n-webhook',
        name: 'N8N Webhook',
        description: 'Trigger workflows via webhook endpoints',
        type: 'webhook' as const,
        status: 'active' as const,
        lastUsed: '2024-01-15T09:45:00Z',
        configuration: {
            webhookUrl: 'https://n8n.example.com/webhook/atoms-chat',
            method: 'POST',
        },
    },
    {
        id: 'custom-api',
        name: 'Custom API Integration',
        description: 'Connect to custom API endpoints',
        type: 'api' as const,
        status: 'inactive' as const,
        lastUsed: '2024-01-12T16:30:00Z',
        configuration: {
            baseUrl: 'https://api.example.com',
            apiKey: '***hidden***',
        },
    },
];

export default function IntegrationsDemoPage() {
    const [activeTab, setActiveTab] = useState('oauth');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'active':
                return 'Active';
            case 'error':
                return 'Error';
            case 'inactive':
                return 'Inactive';
            default:
                return 'Not Connected';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Integrations Demo</h1>
                    <p className="text-muted-foreground">
                        Manage your OAuth and MCP integrations for the ATOMS
                        platform
                    </p>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="oauth">
                            OAuth Integrations
                        </TabsTrigger>
                        <TabsTrigger value="mcp">MCP Integrations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="oauth" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid gap-6 md:grid-cols-2"
                        >
                            {oauthIntegrations.map((integration) => {
                                const Icon = integration.icon;
                                return (
                                    <Card
                                        key={integration.id}
                                        className="relative"
                                    >
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <Icon className="h-8 w-8" />
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {integration.name}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {
                                                                integration.description
                                                            }
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(
                                                        integration.status,
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {getStatusText(
                                                            integration.status,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">
                                                        Permissions
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {integration.permissions.map(
                                                            (permission) => (
                                                                <Badge
                                                                    key={
                                                                        permission
                                                                    }
                                                                    variant="secondary"
                                                                >
                                                                    {permission}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">
                                                        Last connected:{' '}
                                                        {formatDate(
                                                            integration.lastConnected,
                                                        )}
                                                    </span>
                                                    <div className="flex space-x-2">
                                                        {integration.status ===
                                                        'connected' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                Disconnect
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm">
                                                                Connect
                                                                <ExternalLink className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="mcp" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid gap-6 md:grid-cols-2"
                        >
                            {mcpIntegrations.map((integration) => (
                                <Card key={integration.id} className="relative">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Bot className="h-8 w-8" />
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {integration.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {
                                                            integration.description
                                                        }
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(
                                                    integration.status,
                                                )}
                                                <span className="text-sm font-medium">
                                                    {getStatusText(
                                                        integration.status,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">
                                                    Configuration
                                                </h4>
                                                <div className="space-y-2">
                                                    {Object.entries(
                                                        integration.configuration,
                                                    ).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className="flex justify-between text-sm"
                                                        >
                                                            <span className="text-muted-foreground capitalize">
                                                                {key
                                                                    .replace(
                                                                        /([A-Z])/g,
                                                                        ' $1',
                                                                    )
                                                                    .trim()}
                                                                :
                                                            </span>
                                                            <span className="font-mono">
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Last used:{' '}
                                                    {formatDate(
                                                        integration.lastUsed,
                                                    )}
                                                </span>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            checked={
                                                                integration.status ===
                                                                'active'
                                                            }
                                                            disabled
                                                        />
                                                        <span className="text-sm">
                                                            {integration.status ===
                                                            'active'
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Configure
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
