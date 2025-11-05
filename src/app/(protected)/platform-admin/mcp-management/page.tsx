'use client';

import { Plus, Edit, Trash2, RefreshCw, Shield, Settings, Database, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LayoutView from '@/components/views/LayoutView';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

interface MCPConfig {
    id: string;
    name: string;
    description: string;
    server_url: string;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
    last_health_check: string | null;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
}

export default function MCPManagementPage() {
    const { isPlatformAdmin, isLoading: adminLoading, error: adminError } = usePlatformAdmin();
    const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<MCPConfig | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        server_url: '',
    });

    const fetchMcpConfigs = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Mock data for now - in real implementation, this would fetch from API
            const mockConfigs: MCPConfig[] = [
                {
                    id: '1',
                    name: 'GitHub MCP',
                    description: 'Model Context Protocol server for GitHub integration',
                    server_url: 'https://mcp-github.example.com',
                    is_enabled: true,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    last_health_check: '2024-01-15T10:30:00Z',
                    health_status: 'healthy',
                },
                {
                    id: '2',
                    name: 'Database MCP',
                    description: 'MCP server for database operations and queries',
                    server_url: 'https://mcp-db.example.com',
                    is_enabled: true,
                    created_at: '2024-01-02T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                    last_health_check: '2024-01-15T10:25:00Z',
                    health_status: 'healthy',
                },
                {
                    id: '3',
                    name: 'File System MCP',
                    description: 'MCP server for file system operations',
                    server_url: 'https://mcp-fs.example.com',
                    is_enabled: false,
                    created_at: '2024-01-03T00:00:00Z',
                    updated_at: '2024-01-03T00:00:00Z',
                    last_health_check: '2024-01-10T15:20:00Z',
                    health_status: 'unhealthy',
                },
            ];

            setMcpConfigs(mockConfigs);
        } catch (err) {
            console.error('Error fetching MCP configs:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddConfig = async () => {
        if (!formData.name || !formData.server_url) {
            setError('Name and server URL are required');
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            const newConfig: MCPConfig = {
                id: Date.now().toString(),
                name: formData.name,
                description: formData.description,
                server_url: formData.server_url,
                is_enabled: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_health_check: null,
                health_status: 'unknown',
            };

            setMcpConfigs(prev => [newConfig, ...prev]);
            setFormData({ name: '', description: '', server_url: '' });
            setIsAddDialogOpen(false);
        } catch (err) {
            console.error('Error adding MCP config:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleEditConfig = async () => {
        if (!editingConfig || !formData.name || !formData.server_url) {
            setError('Name and server URL are required');
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            const updatedConfig: MCPConfig = {
                ...editingConfig,
                name: formData.name,
                description: formData.description,
                server_url: formData.server_url,
                updated_at: new Date().toISOString(),
            };

            setMcpConfigs(prev => prev.map(c => c.id === editingConfig.id ? updatedConfig : c));
            setEditingConfig(null);
            setFormData({ name: '', description: '', server_url: '' });
            setIsEditDialogOpen(false);
        } catch (err) {
            console.error('Error editing MCP config:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleDeleteConfig = async (id: string) => {
        if (!confirm('Are you sure you want to delete this MCP configuration?')) {
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            setMcpConfigs(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting MCP config:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleToggleEnabled = async (id: string) => {
        try {
            // Mock API call - in real implementation, this would call the API
            setMcpConfigs(prev => prev.map(c => 
                c.id === id ? { ...c, is_enabled: !c.is_enabled, updated_at: new Date().toISOString() } : c
            ));
        } catch (err) {
            console.error('Error toggling MCP config:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const openEditDialog = (config: MCPConfig) => {
        setEditingConfig(config);
        setFormData({
            name: config.name,
            description: config.description,
            server_url: config.server_url,
        });
        setIsEditDialogOpen(true);
    };

    const getHealthStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'unhealthy':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    useEffect(() => {
        if (isPlatformAdmin) {
            fetchMcpConfigs();
        }
    }, [isPlatformAdmin]);

    // Redirect if not platform admin
    if (!adminLoading && !isPlatformAdmin) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                            <p className="text-muted-foreground text-center">
                                You need platform admin privileges to access this page.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </LayoutView>
        );
    }

    if (adminLoading) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </div>
            </LayoutView>
        );
    }

    if (adminError) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-destructive mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Error</h2>
                            <p className="text-muted-foreground text-center">{adminError}</p>
                        </CardContent>
                    </Card>
                </div>
            </LayoutView>
        );
    }

    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Settings className="h-8 w-8" />
                            MCP Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage Model Context Protocol (MCP) server configurations
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add MCP Server
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add MCP Server</DialogTitle>
                                <DialogDescription>
                                    Configure a new Model Context Protocol server.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., GitHub MCP"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this MCP server"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="server_url">Server URL</Label>
                                    <Input
                                        id="server_url"
                                        value={formData.server_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, server_url: e.target.value }))}
                                        placeholder="https://mcp-server.example.com"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddConfig}>Add Server</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{mcpConfigs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {mcpConfigs.filter(c => c.is_enabled).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {mcpConfigs.filter(c => c.health_status === 'healthy').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {mcpConfigs.filter(c => c.health_status === 'unhealthy').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* MCP Configs List */}
                <Card>
                    <CardHeader>
                        <CardTitle>MCP Server Configurations</CardTitle>
                        <CardDescription>
                            Manage Model Context Protocol server connections
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Loading MCP configs...</span>
                            </div>
                        ) : mcpConfigs.length > 0 ? (
                            <div className="space-y-4">
                                {mcpConfigs.map((config) => (
                                    <div
                                        key={config.id}
                                        className="flex items-start justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium">{config.name}</h3>
                                                <Badge variant={config.is_enabled ? "default" : "secondary"}>
                                                    {config.is_enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                                <Badge 
                                                    variant="outline" 
                                                    className={getHealthStatusColor(config.health_status)}
                                                >
                                                    {config.health_status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {config.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" />
                                                    {config.server_url}
                                                </span>
                                                {config.last_health_check && (
                                                    <span>
                                                        Last check: {new Date(config.last_health_check).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleEnabled(config.id)}
                                            >
                                                {config.is_enabled ? 'Disable' : 'Enable'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(config)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteConfig(config.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No MCP configurations found</h3>
                                <p className="text-muted-foreground">
                                    Add your first MCP server configuration to get started.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit MCP Server</DialogTitle>
                            <DialogDescription>
                                Update the MCP server configuration.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., GitHub MCP"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this MCP server"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-server_url">Server URL</Label>
                                <Input
                                    id="edit-server_url"
                                    value={formData.server_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, server_url: e.target.value }))}
                                    placeholder="https://mcp-server.example.com"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditConfig}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </LayoutView>
    );
}