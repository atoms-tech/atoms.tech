'use client';

import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user.provider';

import { useMCPStore } from './hooks/useMCPStore';

export const MCPServerDialog: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<'http' | 'stdio'>('http');
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [command, setCommand] = useState('');
    const [args, setArgs] = useState('');
    const [envVars, setEnvVars] = useState('');

    const { addServer } = useMCPStore();
    const { profile } = useUser();
    const { toast } = useToast();

    const handleAdd = () => {
        const orgId = profile?.pinned_organization_id || profile?.current_organization_id;
        if (!orgId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select an organization first',
            });
            return;
        }

        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Server name is required',
            });
            return;
        }

        if (type === 'http' && !url.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'URL is required for HTTP servers',
            });
            return;
        }

        if (type === 'stdio' && !command.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Command is required for stdio servers',
            });
            return;
        }

        try {
            const env: Record<string, string> = {};
            if (envVars.trim()) {
                envVars.split('\n').forEach((line) => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        env[key.trim()] = valueParts.join('=').trim();
                    }
                });
            }

            addServer(
                {
                    name: name.trim(),
                    type,
                    url: type === 'http' ? url.trim() : undefined,
                    command: type === 'stdio' ? command.trim() : undefined,
                    args:
                        type === 'stdio' && args.trim()
                            ? args.trim().split(' ')
                            : undefined,
                    env: Object.keys(env).length > 0 ? env : undefined,
                    autoConnect: false,
                },
                orgId,
            );

            toast({
                title: 'Success',
                description: 'MCP server added successfully',
            });

            // Reset form
            setName('');
            setUrl('');
            setCommand('');
            setArgs('');
            setEnvVars('');
            setOpen(false);
        } catch (error) {
            console.error('Error adding MCP server:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add MCP server',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add MCP Server
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add MCP Server</DialogTitle>
                    <DialogDescription>
                        Connect an external MCP server to extend agent capabilities
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Server Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My MCP Server"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Server Type</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="http"
                                    checked={type === 'http'}
                                    onChange={() => setType('http')}
                                />
                                HTTP/SSE
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="stdio"
                                    checked={type === 'stdio'}
                                    onChange={() => setType('stdio')}
                                />
                                Stdio (Command)
                            </label>
                        </div>
                    </div>

                    {type === 'http' ? (
                        <div className="space-y-2">
                            <Label htmlFor="url">Server URL *</Label>
                            <Input
                                id="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://mcp.example.com/sse"
                            />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="command">Command *</Label>
                                <Input
                                    id="command"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    placeholder="npx"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="args">Arguments (space-separated)</Label>
                                <Input
                                    id="args"
                                    value={args}
                                    onChange={(e) => setArgs(e.target.value)}
                                    placeholder="-y @modelcontextprotocol/server-everything"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="env">Environment Variables (one per line)</Label>
                        <textarea
                            id="env"
                            value={envVars}
                            onChange={(e) => setEnvVars(e.target.value)}
                            placeholder="API_KEY=your_key&#10;TIMEOUT=30000"
                            className="w-full min-h-[100px] p-2 border rounded-md text-sm"
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-2">
                            Example Configurations
                        </p>
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                            <div>
                                <strong>HTTP:</strong> URL: https://mcp.atoms.tech/api/mcp
                            </div>
                            <div>
                                <strong>Stdio:</strong> Command: npx, Args: -y
                                @modelcontextprotocol/server-everything
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}>Add Server</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
