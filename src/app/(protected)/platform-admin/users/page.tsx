'use client';

import { Shield, Users, UserPlus, Search, Trash2, Check, X, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LayoutView from '@/components/views/LayoutView';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useToast } from '@/components/ui/use-toast';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    workos_id: string | null;
    status: 'active' | 'suspended' | 'pending';
    is_approved: boolean;
    is_deleted: boolean;
    created_at: string;
    last_login_at: string | null;
    login_count: number | null;
}

interface SignupRequest {
    id: string;
    email: string;
    full_name: string;
    message: string | null;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    approved_at: string | null;
    denied_at: string | null;
    denial_reason: string | null;
}

export default function UserManagementPage() {
    const { isPlatformAdmin, isLoading: adminLoading } = usePlatformAdmin();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('all');

    const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [requestStatusFilter, setRequestStatusFilter] = useState('pending');

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);

    const [inviteEmail, setInviteEmail] = useState('');
    const [denyReason, setDenyReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoadingUsers(true);
            const params = new URLSearchParams();
            if (userStatusFilter !== 'all') params.append('status', userStatusFilter);
            if (userSearch) params.append('search', userSearch);

            const response = await fetch(`/api/platform/admin/users?${params}`);
            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
        } finally {
            setIsLoadingUsers(false);
        }
    }, [userStatusFilter, userSearch, toast]);

    const fetchSignupRequests = useCallback(async () => {
        try {
            setIsLoadingRequests(true);
            const params = new URLSearchParams();
            if (requestStatusFilter !== 'all') params.append('status', requestStatusFilter);

            const response = await fetch(`/api/platform/admin/signup-requests?${params}`);
            if (!response.ok) throw new Error('Failed to fetch signup requests');

            const data = await response.json();
            setSignupRequests(data.requests || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch signup requests', variant: 'destructive' });
        } finally {
            setIsLoadingRequests(false);
        }
    }, [requestStatusFilter, toast]);

    useEffect(() => {
        if (isPlatformAdmin) {
            fetchUsers();
            fetchSignupRequests();
        }
    }, [isPlatformAdmin, fetchUsers, fetchSignupRequests]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isPlatformAdmin) fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch, isPlatformAdmin, fetchUsers]);

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
            return;
        }

        try {
            setIsProcessing(true);
            const response = await fetch('/api/platform/admin/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || 'Failed to invite user');

            toast({ title: 'Success', description: `Invitation sent to ${inviteEmail}` });
            setIsInviteDialogOpen(false);
            setInviteEmail('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            setIsProcessing(true);
            const response = await fetch(`/api/platform/admin/users/${selectedUser.id}`, { method: 'DELETE' });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            toast({ title: 'Success', description: `User ${selectedUser.email} has been deleted` });
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveRequest = async (request: SignupRequest) => {
        try {
            setIsProcessing(true);
            const response = await fetch('/api/platform/admin/signup-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: request.id, action: 'approve' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve request');
            }

            toast({ title: 'Success', description: `Signup request approved for ${request.email}` });
            fetchSignupRequests();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDenyRequest = async () => {
        if (!selectedRequest) return;

        try {
            setIsProcessing(true);
            const response = await fetch('/api/platform/admin/signup-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: selectedRequest.id, action: 'deny', reason: denyReason }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to deny request');
            }

            toast({ title: 'Success', description: `Signup request denied for ${selectedRequest.email}` });
            setIsDenyDialogOpen(false);
            setSelectedRequest(null);
            setDenyReason('');
            fetchSignupRequests();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsProcessing(false);
        }
    };

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
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </div>
            </LayoutView>
        );
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            pending: 'secondary',
            suspended: 'destructive',
            approved: 'default',
            denied: 'destructive',
        };
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
    };

    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        User Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage users, signup requests, and send invitations
                    </p>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users">All Users</TabsTrigger>
                        <TabsTrigger value="requests">
                            Signup Requests
                            {signupRequests.filter(r => r.status === 'pending').length > 0 && (
                                <Badge className="ml-2" variant="destructive">
                                    {signupRequests.filter(r => r.status === 'pending').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>All Users</CardTitle>
                                        <CardDescription>View and manage all platform users</CardDescription>
                                    </div>
                                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Invite User
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Invite User</DialogTitle>
                                                <DialogDescription>
                                                    Send an invitation email to a new user
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="invite-email">Email Address</Label>
                                                    <Input
                                                        id="invite-email"
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        placeholder="user@example.com"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleInviteUser} disabled={isProcessing}>
                                                    {isProcessing ? 'Sending...' : 'Send Invitation'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by email or name..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" onClick={fetchUsers}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>

                                {isLoadingUsers ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-4 font-medium">Email</th>
                                                    <th className="text-left p-4 font-medium">Name</th>
                                                    <th className="text-left p-4 font-medium">Status</th>
                                                    <th className="text-left p-4 font-medium">Logins</th>
                                                    <th className="text-left p-4 font-medium">Created</th>
                                                    <th className="text-right p-4 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id} className="border-t hover:bg-muted/50">
                                                        <td className="p-4">{user.email}</td>
                                                        <td className="p-4">{user.full_name || '-'}</td>
                                                        <td className="p-4">{getStatusBadge(user.status)}</td>
                                                        <td className="p-4">{user.login_count || 0}</td>
                                                        <td className="p-4">
                                                            {new Date(user.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="requests" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Signup Requests</CardTitle>
                                        <CardDescription>Review and approve user signup requests</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="denied">Denied</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" onClick={fetchSignupRequests}>
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingRequests ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : signupRequests.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No signup requests found
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {signupRequests.map((request) => (
                                            <div key={request.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-medium">{request.full_name}</h3>
                                                            {getStatusBadge(request.status)}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{request.email}</p>
                                                        {request.message && (
                                                            <p className="text-sm mt-2">{request.message}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Requested: {new Date(request.created_at).toLocaleString()}
                                                        </p>
                                                        {request.denial_reason && (
                                                            <p className="text-sm text-destructive mt-2">
                                                                Denial reason: {request.denial_reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {request.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handleApproveRequest(request)}
                                                                disabled={isProcessing}
                                                            >
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setIsDenyDialogOpen(true);
                                                                }}
                                                                disabled={isProcessing}
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                                Deny
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="py-4">
                                <p className="font-medium">{selectedUser.email}</p>
                                <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing}>
                                {isProcessing ? 'Deleting...' : 'Delete User'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Deny Signup Request</DialogTitle>
                            <DialogDescription>
                                Provide a reason for denying this signup request
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                            <div className="space-y-4">
                                <div>
                                    <p className="font-medium">{selectedRequest.email}</p>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.full_name}</p>
                                </div>
                                <div>
                                    <Label htmlFor="deny-reason">Reason (optional)</Label>
                                    <Textarea
                                        id="deny-reason"
                                        value={denyReason}
                                        onChange={(e) => setDenyReason(e.target.value)}
                                        placeholder="Enter reason for denial..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDenyDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDenyRequest} disabled={isProcessing}>
                                {isProcessing ? 'Denying...' : 'Deny Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </LayoutView>
    );
}
