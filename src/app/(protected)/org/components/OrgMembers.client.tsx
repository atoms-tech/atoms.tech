'use client';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Users } from 'lucide-react';
import { useParams } from 'next/navigation';

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
import { getOrganizationMembers } from '@/lib/db/client';
import { EUserRoleType } from '@/types';

interface OrgMembersProps {
    className?: string;
}

export default function OrgMembers({ className }: OrgMembersProps) {
    const params = useParams<{ orgId: string }>();

    const { data: members, isLoading } = useQuery({
        queryKey: ['organization-members', params.orgId],
        queryFn: () => getOrganizationMembers(params.orgId),
        enabled: !!params.orgId,
    });

    const getRoleColor = (role: EUserRoleType) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            case 'member':
                return 'bg-green-100 text-green-800';
            case 'super_admin':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl">Members</CardTitle>
                    <CardDescription>
                        Manage organization members
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                            </div>
                        ))}
                    </div>
                ) : members && members.length > 0 ? (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {/* TODO: Implement user name display, profiles does not exist
                                              {member.profiles?.full_name ||
                                                'User'} */}
                                            User
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {/* TODO: Implement user email display, profiles does not exist
                                            {member.profiles?.email */}
                                            Email
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}
                                    >
                                        {member.role}
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                Change role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">
                                                Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">
                            No members found
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Invite members to collaborate
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
