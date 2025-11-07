'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Shield } from 'lucide-react';

interface ServerAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: {
        id: string;
        name: string;
        namespace: string;
        auth_type?: string | null;
        auth_config?: any;
    };
    onSaved?: () => void;
}

export function ServerAuthDialog({ open, onOpenChange, server, onSaved }: ServerAuthDialogProps) {
    const { toast } = useToast();
    const [authType, setAuthType] = useState<'bearer' | 'oauth'>(
        (server.auth_type as 'bearer' | 'oauth') || 'bearer'
    );
    const [apiKey, setApiKey] = useState(server.auth_config?.apiKey || '');
    const [bearerToken, setBearerToken] = useState(server.auth_config?.bearerToken || '');
    const [customHeaderName, setCustomHeaderName] = useState('');
    const [customHeaderValue, setCustomHeaderValue] = useState('');
    const [customHeaders, setCustomHeaders] = useState<Record<string, string>>(
        server.auth_config?.customHeaders || {}
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);

        try {
            const authConfig: any = {};

            if (authType === 'bearer') {
                if (apiKey) {
                    authConfig.apiKey = apiKey;
                }
                if (bearerToken) {
                    authConfig.bearerToken = bearerToken;
                }
            }

            if (Object.keys(customHeaders).length > 0) {
                authConfig.customHeaders = customHeaders;
            }

            const response = await fetch(`/api/mcp/servers/${server.id}/auth`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authType,
                    authConfig,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update auth config');
            }

            toast({
                title: 'Success',
                description: 'Authentication configured successfully',
            });

            onOpenChange(false);
            if (onSaved) {
                onSaved();
            }
        } catch (error) {
            console.error('Error saving auth config:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save authentication configuration',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAddCustomHeader = () => {
        if (customHeaderName && customHeaderValue) {
            setCustomHeaders((prev) => ({
                ...prev,
                [customHeaderName]: customHeaderValue,
            }));
            setCustomHeaderName('');
            setCustomHeaderValue('');
        }
    };

    const handleRemoveCustomHeader = (name: string) => {
        setCustomHeaders((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure Authentication</DialogTitle>
                    <DialogDescription>
                        Configure authentication for {server.name}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={authType} onValueChange={(v) => setAuthType(v as 'bearer' | 'oauth')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="bearer">
                            <Key className="h-4 w-4 mr-2" />
                            API Key / Bearer
                        </TabsTrigger>
                        <TabsTrigger value="oauth">
                            <Shield className="h-4 w-4 mr-2" />
                            OAuth
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="bearer" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter API key (sent as X-API-Key header)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Will be sent as: X-API-Key: [your-key]
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bearerToken">Bearer Token</Label>
                            <Input
                                id="bearerToken"
                                type="password"
                                value={bearerToken}
                                onChange={(e) => setBearerToken(e.target.value)}
                                placeholder="Enter bearer token"
                            />
                            <p className="text-xs text-muted-foreground">
                                Will be sent as: Authorization: Bearer [your-token]
                            </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <Label className="text-sm font-medium">Custom Headers</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Header name"
                                    value={customHeaderName}
                                    onChange={(e) => setCustomHeaderName(e.target.value)}
                                />
                                <Input
                                    placeholder="Header value"
                                    value={customHeaderValue}
                                    onChange={(e) => setCustomHeaderValue(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddCustomHeader}
                                    disabled={!customHeaderName || !customHeaderValue}
                                >
                                    Add
                                </Button>
                            </div>

                            {Object.keys(customHeaders).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(customHeaders).map(([name, value]) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between p-2 bg-muted rounded"
                                        >
                                            <div className="text-sm">
                                                <span className="font-mono font-medium">{name}:</span>{' '}
                                                <span className="text-muted-foreground">{value}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveCustomHeader(name)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="oauth" className="space-y-4 mt-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                OAuth authentication is configured through the OAuth flow.
                                Click the OAuth button in the server settings to initiate authentication.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
