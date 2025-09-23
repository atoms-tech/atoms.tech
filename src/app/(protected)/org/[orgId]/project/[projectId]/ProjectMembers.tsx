'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowBigDownIcon, Filter, Plus, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
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
import { OrgMemberAutocomplete } from '@/components/ui/orgMemberAutocomplete';
import { toast } from '@/components/ui/use-toast';
import {
    PROJECT_ROLE_ARRAY,
    ProjectRole,
    hasProjectPermission,
} from '@/lib/auth/permissions';
import { getProjectMembers } from '@/lib/db/client/projects.client';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';

interface ProjectMembersProps {
    projectId: string;
}

const getRoleColor = (role: ProjectRole) => {
    switch (role) {
        case 'editor':
            return 'bg-green-100 text-green-800';
        case 'viewer':
            return 'bg-gray-100 text-gray-800';
        case 'owner':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function ProjectMembers({ projectId }: ProjectMembersProps) {
    const params = useParams<{ orgId: string }>();
    const { user } = useUser();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [roleInput, setRoleInput] = useState<ProjectRole>('viewer');
    const [roleFilters, setRoleFilters] = useState<ProjectRole[]>([]);

    const {
        data: members = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => getProjectMembers(projectId),
    });

    const userRole = (members.find((member) => member.id === user?.id)?.role ||
        null) as ProjectRole | null;

    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    });

    const filteredMembers = sortedMembers.filter((member) => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRoles =
            roleFilters.length > 0
                ? roleFilters.includes(member.role as ProjectRole)
                : true;
        return matchesSearch && matchesRoles;
    });

    const handleRemoveMember = async (memberId: string) => {
        if (!hasProjectPermission(userRole, 'removeMember')) {
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

    const handleChangeRole = async (memberId: string, selectedRole: ProjectRole) => {
        if (!hasProjectPermission(userRole, 'changeRole')) {
            setErrorMessage('You do not have permission to change roles.');
            return;
        }

        if (!memberId || !selectedRole) {
            setErrorMessage('Invalid operation. Please select a role.');
            return;
        }

        try {
            const { error } = await supabase
                .from('project_members')
                .update({ role: selectedRole })
                .eq('project_id', projectId)
                .eq('user_id', memberId);

            if (error) {
                console.error('Error updating project member role:', error);
                throw error;
            }

            setErrorMessage(null); // Clear error message on success
            refetch();
        } catch (error) {
            console.error('Error changing role:', error);
            setErrorMessage('Failed to change role. Please try again.');
        }
    };

    const handleAddMember = async (memberEmail: string, selectedRole: ProjectRole) => {
        if (!hasProjectPermission(userRole, 'assignToProject')) {
            toast({
                title: 'Error',
                description: 'You do not have permission to assign members to projects.',
                variant: 'destructive',
            });
            return;
        }

        if (!memberEmail || !selectedRole) {
            setErrorMessage('Please input email and/or role.');
            return;
        }

        try {
            // Check if the email exists in the profiles table
            const { data: member, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', memberEmail.trim())
                .single();

            if (profileError) {
                if (profileError.code === 'PGRST116') {
                    setErrorMessage(
                        'This email does not belong to any user. Please ask the user to sign up first.',
                    );
                    return;
                }
                console.error('Error checking email in profiles:', profileError);
                throw profileError;
            }

            const {
                data: existingMember,
                error: checkError,
                status,
            } = await supabase
                .from('project_members')
                .select('id')
                .eq('user_id', member?.id || '')
                .eq('project_id', projectId)
                .single();

            if (checkError && status !== 406) {
                console.error('Error checking project membership:', checkError);
                throw checkError;
            }

            if (existingMember) {
                setErrorMessage('User is already a part of this project.');
                return;
            }

            const {
                data: existingOrgMember,
                error: checkOrgError,
                status: orgStatus,
            } = await supabase
                .from('organization_members')
                .select('id')
                .eq('user_id', member?.id || '')
                .eq('organization_id', params?.orgId || '')
                .single();

            if (checkOrgError && orgStatus !== 406) {
                console.error('Error checking organization membership:', checkError);
                throw checkError;
            }

            if (!existingOrgMember) {
                setErrorMessage('User is not a part of this organization.');
                return;
            }

            const { error } = await supabase
                .from('project_members')
                .insert({
                    user_id: member?.id || '',
                    project_id: projectId,
                    role: selectedRole,
                    org_id: params?.orgId || '',
                    status: 'active',
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to assign user to project', error);
                throw error;
            }

            toast({
                title: 'Success',
                description: 'User assigned to project successfully!',
                variant: 'default',
            });
            setErrorMessage(null);
            refetch();
        } catch (error) {
            console.error('Error assigning user to project:', error);
            setErrorMessage('Failed to assign user to project.');
        } finally {
            setEmailInput('');
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 pb-0">
                <div>
                    <CardTitle className="text-xl">Project Members</CardTitle>
                    <CardDescription>Manage members of your project</CardDescription>
                </div>
                {hasProjectPermission(userRole, 'changeRole') && (
                    <div className="flex w-full md:w-auto space-x-2 pb-3">
                        <Button
                            variant="ghost"
                            className="w-9 h-9"
                            onClick={() => handleAddMember(emailInput, roleInput)}
                        >
                            <Plus></Plus>
                        </Button>
                        <OrgMemberAutocomplete
                            orgId={params?.orgId || ''}
                            value={emailInput}
                            onChange={setEmailInput}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(roleInput as ProjectRole)}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {roleInput}
                                        <ArrowBigDownIcon className="h-4 w-4" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {['editor', 'viewer'].map((role) => (
                                    <DropdownMenuItem
                                        key={role}
                                        onClick={() => {
                                            setRoleInput(role as ProjectRole);
                                        }}
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
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
                            {PROJECT_ROLE_ARRAY.map((role) => (
                                <DropdownMenuItem
                                    key={role}
                                    onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                                    onClick={() => {
                                        setRoleFilters((prev) =>
                                            prev.includes(role as ProjectRole)
                                                ? prev.filter((r) => r !== role)
                                                : [...prev, role as ProjectRole],
                                        );
                                    }}
                                >
                                    <span
                                        className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                            roleFilters.includes(role as ProjectRole)
                                                ? 'bg-primary'
                                                : 'bg-gray-200'
                                        }`}
                                    ></span>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                {errorMessage && (
                    <div className="text-red-600 text-sm mb-4">{errorMessage}</div>
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleColor(member.role as ProjectRole)} 
                                                ${member.id === user?.id || !hasProjectPermission(userRole, 'changeRole') ? 'pointer-events-none' : ''}`}
                                        >
                                            {member.id === user?.id ||
                                            !hasProjectPermission(
                                                userRole,
                                                'changeRole',
                                            ) ? (
                                                member.role
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {member.role}
                                                    <ArrowBigDownIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {['editor', 'viewer'].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() => {
                                                    handleChangeRole(
                                                        member.id,
                                                        role as ProjectRole,
                                                    );
                                                }}
                                            >
                                                {role.charAt(0).toUpperCase() +
                                                    role.slice(1)}
                                            </DropdownMenuItem>
                                        ))}
                                        {hasProjectPermission(
                                            userRole,
                                            'removeMember',
                                        ) && (
                                            <>
                                                <hr></hr>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleRemoveMember(member.id)
                                                    }
                                                    className="text-red-600"
                                                >
                                                    Remove
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">No members found</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Invite members to collaborate
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
