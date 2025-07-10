'use client';

import { Save, Settings, TestTube, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/lib/providers/user.provider';

import { useAgentStore } from './hooks/useAgentStore';

interface AgentSettingsProps {
    onClose?: () => void;
}

export const AgentSettings: React.FC<AgentSettingsProps> = ({ onClose }) => {
    const {
        n8nWebhookUrl,
        connectionStatus,
        setN8nConfig,
        initializeConnection,
        clearMessages,
        setUserContext,
        currentOrgId,
        currentPinnedOrganizationId,
    } = useAgentStore();
    const { user, profile } = useUser();

    const [webhookUrl, setWebhookUrl] = useState(n8nWebhookUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [_loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);

            // Set user context including username
            setUserContext({
                userId: user?.id,
                orgId: currentOrgId,
                pinnedOrganizationId: currentPinnedOrganizationId,
                username: profile?.full_name || user?.email?.split('@')[0],
            });

            setN8nConfig(webhookUrl);
            // Auto-test connection after saving
            if (webhookUrl) {
                await testConnection();
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
        } finally {
            setLoading(false);
            setIsSaving(false);
        }
    };

    const testConnection = async () => {
        if (!webhookUrl) return;

        setIsTesting(true);
        try {
            await initializeConnection();
        } catch (error) {
            console.error('Connection test failed:', error);
        } finally {
            setIsTesting(false);
        }
    };

    const handleClearMessages = () => {
        if (
            confirm(
                'Are you sure you want to clear all chat messages? This action cannot be undone.',
            )
        ) {
            clearMessages();
        }
    };

    const getConnectionStatusBadge = () => {
        switch (connectionStatus) {
            case 'connected':
                return (
                    <Badge variant="default" className="bg-green-600">
                        Connected
                    </Badge>
                );
            case 'connecting':
                return (
                    <Badge variant="secondary" className="bg-yellow-600">
                        Connecting...
                    </Badge>
                );
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Disconnected</Badge>;
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle>Agent Settings</CardTitle>
                    </div>
                    {getConnectionStatusBadge()}
                </div>
                <CardDescription>
                    Configure your AI agent&apos;s connection to N8N workflow
                    automation platform
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* N8N Configuration */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">N8N Webhook URL</Label>
                        <Input
                            id="webhook-url"
                            type="url"
                            placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            The webhook URL from your N8N workflow that will
                            receive agent messages
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !webhookUrl}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={testConnection}
                            disabled={isTesting || !webhookUrl}
                            className="flex items-center gap-2"
                        >
                            <TestTube className="h-4 w-4" />
                            {isTesting ? 'Testing...' : 'Test Connection'}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Message Management */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">
                            Message Management
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Manage your conversation history and chat data
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleClearMessages}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear All Messages
                    </Button>
                </div>

                <Separator />

                {/* Integration Guide */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">
                            N8N Integration Guide
                        </h3>
                        <div className="text-xs text-muted-foreground space-y-2">
                            <p>1. Create a new workflow in your N8N instance</p>
                            <p>
                                2. Add a &quot;Webhook&quot; node as the trigger
                            </p>
                            <p>
                                3. Configure the webhook to accept POST requests
                            </p>
                            <p>4. Copy the webhook URL and paste it above</p>
                            <p>
                                5. Add your processing nodes (AI, database,
                                etc.)
                            </p>
                            <p>
                                6. Return a response with a &quot;reply&quot;
                                field for the agent
                            </p>
                        </div>
                    </div>
                </div>

                {onClose && (
                    <div className="flex justify-end pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
