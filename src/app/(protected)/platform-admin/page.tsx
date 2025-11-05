'use client';

import { Shield, Users, Settings, Database, Plus, Trash2, RefreshCw, FileText, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

interface PlatformAdmin {
    id: string;
    workos_user_id: string;
    email: string;
    name: string | null;
    added_at: string;
    added_by: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function PlatformAdminPage() {
    const { isPlatformAdmin, isLoading: adminLoading, error: adminError } = usePlatformAdmin();
    const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminWorkosId, setNewAdminWorkosId] = useState('');

    // Define fetchAdmins before useEffect
    const fetchAdmins = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/platform/admin/list');
            if (!response.ok) {
                throw new Error(`Failed to fetch admins: ${response.statusText}`);
            }

            const data = await response.json();
            setAdmins(data.admins || []);
        } catch (err) {
            console.error('Error fetching admins:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch admins effect - must be called before any early returns
    useEffect(() => {
        if (isPlatformAdmin) {
            void fetchAdmins();
        }
    }, [isPlatformAdmin, fetchAdmins]);

    // Redirect if not platform admin (after all hooks are called)
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

    const addAdmin = async () => {
        if (!newAdminEmail || !newAdminWorkosId) {
            setError('Email and WorkOS User ID are required');
            return;
        }

        try {
            const response = await fetch('/api/platform/admin/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workosUserId: newAdminWorkosId,
                    email: newAdminEmail,
                    name: newAdminName || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to add admin');
            }

            // Reset form and close dialog
            setNewAdminEmail('');
            setNewAdminName('');
            setNewAdminWorkosId('');
            setIsAddDialogOpen(false);
            
            // Refresh admin list
            await fetchAdmins();
        } catch (err) {
            console.error('Error adding admin:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const removeAdmin = async (email: string) => {
        if (!confirm(`Are you sure you want to remove ${email} as a platform admin?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/platform/admin/remove?email=${encodeURIComponent(email)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to remove admin');
            }

            // Refresh admin list
            await fetchAdmins();
        } catch (err) {
            console.error('Error removing admin:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleSyncWorkOS = async () => {
        try {
            setIsSyncing(true);
            setError(null);

            const response = await fetch('/api/platform/admin/sync-workos', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to sync WorkOS users');
            }

            const result = await response.json();
            console.log('WorkOS sync result:', result);

            // Refresh the admin list
            await fetchAdmins();
        } catch (err) {
            console.error('Error syncing WorkOS users:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsSyncing(false);
        }
    };

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
                            <Shield className="h-8 w-8" />
                            Platform Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage platform-wide administrators and system settings
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Platform Admins</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{admins.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active administrators
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">Online</div>
                            <p className="text-xs text-muted-foreground">
                                All systems operational
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admin Features</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">5</div>
                            <p className="text-xs text-muted-foreground">
                                Available tools
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Platform Admins Management */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Platform Administrators</CardTitle>
                            <CardDescription>
                                Manage users with platform-wide administrative privileges
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Admin
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Platform Admin</DialogTitle>
                                        <DialogDescription>
                                            Add a new user as a platform administrator.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newAdminEmail}
                                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                                placeholder="admin@example.com"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="name">Full Name (Optional)</Label>
                                            <Input
                                                id="name"
                                                value={newAdminName}
                                                onChange={(e) => setNewAdminName(e.target.value)}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="workosId">WorkOS User ID</Label>
                                            <Input
                                                id="workosId"
                                                value={newAdminWorkosId}
                                                onChange={(e) => setNewAdminWorkosId(e.target.value)}
                                                placeholder="user_01ABC123..."
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={addAdmin}>Add Admin</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                onClick={handleSyncWorkOS}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCcw className="h-4 w-4 mr-2" />
                                )}
                                {isSyncing ? 'Syncing...' : 'Sync WorkOS'}
                            </Button>
                        </div>
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
                                <span className="ml-2">Loading admins...</span>
                            </div>
                        ) : admins.length > 0 ? (
                            <div className="space-y-3">
                                {admins.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {admin.name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {admin.email}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Added: {new Date(admin.added_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                Active
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAdmin(admin.email)}
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
                                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No platform admins found</h3>
                                <p className="text-muted-foreground">
                                    Add administrators to manage the platform.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common administrative tasks and system management
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                                <a href="/admin">
                                    <Users className="h-6 w-6" />
                                    <span>User Management</span>
                                </a>
                            </Button>
                            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                                <a href="/platform-admin/system-prompts">
                                    <FileText className="h-6 w-6" />
                                    <span>System Prompts</span>
                                </a>
                            </Button>
                            <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                                <a href="/platform-admin/mcp-management">
                                    <Settings className="h-6 w-6" />
                                    <span>MCP Management</span>
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutView>
    );
}