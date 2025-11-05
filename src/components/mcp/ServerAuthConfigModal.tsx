'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Lock, ExternalLink, Info, AlertCircle } from 'lucide-react';
import { UnifiedMCPServer } from '@/services/mcp/multi-registry.service';
import ReactMarkdown from 'react-markdown';

interface ServerAuthConfigModalProps {
    open: boolean;
    server: UnifiedMCPServer | null;
    onClose: () => void;
    onConfigure: (config: { env: Record<string, string>; token?: string }) => void;
}

export function ServerAuthConfigModal({
    open,
    server,
    onClose,
    onConfigure,
}: ServerAuthConfigModalProps) {
    const [envVars, setEnvVars] = useState<Record<string, string>>({});
    const [token, setToken] = useState('');
    const [instructions, setInstructions] = useState<string>('');
    const [loadingInstructions, setLoadingInstructions] = useState(false);
    const [error, setError] = useState<string>('');

    const authType = server?.auth?.type || 'none';
    const requiresEnvVars = server?.transport?.env && Object.keys(server.transport.env).length > 0;

    // Fetch installation instructions
    useEffect(() => {
        if (!open || !server?.githubUrl) return;

        const fetchInstructions = async () => {
            setLoadingInstructions(true);
            setError('');

            try {
                // Try llms-install.md first
                const match = server.githubUrl?.match(/github\.com\/([\w-]+)\/([\w-]+)/);
                if (!match) {
                    setError('Invalid GitHub URL');
                    return;
                }

                const [, owner, repo] = match;
                
                // Try llms-install.md
                let response = await fetch(
                    `https://raw.githubusercontent.com/${owner}/${repo}/main/llms-install.md`
                );

                if (!response.ok) {
                    // Try README.md
                    response = await fetch(
                        `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`
                    );
                }

                if (response.ok) {
                    const text = await response.text();
                    setInstructions(text);
                } else {
                    setInstructions('No installation instructions found. Please refer to the repository for setup details.');
                }
            } catch (err) {
                console.error('Error fetching instructions:', err);
                setError('Failed to load installation instructions');
            } finally {
                setLoadingInstructions(false);
            }
        };

        fetchInstructions();
    }, [open, server]);

    // Initialize env vars from transport config
    useEffect(() => {
        if (!server?.transport?.env) return;

        const initialEnvVars: Record<string, string> = {};
        Object.keys(server.transport.env).forEach(key => {
            initialEnvVars[key] = '';
        });
        setEnvVars(initialEnvVars);
    }, [server]);

    const handleSubmit = async () => {
        // For OAuth, trigger the OAuth flow
        if (authType === 'oauth') {
            try {
                setLoadingInstructions(true);
                setError('');

                // Import OAuth service
                const { runOAuthFlow } = await import('@/services/mcp/oauth.service');

                const providerKey = server?.auth?.provider || server?.namespace || '';
                const oauthResult = await runOAuthFlow({
                    providerKey,
                    mcpNamespace: server?.namespace || '',
                    scopes: server?.auth?.scopes,
                    authMetadata: (server?.auth as any)?.raw ?? server?.auth,
                });

                if (oauthResult.status === 'authorized') {
                    // OAuth successful, proceed with installation
                    onConfigure({ env: { ...envVars } });
                } else {
                    setError(`OAuth authorization ${oauthResult.status}: ${oauthResult.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('OAuth error:', err);
                setError(err instanceof Error ? err.message : 'OAuth authorization failed');
            } finally {
                setLoadingInstructions(false);
            }
            return;
        }

        // Validate required fields for non-OAuth
        if (authType === 'bearer' || authType === 'api-key') {
            if (!token.trim()) {
                setError('Please enter your API key or token');
                return;
            }
        }

        if (requiresEnvVars) {
            const missingVars = Object.keys(envVars).filter(key => !envVars[key].trim());
            if (missingVars.length > 0) {
                setError(`Please fill in all required environment variables: ${missingVars.join(', ')}`);
                return;
            }
        }

        // Build config
        const config: { env: Record<string, string>; token?: string } = {
            env: { ...envVars },
        };

        if (token) {
            config.token = token;
            // Add token to env vars based on auth type
            if (authType === 'bearer') {
                config.env.BEARER_TOKEN = token;
            } else if (authType === 'api-key') {
                config.env.API_KEY = token;
            }
        }

        onConfigure(config);
    };

    if (!server) return null;

    const showTokenInput = authType === 'bearer' || authType === 'api-key';
    const showEnvVars = requiresEnvVars;
    const showOAuthWarning = authType === 'oauth';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Configure {server.name}
                    </DialogTitle>
                    <DialogDescription>
                        This server requires authentication. Please provide the necessary credentials.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* OAuth Warning */}
                    {showOAuthWarning && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                This server uses OAuth authentication. You'll be redirected to authorize access after clicking Continue.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Token Input */}
                    {showTokenInput && (
                        <div className="space-y-2">
                            <Label htmlFor="token" className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                {authType === 'bearer' ? 'Bearer Token' : 'API Key'}
                            </Label>
                            <Input
                                id="token"
                                type="password"
                                placeholder={`Enter your ${authType === 'bearer' ? 'bearer token' : 'API key'}`}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Environment Variables */}
                    {showEnvVars && (
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Environment Variables</Label>
                            {Object.keys(envVars).map((key) => (
                                <div key={key} className="space-y-1">
                                    <Label htmlFor={key} className="text-xs text-muted-foreground">
                                        {key}
                                    </Label>
                                    <Input
                                        id={key}
                                        type="password"
                                        placeholder={`Enter ${key}`}
                                        value={envVars[key]}
                                        onChange={(e) => setEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Installation Instructions */}
                    {instructions && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Installation Instructions</Label>
                                {server.githubUrl && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <a href={server.githubUrl} target="_blank" rel="noopener noreferrer">
                                            View on GitHub
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                            <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg max-h-64 overflow-y-auto overflow-x-hidden">
                                {loadingInstructions ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="break-words">
                                        <ReactMarkdown
                                            components={{
                                                pre: ({ children, ...props }) => (
                                                    <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props}>
                                                        {children}
                                                    </pre>
                                                ),
                                                code: ({ children, ...props }) => (
                                                    <code className="break-words whitespace-pre-wrap" {...props}>
                                                        {children}
                                                    </code>
                                                ),
                                                p: ({ children, ...props }) => (
                                                    <p className="break-words" {...props}>
                                                        {children}
                                                    </p>
                                                ),
                                                li: ({ children, ...props }) => (
                                                    <li className="break-words" {...props}>
                                                        {children}
                                                    </li>
                                                ),
                                            }}
                                        >
                                            {instructions}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loadingInstructions}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loadingInstructions}>
                        {loadingInstructions ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {showOAuthWarning ? 'Authorizing...' : 'Configuring...'}
                            </>
                        ) : (
                            showOAuthWarning ? 'Continue to OAuth' : 'Configure & Install'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
