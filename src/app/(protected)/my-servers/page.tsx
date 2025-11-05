'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MCPServerConfigDialog } from '@/components/custom/MCP/MCPServerConfigDialog';
import { logger } from '@/lib/utils/logger';

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

interface TestResult {
    success: boolean;
    message?: string;
    details?: Record<string, unknown>;
}

export default function MyServersPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testingServer, setTestingServer] = useState<string | null>(null);
    const [deletingServer, setDeletingServer] = useState<string | null>(null);
    const [configServer, setConfigServer] = useState<MCPServer | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Fetch servers on mount
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
            logger.error('Error fetching servers', err, { route: '/my-servers' });
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

            // Update local state
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
            logger.error('Error toggling server', err, {
                route: '/my-servers',
                serverId,
            });
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to update server',
            });
        }
    };

    const testConnection = async (serverId: string) => {
        try {
            setTestingServer(serverId);

            const response = await fetch(`/api/mcp/servers/${serverId}/test`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Connection test failed');
            }

            const result: TestResult = await response.json();

            // Update local state with test results
            setServers((prev) =>
                prev.map((s) =>
                    s.id === serverId
                        ? {
                              ...s,
                              last_test_at: new Date().toISOString(),
                              last_test_status: result.success ? 'success' : 'error',
                              last_test_error: result.message,
                          }
                        : s
                )
            );

            toast({
                variant: result.success ? 'default' : 'destructive',
                title: result.success ? 'Connection Test Passed' : 'Connection Test Failed',
                description: result.message || (result.success ? 'Server is responding correctly' : 'Server connection failed'),
            });
        } catch (err) {
            logger.error('Error testing connection', err, {
                route: '/my-servers',
                serverId,
            });
            toast({
                variant: 'destructive',
                title: 'Test Failed',
                description: err instanceof Error ? err.message : 'Connection test failed',
            });
        } finally {
            setTestingServer(null);
        }
    };

    const handleDeleteServer = async () => {
        if (!deletingServer) return;

        try {
            const response = await fetch(`/api/mcp/servers/${deletingServer}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete server');
            }

            // Remove from local state
            setServers((prev) => prev.filter((s) => s.id !== deletingServer));

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Server uninstalled successfully',
            });
        } catch (err) {
            logger.error('Error deleting server', err, {
                route: '/my-servers',
                serverId: deletingServer,
            });
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
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Authenticated
                    </Badge>
                );
            case 'needs_auth':
                return (
                    <Badge variant="secondary">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Needs Auth
                    </Badge>
                );
            case 'error':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getScopeBadge = (scope: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
            user: { variant: 'default', label: 'User' },
            org: { variant: 'secondary', label: 'Organization' },
            system: { variant: 'outline', label: 'System' },
        };

        const config = variants[scope] || { variant: 'outline' as const, label: scope };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My MCP Servers</CardTitle>
                        <CardDescription>Loading your installed servers...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My MCP Servers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <Button onClick={fetchServers} className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            My MCP Servers
                        </CardTitle>
                        <CardDescription>
                            Manage your installed Model Context Protocol servers
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={fetchServers} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button onClick={() => router.push('/marketplace')} size="sm">
                            Browse Marketplace
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {servers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Server className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No servers installed</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Get started by browsing the marketplace
                            </p>
                            <Button onClick={() => router.push('/marketplace')}>
                                Browse Marketplace
                            </Button>
                        </div>
                    ) : (
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
                                            <TableCell className="font-medium">
                                                {server.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {server.namespace}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {server.transport_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getAuthStatusBadge(server.auth_status)}
                                            </TableCell>
                                            <TableCell>{getScopeBadge(server.scope)}</TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={server.enabled}
                                                    onCheckedChange={() =>
                                                        toggleServerEnabled(
                                                            server.id,
                                                            server.enabled
                                                        )
                                                    }
                                                    aria-label={`Toggle ${server.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => testConnection(server.id)}
                                                        disabled={testingServer === server.id}
                                                    >
                                                        {testingServer === server.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-4 w-4" />
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
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Uninstall Server</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to uninstall this server? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeletingServer(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteServer}>
                            Uninstall
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Configuration Dialog */}
            {configServer && (
                <MCPServerConfigDialog
                    isOpen={!!configServer}
                    onClose={() => setConfigServer(null)}
                    server={configServer}
                    onUpdate={(updatedServer: MCPServer) => {
                        setServers((prev: MCPServer[]) =>
                            prev.map((s: MCPServer) =>
                                s.id === updatedServer.id ? updatedServer : s
                            )
                        );
                        setConfigServer(null);
                        toast({
                            variant: 'default',
                            title: 'Success',
                            description: 'Server configuration updated',
                        });
                    }}
                />
            )}
        </div>
    );
}
