'use client';

import { useState } from 'react';
import { ServerStatusBadge } from './ServerStatusBadge';
import { StreamingLogsViewer } from './StreamingLogsViewer';
import { ToolPermissions } from './ToolPermissions';
import { ServerAuthDialog } from './ServerAuthDialog';
import { useToggleServerPower, useDeleteServer } from '@/hooks/mutations/useMCPServerMutations';
import { useMCPServer } from '@/hooks/queries/useMCPServers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Power, Settings, Trash2, Loader2, Key } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EnhancedServerCardProps {
    serverId: string;
}

export function EnhancedServerCard({ serverId }: EnhancedServerCardProps) {
    const { toast } = useToast();
    const { data: server, isLoading, refetch } = useMCPServer(serverId);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const deleteMutation = useDeleteServer();

    const powerToggle = useToggleServerPower(serverId, server?.status || 'unknown');

    const handleDelete = () => {
        deleteMutation.mutate(serverId, {
            onSuccess: () => {
                toast({
                    title: 'Server deleted',
                    description: 'MCP server has been successfully deleted.',
                });
                setShowDeleteDialog(false);
            },
            onError: (error: Error) => {
                toast({
                    title: 'Delete failed',
                    description: error.message,
                    variant: 'destructive',
                });
            },
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!server) {
        return (
            <Card>
                <CardContent className="p-8">
                    <p className="text-muted-foreground">Server not found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{server.name}</CardTitle>
                            <CardDescription>{server.url}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <ServerStatusBadge serverId={serverId} />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowAuthDialog(true)}
                                title="Configure Authentication"
                            >
                                <Key className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => powerToggle.mutate()}
                                disabled={powerToggle.isPending}
                            >
                                {powerToggle.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Power className="h-4 w-4" />
                                )}
                            </Button>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="permissions">
                        <TabsList>
                            <TabsTrigger value="permissions">Permissions</TabsTrigger>
                            <TabsTrigger value="logs">Logs</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="permissions" className="mt-4">
                            <ToolPermissions serverId={serverId} />
                        </TabsContent>

                        <TabsContent value="logs" className="mt-4">
                            <StreamingLogsViewer serverId={serverId} />
                        </TabsContent>

                        <TabsContent value="settings" className="mt-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Server Details</h4>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Transport:</dt>
                                            <dd className="font-medium">{server.transport}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Auth:</dt>
                                            <dd className="font-medium">{server.auth}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Scope:</dt>
                                            <dd className="font-medium">{server.scope}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">Created:</dt>
                                            <dd className="font-medium">
                                                {new Date(server.created_at).toLocaleDateString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Server</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{server.name}"? This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ServerAuthDialog
                open={showAuthDialog}
                onOpenChange={setShowAuthDialog}
                server={server}
                onSaved={() => {
                    refetch();
                    toast({
                        title: 'Success',
                        description: 'Authentication configured',
                    });
                }}
            />
        </>
    );
}

