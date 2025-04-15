'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import useQuery and useQueryClient

import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
    useCreateOrgMember,
    useSetOrgMemberCount,
} from '@/hooks/mutations/useOrgMemberMutation';
// Import useCreateOrgMember and useSetOrgMemberCount
import { useOrgInvitation } from '@/hooks/queries/useOrganization';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { InvitationStatus } from '@/types/base/enums.types';
import { Invitation } from '@/types/base/invitations.types';

export default function UserInvitations({
    onAccept,
}: {
    onAccept?: () => void;
}) {
    const { user } = useUser();
    const queryClient = useQueryClient(); // Initialize queryClient
    const router = useRouter(); // Initialize router
    const {
        data: allInvitations,
        isLoading,
        refetch,
    } = useOrgInvitation(user?.email || '');
    const { mutateAsync: addOrgMember } = useCreateOrgMember();
    const { mutateAsync: setOrgMemberCount } = useSetOrgMemberCount(); // Initialize useSetOrgMemberCount
    const { toast } = useToast();

    // Filter invitations to only include pending ones
    const invitations = allInvitations?.filter(
        (invitation) => invitation.status === InvitationStatus.pending,
    );

    // Prefetch organization data for all invitations
    const organizationIds =
        invitations?.map((invitation) => invitation.organization_id) || [];
    const { data: organizations } = useQuery({
        queryKey: queryKeys.organizations.list(),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name')
                .in('id', organizationIds);

            if (error) {
                console.error('Error fetching organizations:', error);
                throw error;
            }

            return data.reduce(
                (acc, org) => {
                    acc[org.id] = org.name;
                    return acc;
                },
                {} as Record<string, string>,
            );
        },
        enabled: organizationIds.length > 0,
    });

    const handleAccept = async (invitation: Invitation) => {
        if (!user?.id) {
            toast({
                title: 'Error',
                description: 'User not authenticated.',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Add the user to the organization_members table
            await addOrgMember({
                organization_id: invitation.organization_id,
                user_id: user.id,
                role: invitation.role as
                    | 'member'
                    | 'admin'
                    | 'owner'
                    | 'super_admin'
                    | undefined,
                status: 'active',
                last_active_at: new Date().toISOString(),
            });

            // Update the invitation status to accepted
            const { error } = await supabase
                .from('organization_invitations')
                .update({
                    status: InvitationStatus.accepted,
                    updated_by: user.id,
                })
                .eq('id', invitation.id);

            if (error) {
                console.error('Error accepting invitation:', error);
                throw error;
            }

            // Update the member count for the organization
            await setOrgMemberCount(invitation.organization_id);

            toast({
                title: 'Success',
                description: 'Invitation accepted successfully!',
                variant: 'default',
            });

            // Refresh the invitations and organizations list
            refetch();
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.byMembership(user.id),
            }); // Refresh organizations

            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.list(),
            }); // Refresh the list of organizations

            // Call the onAccept callback if provided
            if (onAccept) {
                onAccept();
            }

            // Navigate to the organization's dashboard page
            router.push(`/org/${invitation.organization_id}`);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            toast({
                title: 'Error',
                description: 'Failed to accept invitation.',
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (invitation: Invitation) => {
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
                .from('organization_invitations')
                .update({
                    status: InvitationStatus.rejected,
                    updated_by: user.id,
                })
                .eq('id', invitation.id);

            if (error) {
                console.error('Error rejecting invitation:', error);
                throw error;
            }

            toast({
                title: 'Success',
                description: 'Invitation rejected successfully!',
                variant: 'default',
            });
            refetch();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            toast({
                title: 'Error',
                description: 'Failed to reject invitation.',
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Incoming Invitations</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Loading invitations...</p>
                ) : invitations?.length ? (
                    <ul className="space-y-2">
                        {invitations.map((invitation) => (
                            <li
                                key={invitation.id}
                                className="flex justify-between items-center"
                            >
                                <span className="font-small">
                                    Invitation to join{' '}
                                    <span className="text-primary">
                                        {organizations?.[
                                            invitation.organization_id
                                        ] || 'Unknown Organization'}
                                    </span>
                                </span>
                                <div className="flex space-x-2">
                                    <Check
                                        className="h-5 w-5 text-primary cursor-pointer"
                                        onClick={() => handleAccept(invitation)}
                                    />
                                    <X
                                        className="h-5 w-5 text-black cursor-pointer"
                                        onClick={() => handleReject(invitation)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-primary font-small ml-2">
                        No pending invitations.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
