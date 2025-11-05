'use client';

import { useState, useEffect } from 'react';
import {
    Server,
    Power,
    PowerOff,
    Settings,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MCPServerConfigDialog } from './MCPServerConfigDialog';

interface MCPServer {
    id: string;
    name: string;
    namespace: string;
    transport_type: string;
    auth_status: 'authenticated' | 'needs_auth' | 'error';
    scope: 'user' | 'org' | 'system';
    enabled: boolean;
    config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    last_test_at?: string;
    last_test_status?: 'success' | 'error';
    last_test_error?: string;
}

interface InstalledServersViewProps {
    compact?: boolean; // For use in settings panel
}

export function InstalledServersView({ compact = false }: InstalledServersViewProps) {
    const { toast } = useToast();
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testingServer, setTestingServer] = useState<string | null>(null);
    const [deletingServer, setDeletingServer] = useState<string | null>(null);
    const [configServer, setConfigServer] = useState<MCPServer | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        fetchServers();
    }, []);

    const fetchServers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/mcp/installed');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch servers');
            }

            const data = await response.json();
            setServers(data.servers || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load servers';
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleServerEnabled = async (serverId: string, currentEnabled: boolean) => {
        try {
            const response = await fetch(`/api/mcp/servers/${serverId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: !currentEnabled,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update server');
            }

            setServers((prev) =>
                prev.map((s) =>
                    s.id === serverId ? { ...s, enabled: !currentEnabled } : s
                )
            );

            toast({
                variant: 'default',
                title: 'Success',
                description: `Server ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to update server',
            });
        }
    };

    const testServer = async (serverId: string) => {
        setTestingServer(serverId);
        try {
            const response = await fetch(`/api/mcp/servers/${serverId}/test`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Test failed');
            }

            const result = await response.json();
            toast({
                variant: result.success ? 'default' : 'destructive',
                title: result.success ? 'Test Successful' : 'Test Failed',
                description: result.message || 'Server test completed',
            });

            fetchServers();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Test Failed',
                description: err instanceof Error ? err.message : 'Failed to test server',
            });
        } finally {
            setTestingServer(null);
        }
    };

    const deleteServer = async () => {
        if (!deletingServer) return;

        try {
            const response = await fetch(`/api/mcp/servers/${deletingServer}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete server');
            }

            setServers((prev) => prev.filter((s) => s.id !== deletingServer));
            toast({
                variant: 'default',
                title: 'Success',
                description: 'Server deleted successfully',
            });
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to delete server',
            });
        } finally {
            setDeletingServer(null);
            setShowDeleteDialog(false);
        }
    };

    const getAuthStatusBadge = (status: string) => {
        switch (status) {
            case 'authenticated':
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Authenticated
                    </Badge>
                );
            case 'needs_auth':
                return (
                    <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Auth
                    </Badge>
                );
            case 'error':
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (servers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Server className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No servers installed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Get started by browsing the marketplace
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {!compact && (
                    <div className="flex justify-end">
                        <Button onClick={fetchServers} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                )}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Namespace</TableHead>
                                <TableHead>Transport</TableHead>
                                <TableHead>Auth Status</TableHead>
                                <TableHead>Scope</TableHead>
                                <TableHead className="text-center">Enabled</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {servers.map((server) => (
                                <TableRow key={server.id}>
                                    <TableCell className="font-medium">{server.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {server.namespace}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{server.transport_type}</Badge>
                                    </TableCell>
                                    <TableCell>{getAuthStatusBadge(server.auth_status)}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{server.scope}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={server.enabled}
                                            onCheckedChange={() =>
                                                toggleServerEnabled(server.id, server.enabled)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => testServer(server.id)}
                                                disabled={testingServer === server.id}
                                            >
                                                {testingServer === server.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Power className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfigServer(server)}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setDeletingServer(server.id);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Server</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this server? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteServer}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Config Dialog */}
            {configServer && (
                <MCPServerConfigDialog
                    isOpen={!!configServer}
                    onClose={() => setConfigServer(null)}
                    onSuccess={() => {
                        setConfigServer(null);
                        fetchServers();
                    }}
                    editingServer={{
                        id: configServer.id,
                        name: configServer.name,
                        description: '',
                        transport: configServer.transport_type as 'stdio' | 'http' | 'sse',
                        scope: (configServer.scope === 'org' ? 'organization' : configServer.scope) as 'user' | 'organization' | 'system',
                        authType: 'none' as 'oauth' | 'bearer' | 'none',
                    }}
                />
            )}
        </>
    );
}

