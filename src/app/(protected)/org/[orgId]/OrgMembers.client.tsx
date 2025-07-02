'use client';

import { useQuery } from '@tanstack/react-query';
import { Filter, MoreHorizontal, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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
import { useToast } from '@/components/ui/use-toast';
import { useSetOrgMemberCount } from '@/hooks/mutations/useOrgMemberMutation';
import { useCreateProjectMember } from '@/hooks/mutations/useProjectMutations';
import {
    ORGANIZATION_ROLE_ARRAY,
    OrganizationRole,
    ProjectRole,
    hasOrganizationPermission,
} from '@/lib/auth/permissions';
import { getOrganizationMembers } from '@/lib/db/client';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';

interface OrgMembersProps {
    className?: string;
}

export default function OrgMembers({ className }: OrgMembersProps) {
    const params = useParams<{ orgId: string }>();
    const { user } = useUser();
    const { toast } = useToast();
    const { mutateAsync: setOrgMemberCount } = useSetOrgMemberCount();
    const { mutateAsync: createProjectMember } = useCreateProjectMember();
    const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(
        null,
    );
    const [isRolePromptOpen, setIsRolePromptOpen] = useState(false);
    const [isAssignPromptOpen, setIsAssignPromptOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null,
    );
    const [assignRole, setAssignRole] = useState<ProjectRole | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilters, setRoleFilters] = useState<OrganizationRole[]>([]);

    const [userRole, setUserRole] = useState<OrganizationRole | null>(null);

    const {
        data: members = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['organization-members', params?.orgId || ''],
        queryFn: () =>
            params ? getOrganizationMembers(params.orgId) : Promise.resolve([]),
        enabled: params?.orgId ? true : false,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['organization-projects', params?.orgId || ''],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name')
                .eq('organization_id', params?.orgId || '')
                .eq('is_deleted', false);

            if (error) {
                console.error('Error fetching projects:', error);
                throw error;
            }

            return data || [];
        },
        enabled: !!params?.orgId,
    });

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data, error } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', params?.orgId || '')
                .eq('user_id', user?.id || '')
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return;
            }

            setUserRole(data?.role || null);
        };

        fetchUserRole();
    }, [params?.orgId, user?.id]);

    const handleRemoveMember = async (memberId: string) => {
        if (!hasOrganizationPermission(userRole, 'removeMember')) {
            toast({
                title: 'Error',
                description: 'You do not have permission to remove members.',
                variant: 'destructive',
            });
            return;
        }

        if (!user?.id) {
            toast({
                title: 'Error',
                description: 'User not authenticated.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('organization_id', params?.orgId || '')
                .eq('user_id', memberId);

            if (error) {
                console.error('Error removing member:', error);
                throw error;
            }

            await setOrgMemberCount(params?.orgId || '');

            toast({
                title: 'Success',
                description: 'Member removed successfully!',
                variant: 'default',
            });

            refetch();
        } catch (error) {
            console.error('Error removing member:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove member.',
                variant: 'destructive',
            });
        }
    };

    const handleChangeRole = async () => {
        if (!hasOrganizationPermission(userRole, 'changeRole')) {
            toast({
                title: 'Error',
                description: 'You do not have permission to change roles.',
                variant: 'destructive',
            });
            return;
        }

        if (!activeMemberId || !params?.orgId || !selectedRole) {
            toast({
                title: 'Error',
                description: 'Invalid operation. Please select a role.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ role: selectedRole })
                .eq('organization_id', params.orgId)
                .eq('user_id', activeMemberId);

            if (error) {
                console.error(
                    'Error updating organization member role:',
                    error,
                );
                throw error;
            }

            toast({
                title: 'Success',
                description: `Role updated to ${selectedRole} successfully!`,
                variant: 'default',
            });

            refetch();
            setIsRolePromptOpen(false);
            setActiveMemberId(null);
            setSelectedRole(null);
        } catch (error) {
            console.error('Error changing role:', error);
            toast({
                title: 'Error',
                description: 'Failed to change role. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleAssignToProject = async () => {
        if (!hasOrganizationPermission(userRole, 'assignToProject')) {
            toast({
                title: 'Error',
                description:
                    'You do not have permission to assign members to projects.',
                variant: 'destructive',
            });
            return;
        }

        if (!activeMemberId || !selectedProjectId || !assignRole) {
            setErrorMessage('Please select a project and role.');
            return;
        }

        try {
            const {
                data: existingMember,
                error: checkError,
                status,
            } = await supabase
                .from('project_members')
                .select('id')
                .eq('user_id', activeMemberId)
                .eq('project_id', selectedProjectId)
                .single();

            if (checkError && status !== 406) {
                console.error('Error checking project membership:', checkError);
                throw checkError;
            }

            if (existingMember) {
                setErrorMessage('User is already a part of this project.');
                return;
            }

            await createProjectMember({
                userId: activeMemberId,
                projectId: selectedProjectId,
                role: assignRole,
                orgId: params?.orgId || '',
            });

            toast({
                title: 'Success',
                description: 'User assigned to project successfully!',
                variant: 'default',
            });

            setIsAssignPromptOpen(false);
            setActiveMemberId(null);
            setSelectedProjectId(null);
            setAssignRole(null);
        } catch (error) {
            console.error('Error assigning user to project:', error);
            setErrorMessage('Failed to assign user to project.');
        }
    };

    // Ensure the current user is always at the top of the member list
    const sortedMembers = [...members].sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    });

    // Filter and search functionality
    const filteredMembers = sortedMembers.filter((member) => {
        const matchesSearch =
            member.full_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRoles =
            roleFilters.length === 0 ||
            roleFilters.includes(member.role as OrganizationRole);
        return matchesSearch && matchesRoles;
    });

    return (
        <Card className={className}>
            <CardHeader className="flex flex-col gap-4 pb-2">
                <div>
                    <CardTitle className="text-xl">Members</CardTitle>
                    <CardDescription>
                        Manage organization members
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
                            {ORGANIZATION_ROLE_ARRAY.map((role) => (
                                <DropdownMenuItem
                                    key={role}
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={() =>
                                        setRoleFilters((prev) =>
                                            prev.includes(
                                                role as OrganizationRole,
                                            )
                                                ? prev.filter((r) => r !== role)
                                                : [
                                                      ...prev,
                                                      role as OrganizationRole,
                                                  ],
                                        )
                                    }
                                >
                                    <span
                                        className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                            roleFilters.includes(
                                                role as OrganizationRole,
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
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    </div>
                                </div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
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
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {member.full_name || 'User'}
                                            {member.id === user?.id && ' (you)'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            member.role === 'owner'
                                                ? 'bg-purple-100 text-purple-800'
                                                : member.role === 'admin'
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {member.role}
                                    </span>
                                    {(hasOrganizationPermission(
                                        userRole,
                                        'changeRole',
                                    ) ||
                                        hasOrganizationPermission(
                                            userRole,
                                            'assignToProject',
                                        ) ||
                                        hasOrganizationPermission(
                                            userRole,
                                            'removeMember',
                                        )) &&
                                        member.id !== user?.id && (
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
                                                    {hasOrganizationPermission(
                                                        userRole,
                                                        'changeRole',
                                                    ) && (
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
                                                    )}
                                                    {hasOrganizationPermission(
                                                        userRole,
                                                        'assignToProject',
                                                    ) && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setActiveMemberId(
                                                                    member.id,
                                                                );
                                                                setIsAssignPromptOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            Assign to Project
                                                        </DropdownMenuItem>
                                                    )}
                                                    {hasOrganizationPermission(
                                                        userRole,
                                                        'removeMember',
                                                    ) && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleRemoveMember(
                                                                    member.id,
                                                                )
                                                            }
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
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
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
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border border-gray-300 dark:border-gray-700 rounded-lg">
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
                                        {['member', 'admin'].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() =>
                                                    setSelectedRole(
                                                        role as OrganizationRole,
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
                                onClick={() => {
                                    handleChangeRole();
                                }}
                                disabled={!selectedRole}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isAssignPromptOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 shadow-lg p-6 w-96 border border-gray-300 dark:border-gray-700 rounded-lg">
                        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                            Assign to Project
                        </h3>
                        <div className="space-y-4">
                            {errorMessage && (
                                <div className="text-primary text-sm mb-4">
                                    {errorMessage}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Project
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            {selectedProjectId
                                                ? projects.find(
                                                      (p) =>
                                                          p.id ===
                                                          selectedProjectId,
                                                  )?.name
                                                : 'Choose a project'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {projects.map((project) => (
                                            <DropdownMenuItem
                                                key={project.id}
                                                onClick={() =>
                                                    setSelectedProjectId(
                                                        project.id,
                                                    )
                                                }
                                            >
                                                {project.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Select Role
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-half"
                                        >
                                            {assignRole
                                                ? assignRole
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  assignRole.slice(1)
                                                : 'Choose a role'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {['editor', 'viewer'].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() =>
                                                    setAssignRole(
                                                        role as ProjectRole,
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
                                    setIsAssignPromptOpen(false);
                                    setSelectedProjectId(null);
                                    setAssignRole(null);
                                    setErrorMessage(null); // Clear error message on cancel
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80"
                                onClick={handleAssignToProject}
                                disabled={!selectedProjectId || !assignRole}
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
