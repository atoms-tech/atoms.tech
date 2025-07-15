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
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import LayoutView from '@/components/views/LayoutView';
import { useUser } from '@/lib/providers/user.provider';

// Types for integrations
interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'connected' | 'disconnected' | 'error';
    type: 'oauth' | 'mcp';
    provider?: 'google' | 'github' | 'jira' | 'slack';
    lastConnected?: string;
    scopes?: string[];
}

interface MCPIntegration {
    id: string;
    name: string;
    description: string;
    type: string;
    configuration: Record<string, unknown>;
    isActive: boolean;
    lastUsed?: string;
}

export default function IntegrationsPage() {
    const params = useParams();
    const orgId = params?.orgId as string;
    const { user: _user, profile: _profile } = useUser();
    const { toast } = useToast();

    // State management
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [mcpIntegrations, setMcpIntegrations] = useState<MCPIntegration[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [connectingIntegration, setConnectingIntegration] = useState<
        string | null
    >(null);

    const initializeIntegrations = useCallback(async () => {
        setIsLoading(true);
        try {
            // Mock data for now - will be replaced with actual API calls
            const mockIntegrations: Integration[] = [
                {
                    id: 'google',
                    name: 'Google Workspace',
                    description: 'Connect to Google Drive, Gmail, and Calendar',
                    icon: Globe,
                    status: 'disconnected',
                    type: 'oauth',
                    provider: 'google',
                    scopes: [
                        'drive.readonly',
                        'gmail.readonly',
                        'calendar.readonly',
                    ],
                },
                {
                    id: 'github',
                    name: 'GitHub',
                    description:
                        'Access repositories, issues, and pull requests',
                    icon: Github,
                    status: 'connected',
                    type: 'oauth',
                    provider: 'github',
                    lastConnected: '2024-01-15T10:30:00Z',
                    scopes: ['repo', 'read:user', 'read:org'],
                },
                {
                    id: 'jira',
                    name: 'Jira',
                    description:
                        'Sync with Jira projects, issues, and workflows',
                    icon: Bot,
                    status: 'disconnected',
                    type: 'oauth',
                    provider: 'jira',
                    scopes: ['read:jira-work', 'write:jira-work'],
                },
                {
                    id: 'slack',
                    name: 'Slack',
                    description:
                        'Send notifications and messages to Slack channels',
                    icon: Slack,
                    status: 'error',
                    type: 'oauth',
                    provider: 'slack',
                    scopes: ['channels:read', 'chat:write', 'users:read'],
                },
            ];

            const mockMcpIntegrations: MCPIntegration[] = [
                {
                    id: 'n8n-webhook',
                    name: 'N8N Webhook',
                    description: 'Custom workflow automation via N8N',
                    type: 'webhook',
                    configuration: {
                        webhookUrl:
                            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '',
                    },
                    isActive: true,
                    lastUsed: '2024-01-15T14:20:00Z',
                },
                {
                    id: 'custom-api',
                    name: 'Custom API Integration',
                    description: 'Connect to custom APIs and services',
                    type: 'api',
                    configuration: {},
                    isActive: false,
                },
            ];

            setIntegrations(mockIntegrations);
            setMcpIntegrations(mockMcpIntegrations);
        } catch (error) {
            console.error('Failed to load integrations:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load integrations',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Initialize integrations data
    useEffect(() => {
        initializeIntegrations();
    }, [initializeIntegrations]);

    const handleOAuthConnect = async (integration: Integration) => {
        setConnectingIntegration(integration.id);
        try {
            // Redirect to OAuth provider
            const redirectUrl = `/auth/${integration.provider}?orgId=${orgId}&returnTo=${encodeURIComponent(window.location.pathname)}`;
            window.location.href = redirectUrl;
        } catch (error) {
            console.error('OAuth connection failed:', error);
            toast({
                variant: 'destructive',
                title: 'Connection Failed',
                description: `Failed to connect to ${integration.name}`,
            });
        } finally {
            setConnectingIntegration(null);
        }
    };

    const handleOAuthDisconnect = async (integration: Integration) => {
        try {
            // API call to disconnect OAuth integration
            // await disconnectOAuthIntegration(orgId, integration.id);

            // Update local state
            setIntegrations((prev) =>
                prev.map((int) =>
                    int.id === integration.id
                        ? {
                              ...int,
                              status: 'disconnected' as const,
                              lastConnected: undefined,
                          }
                        : int,
                ),
            );

            toast({
                variant: 'default',
                title: 'Disconnected',
                description: `Successfully disconnected from ${integration.name}`,
            });
        } catch (error) {
            console.error('Disconnect failed:', error);
            toast({
                variant: 'destructive',
                title: 'Disconnect Failed',
                description: `Failed to disconnect from ${integration.name}`,
            });
        }
    };

    const getStatusIcon = (status: Integration['status']) => {
        switch (status) {
            case 'connected':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusText = (status: Integration['status']) => {
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'error':
                return 'Error';
            default:
                return 'Not Connected';
        }
    };

    const getStatusColor = (status: Integration['status']) => {
        switch (status) {
            case 'connected':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    if (isLoading) {
        return (
            <LayoutView>
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        <h1 className="text-2xl font-semibold">Integrations</h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </LayoutView>
        );
    }

    return (
        <LayoutView>
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    <h1 className="text-2xl font-semibold">Integrations</h1>
                </div>

                <Tabs defaultValue="oauth" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                            value="oauth"
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            OAuth Integrations
                        </TabsTrigger>
                        <TabsTrigger
                            value="mcp"
                            className="flex items-center gap-2"
                        >
                            <Bot className="h-4 w-4" />
                            MCP Integrations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="oauth" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>OAuth Integrations</CardTitle>
                                <CardDescription>
                                    Connect to external services using OAuth
                                    authentication. These integrations are
                                    scoped to your organization.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {integrations.map((integration) => (
                                <motion.div
                                    key={integration.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className="h-full">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <integration.icon className="h-8 w-8 text-primary" />
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
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(
                                                        integration.status,
                                                    )}
                                                    <span
                                                        className={`text-sm font-medium ${getStatusColor(integration.status)}`}
                                                    >
                                                        {getStatusText(
                                                            integration.status,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {integration.lastConnected && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Last connected:{' '}
                                                        {new Date(
                                                            integration.lastConnected,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}

                                                {integration.scopes && (
                                                    <div>
                                                        <div className="text-sm font-medium mb-2">
                                                            Permissions:
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {integration.scopes.map(
                                                                (scope) => (
                                                                    <span
                                                                        key={
                                                                            scope
                                                                        }
                                                                        className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                                                                    >
                                                                        {scope}
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    {integration.status ===
                                                    'connected' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleOAuthDisconnect(
                                                                    integration,
                                                                )
                                                            }
                                                            className="flex-1"
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleOAuthConnect(
                                                                    integration,
                                                                )
                                                            }
                                                            disabled={
                                                                connectingIntegration ===
                                                                integration.id
                                                            }
                                                            className="flex-1"
                                                        >
                                                            {connectingIntegration ===
                                                            integration.id
                                                                ? 'Connecting...'
                                                                : 'Connect'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="mcp" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>MCP Integrations</CardTitle>
                                <CardDescription>
                                    Model Context Protocol integrations for the
                                    AI chat agent. Configure custom workflows
                                    and API connections.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 gap-4">
                            {mcpIntegrations.map((integration) => (
                                <motion.div
                                    key={integration.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Bot className="h-8 w-8 text-primary" />
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
                                                <div className="flex items-center gap-2">
                                                    {integration.isActive ? (
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span
                                                        className={`text-sm font-medium ${
                                                            integration.isActive
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : 'text-gray-600 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {integration.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="text-sm text-muted-foreground">
                                                    Type: {integration.type}
                                                </div>

                                                {integration.lastUsed && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Last used:{' '}
                                                        {new Date(
                                                            integration.lastUsed,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                    >
                                                        Configure
                                                    </Button>
                                                    <Button
                                                        variant={
                                                            integration.isActive
                                                                ? 'outline'
                                                                : 'default'
                                                        }
                                                        size="sm"
                                                        className="flex-1"
                                                    >
                                                        {integration.isActive
                                                            ? 'Disable'
                                                            : 'Enable'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </LayoutView>
    );
}
