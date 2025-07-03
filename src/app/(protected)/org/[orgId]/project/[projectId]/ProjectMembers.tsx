'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, MoreHorizontal, Users } from 'lucide-react';
import { useState } from 'react';

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
import { getProjectMembers } from '@/lib/db/client/projects.client';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { EProjectRole } from '@/types';

interface ProjectMembersProps {
    projectId: string;
}

const getRoleColor = (role: EProjectRole) => {
    switch (role) {
        case 'admin':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'maintainer':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'editor':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'viewer':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        case 'owner':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
};

export default function ProjectMembers({ projectId }: ProjectMembersProps) {
    const { user } = useUser();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<EProjectRole | null>(null);
    const [isRolePromptOpen, setIsRolePromptOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilters, setRoleFilters] = useState<EProjectRole[]>([]);

    const {
        data: members = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
    });

    // Define rolePermissions with explicit type
    const rolePermissions: Record<
        'owner' | 'admin' | 'maintainer' | 'editor' | 'viewer',
        string[]
    > = {
        owner: ['changeRole', 'removeMember'],
        admin: ['removeMember'],
        maintainer: [],
        editor: [],
        viewer: [],
    };

    // Explicitly type userRole
    const userRole: keyof typeof rolePermissions =
        (members.find((member) => member.id === user?.id)
            ?.role as keyof typeof rolePermissions) || 'viewer';

    const canPerformAction = (action: string) => {
        return rolePermissions[userRole].includes(action);
    };

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    });

    const filteredMembers = sortedMembers.filter((member) => {
        const matchesSearch =
            member.full_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRoles =
            roleFilters.length > 0
                ? roleFilters.includes(member.role as EProjectRole)
                : true;
        return matchesSearch && matchesRoles;
    });

    const handleRemoveMember = async (memberId: string) => {
        if (!canPerformAction('removeMember')) {
            setErrorMessage('You do not have permission to remove members.');
            return;
        }

        if (!user?.id) {
            setErrorMessage('User not authenticated.');
            return;
        }

        try {
            const { error } = await supabase
                .from('project_members')
                .delete()
                .eq('project_id', projectId)
                .eq('user_id', memberId);

            if (error) {
                console.error('Error removing member:', error);
                throw error;
            }

            setErrorMessage(null); // Clear error message on success
            refetch();
        } catch (error) {
            console.error('Error removing member:', error);
            setErrorMessage('Failed to remove member.');
        }
    };

    const handleChangeRole = async () => {
        if (!canPerformAction('changeRole')) {
            setErrorMessage('You do not have permission to change roles.');
            return;
        }

        if (!activeMemberId || !selectedRole) {
            setErrorMessage('Invalid operation. Please select a role.');
            return;
        }

        try {
            const { error } = await supabase
                .from('project_members')
                .update({ role: selectedRole })
                .eq('project_id', projectId)
                .eq('user_id', activeMemberId);

            if (error) {
                console.error('Error updating project member role:', error);
                throw error;
            }

            setErrorMessage(null); // Clear error message on success
            refetch();
            setIsRolePromptOpen(false);
            setActiveMemberId(null);
            setSelectedRole(null);
        } catch (error) {
            console.error('Error changing role:', error);
            setErrorMessage('Failed to change role. Please try again.');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 pb-0">
                <div>
                    <CardTitle className="text-xl">Project Members</CardTitle>
                    <CardDescription>
                        Manage members of your project
                    </CardDescription>
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
                            {[
                                'admin',
                                'maintainer',
                                'editor',
                                'viewer',
                                'owner',
                            ].map((role) => (
                                <DropdownMenuItem
                                    key={role}
                                    onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                    onClick={() => {
                                        setRoleFilters((prev) =>
                                            prev.includes(role as EProjectRole)
                                                ? prev.filter((r) => r !== role)
                                                : [
                                                      ...prev,
                                                      role as EProjectRole,
                                                  ],
                                        );
                                    }}
                                >
                                    <span
                                        className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                            roleFilters.includes(
                                                role as EProjectRole,
                                            )
                                                ? 'bg-primary'
                                                : 'bg-gray-200'
                                        }`}
                                    ></span>
                                    {role.charAt(0).toUpperCase() +
                                        role.slice(1)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                {errorMessage && (
                    <div className="text-red-600 text-sm mb-4">
                        {errorMessage}
                    </div>
                )}
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
                ) : filteredMembers.length > 0 ? (
                    <div className="space-y-3">
                        {filteredMembers.map((member) => (
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
                                            {member.full_name || 'User'}
                                            {member.id === user?.id && ' (you)'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role as EProjectRole)}`}
                                    >
                                        {member.role}
                                    </span>
                                    {canPerformAction('changeRole') &&
                                        member.role !== 'owner' && (
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
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveMemberId(
                                                                member.id,
                                                            );
                                                            setIsRolePromptOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        Change role
                                                    </DropdownMenuItem>
                                                    {canPerformAction(
                                                        'removeMember',
                                                    ) && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                handleRemoveMember(
                                                                    member.id,
                                                                );
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            Remove
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
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

            {isRolePromptOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border border-black-300 dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                            Change Role
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Role
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            {selectedRole
                                                ? selectedRole
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  selectedRole.slice(1)
                                                : 'Choose a role'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {[
                                            'admin',
                                            'maintainer',
                                            'editor',
                                            'viewer',
                                        ].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() =>
                                                    setSelectedRole(
                                                        role as EProjectRole,
                                                    )
                                                }
                                            >
                                                {role.charAt(0).toUpperCase() +
                                                    role.slice(1)}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-muted"
                                onClick={() => {
                                    setIsRolePromptOpen(false);
                                    setSelectedRole(null);
                                    setActiveMemberId(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80"
                                onClick={handleChangeRole}
                                disabled={!selectedRole}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
