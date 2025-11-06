'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface MCPServer {
    id: string;
    name: string;
    namespace: string;
    transport_type: string;
    auth_status: string;
    scope: string;
    enabled: boolean;
    config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

interface MCPServerConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    server: MCPServer;
    onUpdate: (server: MCPServer) => void;
}

export function MCPServerConfigDialog({
    isOpen,
    onClose,
    server,
    onUpdate,
}: MCPServerConfigDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: server.name,
        namespace: server.namespace,
        transport_type: server.transport_type,
        config: JSON.stringify(server.config, null, 2),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Parse config JSON
            let parsedConfig: Record<string, unknown>;
            try {
                parsedConfig = JSON.parse(formData.config);
            } catch {
                throw new Error('Invalid JSON in configuration field');
            }

            const response = await fetch(`/api/mcp/servers/${server.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    namespace: formData.namespace,
                    transport_type: formData.transport_type,
                    config: parsedConfig,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to update server');
            }

            const { server: updatedServer } = await response.json();

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Server configuration updated successfully',
            });

            onUpdate(updatedServer);
        } catch (err) {
            console.error('Error updating server:', err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err instanceof Error ? err.message : 'Failed to update server',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            // Reset form data
            setFormData({
                name: server.name,
                namespace: server.namespace,
                transport_type: server.transport_type,
                config: JSON.stringify(server.config, null, 2),
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configure MCP Server</DialogTitle>
                    <DialogDescription>
                        Update the configuration for {server.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Server Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="My MCP Server"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="namespace">Namespace</Label>
                        <Input
                            id="namespace"
                            value={formData.namespace}
                            onChange={(e) =>
                                setFormData({ ...formData, namespace: e.target.value })
                            }
                            placeholder="org/server-name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transport_type">Transport Type</Label>
                        <Select
                            value={formData.transport_type}
                            onValueChange={(value) =>
                                setFormData({ ...formData, transport_type: value })
                            }
                        >
                            <SelectTrigger id="transport_type">
                                <SelectValue placeholder="Select transport type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stdio">STDIO</SelectItem>
                                <SelectItem value="sse">SSE</SelectItem>
                                <SelectItem value="http">HTTP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="config">
                            Configuration (JSON)
                        </Label>
                        <Textarea
                            id="config"
                            value={formData.config}
                            onChange={(e) =>
                                setFormData({ ...formData, config: e.target.value })
                            }
                            placeholder='{"key": "value"}'
                            className="font-mono text-sm min-h-[200px]"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter valid JSON configuration for the server
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
