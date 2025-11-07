'use client';

import { useState, useEffect } from 'react';
import { useStartOAuthFlow, useOAuthStatus, useOAuthProviders } from '@/hooks/mutations/useOAuthFlow';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

interface OAuthFlowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mcpNamespace: string;
    organizationId?: string;
    onComplete?: (authResult: any) => void;
}

export function OAuthFlowDialog({
    open,
    onOpenChange,
    mcpNamespace,
    organizationId,
    onComplete,
}: OAuthFlowDialogProps) {
    const { toast } = useToast();
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [authWindow, setAuthWindow] = useState<Window | null>(null);

    const { data: providers, isLoading: providersLoading } = useOAuthProviders();
    const startOAuthMutation = useStartOAuthFlow();
    const { data: statusData, isLoading: statusLoading } = useOAuthStatus(transactionId);

    // Handle OAuth completion
    useEffect(() => {
        if (statusData?.transaction?.status === 'completed') {
            toast({
                title: 'OAuth completed',
                description: 'Successfully authenticated with the provider.',
            });

            // Close auth window if still open
            if (authWindow && !authWindow.closed) {
                authWindow.close();
            }

            // Call completion callback
            if (onComplete) {
                onComplete(statusData.auth_result);
            }

            // Close dialog
            onOpenChange(false);

            // Reset state
            setTransactionId(null);
            setSelectedProvider('');
        } else if (statusData?.transaction?.status === 'failed') {
            toast({
                title: 'OAuth failed',
                description: 'Authentication failed. Please try again.',
                variant: 'destructive',
            });

            // Close auth window if still open
            if (authWindow && !authWindow.closed) {
                authWindow.close();
            }

            setTransactionId(null);
        }
    }, [statusData, authWindow, onComplete, onOpenChange, toast]);

    const handleStartOAuth = async () => {
        if (!selectedProvider) {
            toast({
                title: 'No provider selected',
                description: 'Please select an OAuth provider.',
                variant: 'destructive',
            });
            return;
        }

        startOAuthMutation.mutate(
            {
                providerKey: selectedProvider,
                mcpNamespace,
                organizationId,
            },
            {
                onSuccess: (transaction) => {
                    setTransactionId(transaction.transaction_id);

                    // Open OAuth URL in popup window
                    const width = 600;
                    const height = 700;
                    const left = window.screenX + (window.outerWidth - width) / 2;
                    const top = window.screenY + (window.outerHeight - height) / 2;

                    const popup = window.open(
                        transaction.authorization_url,
                        'oauth-popup',
                        `width=${width},height=${height},left=${left},top=${top}`
                    );

                    setAuthWindow(popup);

                    // Monitor popup closure
                    const checkClosed = setInterval(() => {
                        if (popup?.closed) {
                            clearInterval(checkClosed);
                            setAuthWindow(null);
                        }
                    }, 500);
                },
                onError: (error: Error) => {
                    toast({
                        title: 'Failed to start OAuth',
                        description: error.message,
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    const handleCancel = () => {
        if (authWindow && !authWindow.closed) {
            authWindow.close();
        }
        setTransactionId(null);
        setSelectedProvider('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>OAuth Authentication</DialogTitle>
                    <DialogDescription>
                        Authenticate with an OAuth provider to access the MCP server
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!transactionId ? (
                        <>
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Select Provider
                                </label>
                                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose OAuth provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providersLoading ? (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                Loading providers...
                                            </div>
                                        ) : providers && providers.length > 0 ? (
                                            providers.map((provider) => (
                                                <SelectItem key={provider.key} value={provider.key}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No providers available
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleStartOAuth}
                                    disabled={!selectedProvider || startOAuthMutation.isPending}
                                >
                                    {startOAuthMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Start OAuth
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center p-8">
                                {statusData?.transaction?.status === 'completed' ? (
                                    <div className="text-center">
                                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                        <p className="font-medium">Authentication Successful!</p>
                                    </div>
                                ) : statusData?.transaction?.status === 'failed' ? (
                                    <div className="text-center">
                                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                        <p className="font-medium">Authentication Failed</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                                        <p className="font-medium">Waiting for authentication...</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Complete the authentication in the popup window
                                        </p>
                                        <Badge variant="outline" className="mt-4">
                                            {statusData?.transaction?.status || 'pending'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

