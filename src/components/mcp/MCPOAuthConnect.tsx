'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Chrome, Shield, Key } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface MCPOAuthConnectProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type OAuthProvider = 'github' | 'google' | 'azure' | 'auth0';

interface ProviderConfig {
    id: OAuthProvider;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
}

const OAUTH_PROVIDERS: ProviderConfig[] = [
    {
        id: 'github',
        name: 'GitHub',
        icon: Github,
        description: 'Connect with GitHub OAuth',
        color: 'hover:bg-gray-800/10 dark:hover:bg-gray-800/20',
    },
    {
        id: 'google',
        name: 'Google',
        icon: Chrome,
        description: 'Connect with Google OAuth',
        color: 'hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
    },
    {
        id: 'azure',
        name: 'Azure AD',
        icon: Shield,
        description: 'Connect with Microsoft Azure',
        color: 'hover:bg-blue-600/10 dark:hover:bg-blue-600/20',
    },
    {
        id: 'auth0',
        name: 'Auth0',
        icon: Key,
        description: 'Connect with Auth0',
        color: 'hover:bg-orange-500/10 dark:hover:bg-orange-500/20',
    },
];

export function MCPOAuthConnect({
    isOpen,
    onClose,
    onSuccess,
}: MCPOAuthConnectProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleProviderSelect = async (provider: OAuthProvider) => {
        setIsLoading(true);
        setSelectedProvider(provider);
        setError(null);

        try {
            // Make POST request to initialize OAuth flow
            const response = await fetch('/api/mcp/oauth/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: 'Failed to initialize OAuth flow',
                }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Check if we received an authorization URL
            if (!data.authUrl) {
                throw new Error('No authorization URL received from server');
            }

            // Show success toast
            toast({
                variant: 'default',
                title: 'Redirecting to OAuth provider',
                description: `Opening ${provider} authorization page...`,
            });

            // Navigate to OAuth provider's authorization page
            router.push(data.authUrl);

            // Call success callback after a short delay to allow navigation
            setTimeout(() => {
                onSuccess();
            }, 500);
        } catch (err) {
            console.error('OAuth initialization error:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to initialize OAuth flow';

            setError(errorMessage);

            toast({
                variant: 'destructive',
                title: 'OAuth Connection Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
            setSelectedProvider(null);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setError(null);
            setSelectedProvider(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect OAuth Provider</DialogTitle>
                    <DialogDescription>
                        Select an OAuth provider to connect to your MCP server
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-3">
                        {OAUTH_PROVIDERS.map((provider) => {
                            const Icon = provider.icon;
                            const isProviderLoading =
                                isLoading && selectedProvider === provider.id;

                            return (
                                <Button
                                    key={provider.id}
                                    variant="outline"
                                    onClick={() => handleProviderSelect(provider.id)}
                                    disabled={isLoading}
                                    className={cn(
                                        'relative h-auto flex-col items-start gap-2 p-4 text-left transition-colors',
                                        provider.color,
                                        isLoading &&
                                            selectedProvider !== provider.id &&
                                            'opacity-50',
                                    )}
                                >
                                    <div className="flex w-full items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            {isProviderLoading ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <Icon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">
                                                {provider.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {provider.description}
                                            </div>
                                        </div>
                                        {isProviderLoading && (
                                            <div className="text-xs text-muted-foreground">
                                                Connecting...
                                            </div>
                                        )}
                                    </div>
                                </Button>
                            );
                        })}
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                            You will be redirected to the selected provider&apos;s authorization
                            page. After authorization, you will be redirected back to
                            complete the setup.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
