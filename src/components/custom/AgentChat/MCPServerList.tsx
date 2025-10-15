'use client';

import { Globe, Terminal, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user.provider';

import { useMCPStore } from './hooks/useMCPStore';

export const MCPServerList: React.FC = () => {
    const { getServersForOrg, removeServer } = useMCPStore();
    const { profile } = useUser();
    const { toast } = useToast();

    const orgId = profile?.pinned_organization_id || profile?.current_organization_id;
    const servers = orgId ? getServersForOrg(orgId) : [];

    const handleRemove = (serverId: string, serverName: string) => {
        if (confirm(`Are you sure you want to remove "${serverName}"?`)) {
            try {
                removeServer(serverId);
                toast({
                    title: 'Success',
                    description: 'MCP server removed successfully',
                });
            } catch (error) {
                console.error('Error removing MCP server:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to remove MCP server',
                });
            }
        }
    };

    if (servers.length === 0) {
        return (
            <Card className="p-4 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                    No MCP servers configured yet. Click &quot;Add MCP Server&quot; to get
                    started.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {servers.map((server) => (
                <Card key={server.id} className="p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800">
                                {server.type === 'http' ? (
                                    <Globe className="h-4 w-4" />
                                ) : (
                                    <Terminal className="h-4 w-4" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium">{server.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {server.type === 'http' ? (
                                        <span className="truncate block max-w-[300px]">
                                            {server.url}
                                        </span>
                                    ) : (
                                        <span>
                                            {server.command} {server.args?.join(' ')}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(server.id, server.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};
