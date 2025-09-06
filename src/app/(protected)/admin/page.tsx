'use client';

import { Check, Filter, Users, X } from 'lucide-react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import LayoutView from '@/components/views/LayoutView';
import { atomsApiClient } from '@/lib/atoms-api';

type User = {
    email: string;
    full_name: string | null;
    id: string;
    is_approved: boolean;
    created_at: string | null;
};

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [approveFilter, setApproveFilter] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const api = atomsApiClient();
                const list = await api.auth.listProfiles();
                setUsers(list || []);
            } catch (e) {
                console.error('Error retrieving pending members:', e);
            }
        })();
    }, []);

    const filteredUsers = users.filter((user) => {
        return (
            (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (approveFilter !== null ? user.is_approved === approveFilter : true)
        );
    });

    const approveUser = async (unapprovedUser: User) => {
        try {
            const api = atomsApiClient();
            await api.auth.setApproval(unapprovedUser.id, true);
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === unapprovedUser.id ? { ...user, is_approved: true } : user,
                ),
            );
            await fetch('/api/email/notify-approval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: unapprovedUser.email,
                    name: unapprovedUser.full_name || 'User',
                }),
            });
        } catch (error) {
            console.error('Failed to approve user:', error);
        }
    };

    const unapproveUser = async (approvedUser: User) => {
        try {
            const api = atomsApiClient();
            await api.auth.setApproval(approvedUser.id, false);
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === approvedUser.id ? { ...user, is_approved: false } : user,
                ),
            );
        } catch (error) {
            console.error('Failed to unapprove user:', error);
        }
        /* TODO: Send email to user confirming they've been unapproved
        await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: {
             'Content-Type': 'application/json'  
            },
            body: JSON.stringify({email: user.email}),
        });
        */
    };

    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                {/* Admin Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{'Admin Dashboard'}</h1>
                        <p className="text-muted-foreground mt-1">
                            {'Manage atoms.tech resources and details'}
                        </p>
                    </div>
                </div>
                <Card>
                    <CardHeader className="flex flex-col gap-4 pb-2">
                        <div>
                            <CardTitle className="text-xl">Users</CardTitle>
                            <CardDescription>Manage users</CardDescription>
                        </div>
                        <div className="flex w-full md:w-auto space-x-2 pb-3">
                            <Input
                                type="text"
                                placeholder="Search by name or email"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="default" className="w-9 h-9">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => setApproveFilter(null)}
                                    >
                                        <span
                                            className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                approveFilter === null
                                                    ? 'bg-primary'
                                                    : 'bg-gray-200'
                                            }`}
                                        ></span>
                                        {'All'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setApproveFilter(true)}
                                    >
                                        <span
                                            className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                approveFilter === true
                                                    ? 'bg-primary'
                                                    : 'bg-gray-200'
                                            }`}
                                        ></span>
                                        {'Approved'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setApproveFilter(false)}
                                    >
                                        <span
                                            className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                approveFilter === false
                                                    ? 'bg-primary'
                                                    : 'bg-gray-200'
                                            }`}
                                        ></span>
                                        {'Unapproved'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredUsers.length > 0 ? (
                            <div className="space-y-3">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {user.full_name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {user.is_approved ? (
                                                <>
                                                    <Badge
                                                        className="bg-green-700"
                                                        variant="outline"
                                                    >
                                                        {'Approved'}
                                                    </Badge>{' '}
                                                    <Button
                                                        variant="ghost"
                                                        className="w-9 h-9"
                                                        onClick={() =>
                                                            unapproveUser(user)
                                                        }
                                                    >
                                                        <X></X>
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge variant="outline">
                                                        {'Unapproved'}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-9 h-9"
                                                        onClick={() => approveUser(user)}
                                                    >
                                                        <Check></Check>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    No unapproved users found
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Invite people to atoms.tech
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </LayoutView>
    );
}
