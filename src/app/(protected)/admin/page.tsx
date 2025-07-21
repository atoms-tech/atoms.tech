'use client';

import { Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import LayoutView from '@/components/views/LayoutView';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Profile } from '@/types/base/profiles.types';

export default function AdminPage() {
    const [unapprovedUsers, setUnapprovedUsers] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_approved', false);
            if (error) {
                console.error('Error retrieving pending members:', error);
                return;
            }
            setUnapprovedUsers(data || []);
        })();
    }, []);

    const filteredUnapproved = unapprovedUsers.filter((user) => {
        return (
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const approveUser = async (approvedUser: Profile) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', approvedUser.id);
        if (error) {
            console.error('Failed to approve user:', error);
            return;
        }
        setUnapprovedUsers(
            unapprovedUsers.filter((pendingUser) => pendingUser !== approvedUser),
        );
        /* TODO: Send email to user confirming they've been approved
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
                            <CardTitle className="text-xl">Pending Users</CardTitle>
                            <CardDescription>Manage unapproved users</CardDescription>
                        </div>
                        <div className="flex w-full md:w-auto space-x-2 pb-3">
                            <Input
                                type="text"
                                placeholder="Search by name or email"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredUnapproved.length > 0 ? (
                            <div className="space-y-3">
                                {filteredUnapproved.map((user) => (
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
                                        <Button
                                            variant="ghost"
                                            className="w-9 h-9"
                                            onClick={() => approveUser(user)}
                                        >
                                            <Plus></Plus>
                                        </Button>
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
