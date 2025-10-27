'use client';

import { Check, Globe, Link, Settings, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

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
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user.provider';

import { useAgentStore } from './hooks/useAgentStore';

interface AgentSettingsProps {
    onClose?: () => void;
}

export const AgentSettings: React.FC<AgentSettingsProps> = ({ onClose }) => {
    const {
        n8nWebhookUrl,
        setN8nConfig,
        clearMessages,
        clearAllOrganizationMessages,
        setUserContext,
        currentOrgId,
        currentPinnedOrganizationId,
    } = useAgentStore();
    const { user, profile } = useUser();
    const { toast } = useToast();

    const [customWebhookUrl, setCustomWebhookUrl] = useState('');
    const [isSavingCustom, setIsSavingCustom] = useState(false);
    const [isApplyingAtoms, setIsApplyingAtoms] = useState(false);

    const atomsWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    const handleApplyAtomsUrl = useCallback(async () => {
        console.log('handleApplyAtomsUrl called'); // Debug log

        // Re-read environment variable in case it was updated
        const envWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
        console.log('Environment webhook URL:', envWebhookUrl); // Debug log

        if (!envWebhookUrl) {
            console.log('No environment webhook URL found'); // Debug log
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    'Atoms webhook URL is not configured in environment variables (NEXT_PUBLIC_N8N_WEBHOOK_URL)',
            });
            return;
        }

        try {
            console.log('Setting Atoms URL...'); // Debug log
            setIsApplyingAtoms(true);

            // Set user context including username
            setUserContext({
                userId: user?.id,
                orgId: currentOrgId,
                pinnedOrganizationId: currentPinnedOrganizationId,
                username: profile?.full_name || user?.email?.split('@')[0],
            });

            setN8nConfig(envWebhookUrl);
            console.log('Atoms URL set successfully'); // Debug log

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Atoms webhook URL has been applied successfully',
            });
        } catch (error) {
            console.error('Error applying Atoms URL:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to apply Atoms webhook URL',
            });
        } finally {
            setIsApplyingAtoms(false);
        }
    }, [
        toast,
        setUserContext,
        user?.id,
        currentOrgId,
        currentPinnedOrganizationId,
        profile?.full_name,
        user?.email,
        setN8nConfig,
    ]);

    const handleSaveCustomUrl = async () => {
        if (!customWebhookUrl.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a valid webhook URL',
            });
            return;
        }

        try {
            setIsSavingCustom(true);

            // Set user context including username
            setUserContext({
                userId: user?.id,
                orgId: currentOrgId,
                pinnedOrganizationId: currentPinnedOrganizationId,
                username: profile?.full_name || user?.email?.split('@')[0],
            });

            setN8nConfig(customWebhookUrl);
            setCustomWebhookUrl(''); // Clear input after successful save

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Custom webhook URL has been applied successfully',
            });
        } catch (error) {
            console.error('Error saving custom URL:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save custom webhook URL',
            });
        } finally {
            setIsSavingCustom(false);
        }
    };

    // Initialize component with existing webhook URL or auto-set from env
    useEffect(() => {
        if (!n8nWebhookUrl && atomsWebhookUrl) {
            // Auto-set from environment variable if available and no URL is configured
            handleApplyAtomsUrl();
        }
    }, [n8nWebhookUrl, atomsWebhookUrl, handleApplyAtomsUrl]);

    const handleClearMessages = () => {
        if (
            confirm(
                'Are you sure you want to clear all chat messages for the current organization? This action cannot be undone.',
            )
        ) {
            clearMessages();
        }
    };

    const handleClearAllMessages = () => {
        if (
            confirm(
                'Are you sure you want to clear all chat messages for ALL organizations? This action cannot be undone.',
            )
        ) {
            clearAllOrganizationMessages();
        }
    };

    const maskUrl = (url: string) => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname;
            const maskedPath = path.length > 20 ? path.slice(0, 20) + '...' : path;
            return `${domain}${maskedPath}`;
        } catch {
            return url.length > 30 ? url.slice(0, 30) + '...' : url;
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>Agent Settings</CardTitle>
                </div>
                <CardDescription>
                    Configure your AI agent&apos;s N8N webhook URL
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Current Configuration Status */}
                {n8nWebhookUrl && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                                Webhook URL Configured
                            </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                            Current: {maskUrl(n8nWebhookUrl)}
                        </p>
                    </div>
                )}

                {/* Atoms URL Configuration */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Atoms Default URL</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Use the pre-configured Atoms webhook URL for quick setup
                        </p>
                    </div>

                    <Button
                        onClick={handleApplyAtomsUrl}
                        disabled={isApplyingAtoms}
                        className="flex items-center gap-2"
                        variant="default"
                    >
                        <Globe className="h-4 w-4" />
                        {isApplyingAtoms ? 'Applying...' : 'Use Atoms URL'}
                    </Button>

                    {!atomsWebhookUrl && (
                        <p className="text-xs text-amber-600">
                            Atoms webhook URL is not configured in environment variables
                            (NEXT_PUBLIC_N8N_WEBHOOK_URL)
                        </p>
                    )}

                    {atomsWebhookUrl && (
                        <p className="text-xs text-muted-foreground">
                            Click to apply the default Atoms webhook URL from environment
                            variables
                        </p>
                    )}
                </div>

                <Separator />

                {/* Custom URL Configuration */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Custom Webhook URL</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Configure a custom N8N webhook URL for your specific workflow
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-webhook-url">Custom N8N Webhook URL</Label>
                        <Input
                            id="custom-webhook-url"
                            type="url"
                            placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                            value={customWebhookUrl}
                            onChange={(e) => setCustomWebhookUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter your custom N8N webhook URL to override the default
                            settings
                        </p>
                    </div>

                    <Button
                        onClick={handleSaveCustomUrl}
                        disabled={isSavingCustom || !customWebhookUrl.trim()}
                        className="flex items-center gap-2"
                        variant="outline"
                    >
                        <Link className="h-4 w-4" />
                        {isSavingCustom ? 'Applying...' : 'Apply Custom URL'}
                    </Button>
                </div>

                <Separator />

                {/* Message Management */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Message Management</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Manage your conversation history and chat data
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            onClick={handleClearMessages}
                            className="flex items-center gap-2 text-destructive hover:text-destructive w-full"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear Current Organization Messages
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClearAllMessages}
                            className="flex items-center gap-2 text-destructive hover:text-destructive w-full"
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear All Organization Messages
                        </Button>
                    </div>
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
                            <p>2. Add a &quot;Webhook&quot; node as the trigger</p>
                            <p>3. Configure the webhook to accept POST requests</p>
                            <p>4. Copy the webhook URL and use it above</p>
                            <p>5. Add your processing nodes (AI, database, etc.)</p>
                            <p>
                                6. Return a response with a &quot;reply&quot; field for
                                the agent
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