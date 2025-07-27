'use client';

import { Github, Mail, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { SiJira, SiSlack } from 'react-icons/si';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

import { MCPIntegrationCard } from './MCPIntegrationCard';

interface MCPIntegrationsProps {
    orgId: string;
}

interface IntegrationStatus {
    connected: boolean;
    lastConnected?: Date;
    userEmail?: string;
    error?: string;
}

interface IntegrationsState {
    google: IntegrationStatus;
    github: IntegrationStatus;
    jira: IntegrationStatus;
    slack: IntegrationStatus;
}

export const MCPIntegrations: React.FC<MCPIntegrationsProps> = ({ orgId }) => {
    const { toast } = useToast();
    const [integrations, setIntegrations] = useState<IntegrationsState>({
        google: { connected: false },
        github: { connected: false },
        jira: { connected: false },
        slack: { connected: false },
    });
    const [loading, setLoading] = useState(true);

    const loadIntegrationStatus = useCallback(async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API call to get integration status
            const response = await fetch(
                `/api/settings/agent/${orgId}/integrations`,
            );
            if (response.ok) {
                const data = await response.json();
                setIntegrations(data);
            }
        } catch (error) {
            console.error('Error loading integration status:', error);
            // For now, use mock data
            setIntegrations({
                google: { connected: false },
                github: { connected: false },
                jira: { connected: false },
                slack: { connected: false },
            });
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    // Load integration status on component mount
    useEffect(() => {
        loadIntegrationStatus();
    }, [loadIntegrationStatus]);

    const handleConnect = async (provider: keyof IntegrationsState) => {
        try {
            // Redirect to OAuth flow
            window.location.href = `/api/oauth/${provider}/connect?orgId=${orgId}`;
        } catch (error) {
            console.error(`Error connecting to ${provider}:`, error);
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: `Failed to connect to ${provider}. Please try again.`,
            });
        }
    };

    const handleDisconnect = async (provider: keyof IntegrationsState) => {
        try {
            const response = await fetch(`/api/oauth/${provider}/disconnect`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orgId }),
            });

            if (response.ok) {
                setIntegrations((prev) => ({
                    ...prev,
                    [provider]: { connected: false },
                }));

                toast({
                    variant: 'default',
                    title: 'Disconnected',
                    description: `Successfully disconnected from ${provider}`,
                });
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (error) {
            console.error(`Error disconnecting from ${provider}:`, error);
            toast({
                variant: 'destructive',
                title: 'Disconnection Error',
                description: `Failed to disconnect from ${provider}. Please try again.`,
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        MCP Integrations
                    </CardTitle>
                    <CardDescription>
                        Connect your organization&apos;s tools and services to
                        enhance your AI agent&apos;s capabilities. All
                        integrations are organization-scoped and use secure
                        OAuth authentication.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Google Integration */}
            <MCPIntegrationCard
                provider="google"
                title="Google Workspace"
                description="Connect to Google Drive, Gmail, Calendar, and other Google services"
                icon={<Mail className="h-6 w-6" />}
                status={integrations.google}
                onConnect={() => handleConnect('google')}
                onDisconnect={() => handleDisconnect('google')}
                features={[
                    'Access Google Drive documents',
                    'Read and send emails via Gmail',
                    'Manage calendar events',
                    'Search across Google Workspace',
                ]}
            />

            {/* GitHub Integration */}
            <MCPIntegrationCard
                provider="github"
                title="GitHub"
                description="Connect to GitHub repositories, issues, and pull requests"
                icon={<Github className="h-6 w-6" />}
                status={integrations.github}
                onConnect={() => handleConnect('github')}
                onDisconnect={() => handleDisconnect('github')}
                features={[
                    'Access repository information',
                    'Create and manage issues',
                    'Review pull requests',
                    'Search code and commits',
                ]}
            />

            {/* Jira Integration */}
            <MCPIntegrationCard
                provider="jira"
                title="Jira"
                description="Connect to Jira for project management and issue tracking"
                icon={<SiJira className="h-6 w-6" />}
                status={integrations.jira}
                onConnect={() => handleConnect('jira')}
                onDisconnect={() => handleDisconnect('jira')}
                features={[
                    'Create and update Jira tickets',
                    'Search issues and projects',
                    'Manage sprints and boards',
                    'Track project progress',
                ]}
            />

            {/* Slack Integration */}
            <MCPIntegrationCard
                provider="slack"
                title="Slack"
                description="Connect to Slack for team communication and notifications"
                icon={<SiSlack className="h-6 w-6" />}
                status={integrations.slack}
                onConnect={() => handleConnect('slack')}
                onDisconnect={() => handleDisconnect('slack')}
                features={[
                    'Send messages to channels',
                    'Access channel history',
                    'Manage team notifications',
                    'Search conversations',
                ]}
            />

            {/* Integration Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Guide</CardTitle>
                    <CardDescription>
                        How to set up and use MCP integrations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm space-y-2">
                        <p>
                            <strong>1. Connect Services:</strong> Click
                            &quot;Connect&quot; on any integration to start the
                            OAuth flow
                        </p>
                        <p>
                            <strong>2. Grant Permissions:</strong> Authorize the
                            required permissions for your organization
                        </p>
                        <p>
                            <strong>3. Use in Chat:</strong> Your AI agent can
                            now access these services through natural language
                        </p>
                        <p>
                            <strong>4. Manage Access:</strong> Disconnect
                            integrations anytime to revoke access
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Security Note:</strong> All OAuth tokens are
                            encrypted and stored securely in Supabase Vault.
                            Only your organization members can access these
                            integrations.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
