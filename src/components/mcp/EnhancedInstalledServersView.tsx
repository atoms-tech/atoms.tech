'use client';

import { useState } from 'react';
import { Plus, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserInstallFormDialog } from './UserInstallForm';
import { AdminInstallFormDialog } from './AdminInstallForm';
import { EnhancedServerCard } from './EnhancedServerCard';
import { useMCPServers } from '@/hooks/queries/useMCPServers';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedInstalledServersViewProps {
    compact?: boolean;
    isAdmin?: boolean;
}

export function EnhancedInstalledServersView({
    compact = false,
    isAdmin = false,
}: EnhancedInstalledServersViewProps) {
    const [showInstallDialog, setShowInstallDialog] = useState(false);
    const [showAdminInstallDialog, setShowAdminInstallDialog] = useState(false);
    const { data: servers, isLoading, error } = useMCPServers();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {error instanceof Error ? error.message : 'Failed to load servers'}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Installed MCP Servers</h2>
                    <p className="text-muted-foreground">
                        Manage your Model Context Protocol servers
                    </p>
                </div>
                {isAdmin ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Server
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowInstallDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                User Install
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowAdminInstallDialog(true)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Admin Install
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button onClick={() => setShowInstallDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Server
                    </Button>
                )}
            </div>

            {/* Server List */}
            {!servers || servers.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">No MCP servers installed yet</p>
                    <Button onClick={() => setShowInstallDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Install Your First Server
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {servers.map((server) => (
                        <EnhancedServerCard key={server.id} serverId={server.id} />
                    ))}
                </div>
            )}

            {/* Install Dialogs */}
            <UserInstallFormDialog open={showInstallDialog} onOpenChange={setShowInstallDialog} />
            {isAdmin && (
                <AdminInstallFormDialog
                    open={showAdminInstallDialog}
                    onOpenChange={setShowAdminInstallDialog}
                />
            )}
        </div>
    );
}

