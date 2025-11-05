'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Settings as SettingsIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface MCPTool {
    name: string;
    description?: string;
    enabled: boolean;
}

interface MCPServerInProfile {
    serverId: string;
    serverName: string;
    namespace: string;
    enabled: boolean;
    tools: MCPTool[];
}

interface MCPProfile {
    id: string;
    name: string;
    description: string;
    servers: MCPServerInProfile[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface InstalledServer {
    id: string;
    name: string;
    namespace: string;
    transport_type: string;
    enabled: boolean;
}

interface MCPProfilesProps {
    compact?: boolean;
}

export function MCPProfiles({ compact = false }: MCPProfilesProps) {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<MCPProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState<MCPProfile | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);

    // Form state
    const [profileName, setProfileName] = useState('');
    const [profileDescription, setProfileDescription] = useState('');
    const [selectedServers, setSelectedServers] = useState<MCPServerInProfile[]>([]);

    // Available servers
    const [availableServers, setAvailableServers] = useState<InstalledServer[]>([]);
    const [loadingServers, setLoadingServers] = useState(false);

    useEffect(() => {
        fetchProfiles();
        fetchAvailableServers();
    }, []);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/mcp/profiles');
            if (!response.ok) throw new Error('Failed to fetch profiles');

            const data = await response.json();
            setProfiles(data.profiles || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableServers = async () => {
        try {
            setLoadingServers(true);
            const response = await fetch('/api/mcp/installed');
            if (!response.ok) throw new Error('Failed to fetch servers');

            const data = await response.json();
            setAvailableServers(data.servers || []);
        } catch (error) {
            console.error('Error fetching servers:', error);
            setAvailableServers([]);
        } finally {
            setLoadingServers(false);
        }
    };

    const handleCreateProfile = () => {
        setProfileName('');
        setProfileDescription('');
        setSelectedServers([]);
        setEditingProfile(null);
        setShowCreateDialog(true);
    };

    const handleEditProfile = (profile: MCPProfile) => {
        setProfileName(profile.name);
        setProfileDescription(profile.description);
        setSelectedServers(profile.servers);
        setEditingProfile(profile);
        setShowCreateDialog(true);
    };

    const toggleServerSelection = (server: InstalledServer) => {
        const existing = selectedServers.find(s => s.serverId === server.id);

        if (existing) {
            // Remove server
            setSelectedServers(prev => prev.filter(s => s.serverId !== server.id));
        } else {
            // Add server with all tools enabled by default
            // TODO: Fetch actual tools from server
            setSelectedServers(prev => [...prev, {
                serverId: server.id,
                serverName: server.name,
                namespace: server.namespace,
                enabled: true,
                tools: [], // Will be populated when we fetch server details
            }]);
        }
    };

    const toggleToolInServer = (serverId: string, toolName: string) => {
        setSelectedServers(prev => prev.map(server => {
            if (server.serverId === serverId) {
                return {
                    ...server,
                    tools: server.tools.map(tool =>
                        tool.name === toolName
                            ? { ...tool, enabled: !tool.enabled }
                            : tool
                    ),
                };
            }
            return server;
        }));
    };

    const handleSaveProfile = async () => {
        if (!profileName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Profile name is required',
            });
            return;
        }

        if (selectedServers.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please select at least one server',
            });
            return;
        }

        try {
            const method = editingProfile ? 'PUT' : 'POST';
            const url = editingProfile
                ? `/api/mcp/profiles/${editingProfile.id}`
                : '/api/mcp/profiles';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profileName,
                    description: profileDescription,
                    servers: selectedServers,
                }),
            });

            if (!response.ok) throw new Error('Failed to save profile');

            toast({
                variant: 'default',
                title: 'Success',
                description: `Profile ${editingProfile ? 'updated' : 'created'} successfully`,
            });
            setShowCreateDialog(false);
            fetchProfiles();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save profile',
            });
        }
    };

    const handleDeleteProfile = async () => {
        if (!deletingProfileId) return;

        try {
            const response = await fetch(`/api/mcp/profiles/${deletingProfileId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete profile');

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Profile deleted successfully',
            });
            setShowDeleteDialog(false);
            setDeletingProfileId(null);
            fetchProfiles();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete profile',
            });
        }
    };

    const handleActivateProfile = async (profileId: string) => {
        try {
            const response = await fetch(`/api/mcp/profiles/${profileId}/activate`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to activate profile');

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Profile activated successfully',
            });
            fetchProfiles();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to activate profile',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading profiles...</div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">MCP Profiles</h3>
                        <p className="text-sm text-muted-foreground">
                            Create preset packs of MCP servers with tool-level granularity
                        </p>
                    </div>
                    <Button onClick={handleCreateProfile}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Profile
                    </Button>
                </div>

                {/* Profiles List */}
                {profiles.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No profiles yet</h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center">
                                Create your first profile to organize your MCP servers and tools
                            </p>
                            <Button onClick={handleCreateProfile}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Profile
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profiles.map((profile) => (
                            <Card key={profile.id} className={profile.isActive ? 'border-primary' : ''}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {profile.name}
                                                {profile.isActive && (
                                                    <Badge variant="default" className="text-xs">
                                                        Active
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {profile.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* Servers */}
                                        <div>
                                            <p className="text-sm font-medium mb-2">
                                                Servers ({profile.servers.length})
                                            </p>
                                            <div className="space-y-2">
                                                {profile.servers.map((server, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {server.serverName}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {server.tools.filter((t) => t.enabled).length}/
                                                                {server.tools.length} tools
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {!profile.isActive && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleActivateProfile(profile.id)}
                                                    className="flex-1"
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditProfile(profile)}
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Implement duplicate
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setDeletingProfileId(profile.id);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProfile ? 'Edit Profile' : 'Create New Profile'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure your MCP profile with specific servers and tools
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Profile Name</Label>
                                <Input
                                    id="name"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="e.g., Development, Production, Testing"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={profileDescription}
                                    onChange={(e) => setProfileDescription(e.target.value)}
                                    placeholder="Describe what this profile is for..."
                                    rows={3}
                                />
                            </div>

                            <Separator />

                            {/* Server Selection */}
                            <div>
                                <Label className="text-base">Select Servers</Label>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Choose which MCP servers to include in this profile
                                </p>

                                {loadingServers ? (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        Loading servers...
                                    </div>
                                ) : availableServers.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        No servers installed. Install servers from the Marketplace tab first.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {availableServers.map((server) => {
                                            const isSelected = selectedServers.some(s => s.serverId === server.id);
                                            const selectedServer = selectedServers.find(s => s.serverId === server.id);

                                            return (
                                                <div key={server.id} className="border rounded-lg p-3">
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => toggleServerSelection(server)}
                                                            className="mt-1"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{server.name}</p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {server.transport_type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {server.namespace}
                                                            </p>

                                                            {/* Tool Selection (if server is selected) */}
                                                            {isSelected && selectedServer && selectedServer.tools.length > 0 && (
                                                                <div className="mt-3 pl-4 border-l-2 space-y-2">
                                                                    <p className="text-xs font-medium text-muted-foreground">
                                                                        Tools ({selectedServer.tools.filter(t => t.enabled).length}/{selectedServer.tools.length} enabled)
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {selectedServer.tools.map((tool) => (
                                                                            <div key={tool.name} className="flex items-start gap-2">
                                                                                <Checkbox
                                                                                    checked={tool.enabled}
                                                                                    onChange={() => toggleToolInServer(server.id, tool.name)}
                                                                                    className="mt-0.5"
                                                                                />
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm">{tool.name}</p>
                                                                                    {tool.description && (
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {tool.description}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Selected Summary */}
                            {selectedServers.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label className="text-base">Summary</Label>
                                        <div className="mt-2 p-3 bg-muted rounded-lg">
                                            <p className="text-sm">
                                                <strong>{selectedServers.length}</strong> server(s) selected
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedServers.map((server) => (
                                                    <Badge key={server.serverId} variant="secondary">
                                                        {server.serverName}
                                                        {server.tools.length > 0 && (
                                                            <span className="ml-1 text-xs">
                                                                ({server.tools.filter(t => t.enabled).length}/{server.tools.length})
                                                            </span>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={!profileName.trim() || selectedServers.length === 0}>
                            {editingProfile ? 'Save Changes' : 'Create Profile'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Profile</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this profile? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProfile}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

