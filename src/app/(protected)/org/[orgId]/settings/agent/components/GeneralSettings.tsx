'use client';

import { Check, Globe, Link, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
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

interface GeneralSettingsProps {
    orgId: string;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ orgId }) => {
    const {
        n8nWebhookUrl,
        setN8nConfig,
        clearMessages,
        clearAllOrganizationMessages,
        setUserContext,
        currentPinnedOrganizationId,
    } = useAgentStore();
    const { user, profile } = useUser();
    const { toast } = useToast();

    const [customWebhookUrl, setCustomWebhookUrl] = useState('');
    const [isSavingCustom, setIsSavingCustom] = useState(false);
    const [isApplyingAtoms, setIsApplyingAtoms] = useState(false);

    const atomsWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    // Mask URL for display
    const maskUrl = (url: string) => {
        if (!url) return '';
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const maskedPath =
                path.length > 20
                    ? path.substring(0, 10) +
                      '...' +
                      path.substring(path.length - 10)
                    : path;
            return `${urlObj.protocol}//${urlObj.host}${maskedPath}`;
        } catch {
            return url.length > 50
                ? url.substring(0, 25) + '...' + url.substring(url.length - 25)
                : url;
        }
    };

    const handleApplyAtomsUrl = useCallback(async () => {
        const envWebhookUrl = atomsWebhookUrl;
        if (!envWebhookUrl) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    'Atoms webhook URL is not configured in environment variables',
            });
            return;
        }

        try {
            setIsApplyingAtoms(true);

            // Set user context including username
            setUserContext({
                userId: user?.id,
                orgId: orgId,
                pinnedOrganizationId: currentPinnedOrganizationId,
                username: profile?.full_name || user?.email?.split('@')[0],
            });

            setN8nConfig(envWebhookUrl);

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
        atomsWebhookUrl,
        setN8nConfig,
        setUserContext,
        user?.id,
        user?.email,
        profile?.full_name,
        orgId,
        currentPinnedOrganizationId,
        toast,
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
                orgId: orgId,
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

    return (
        <div className="space-y-6">
            {/* Webhook Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Webhook Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the N8N webhook URL for your AI agent
                        integration
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Current Configuration Status */}
                    {n8nWebhookUrl && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Webhook URL Configured
                                </span>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                Current: {maskUrl(n8nWebhookUrl)}
                            </p>
                        </div>
                    )}

                    {/* Atoms Default URL */}
                    {atomsWebhookUrl && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">
                                    Default Atoms Configuration
                                </h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Use the default Atoms webhook URL for
                                    standard functionality
                                </p>
                            </div>

                            <Button
                                onClick={handleApplyAtomsUrl}
                                disabled={isApplyingAtoms}
                                className="w-full"
                                variant={
                                    n8nWebhookUrl === atomsWebhookUrl
                                        ? 'secondary'
                                        : 'default'
                                }
                            >
                                <Globe className="mr-2 h-4 w-4" />
                                {isApplyingAtoms
                                    ? 'Applying...'
                                    : n8nWebhookUrl === atomsWebhookUrl
                                      ? 'Using Atoms URL'
                                      : 'Apply Atoms URL'}
                            </Button>
                        </div>
                    )}

                    <Separator />

                    {/* Custom URL Configuration */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium mb-2">
                                Custom Webhook URL
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                Configure a custom N8N webhook URL for your
                                specific workflow
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom-webhook-url">
                                Custom N8N Webhook URL
                            </Label>
                            <Input
                                id="custom-webhook-url"
                                type="url"
                                placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                                value={customWebhookUrl}
                                onChange={(e) =>
                                    setCustomWebhookUrl(e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your custom N8N webhook URL to override
                                the default settings
                            </p>
                        </div>

                        <Button
                            onClick={handleSaveCustomUrl}
                            disabled={
                                isSavingCustom || !customWebhookUrl.trim()
                            }
                            className="w-full"
                        >
                            {isSavingCustom ? 'Saving...' : 'Save Custom URL'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Message Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Message Management
                    </CardTitle>
                    <CardDescription>
                        Clear chat history and reset conversation data
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Button
                            onClick={handleClearMessages}
                            variant="outline"
                            className="w-full"
                        >
                            Clear Current Organization Messages
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            This will clear all chat messages for the current
                            organization only
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            onClick={handleClearAllMessages}
                            variant="destructive"
                            className="w-full"
                        >
                            Clear All Organization Messages
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            This will clear all chat messages across ALL
                            organizations
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
