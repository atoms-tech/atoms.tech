'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useOrgInvitation } from '@/hooks/queries/useOrganization';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useUser } from '@/lib/providers/user.provider';
import { InvitationStatus } from '@/types/base/enums.types';
import { Invitation } from '@/types/base/invitations.types';

export default function UserInvitations({ onAccept }: { onAccept?: () => void }) {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const router = useRouter();
    const {
        data: allInvitations,
        isLoading,
        refetch,
    } = useOrgInvitation(user?.email || '');
    const { toast } = useToast();

    // Filter invitations to only include pending ones
    const invitations = allInvitations?.filter(
        (invitation: Invitation) => invitation.status === InvitationStatus.pending,
    );

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
            // Call the new API route to accept invitation
            const response = await fetch(`/api/invitations/${invitation.id}/accept`, {
                method: 'POST',
                cache: 'no-store',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            const result = await response.json();

            toast({
                title: 'Success',
                description: `Invitation accepted! Added to ${result.projects_added} project(s).`,
                variant: 'default',
            });

            // Refresh the invitations and organizations list
            refetch();
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.byMembership(user.id),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.list(),
            });

            // Call the onAccept callback after the render cycle
            if (onAccept) {
                setTimeout(() => onAccept(), 0);
            }

            // Navigate to the organization's dashboard page
            router.push(`/org/${invitation.organization_id}`);
        } catch (error) {
            console.error('Error accepting invitation:', error);
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to accept invitation.',
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
            const response = await fetch(
                `/api/user/invitations/${invitation.id}/reject`,
                {
                    method: 'POST',
                    cache: 'no-store',
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject invitation');
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
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to reject invitation.',
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
                        {invitations.map((invitation: Invitation) => (
                            <li
                                key={invitation.id}
                                className="flex justify-between items-center"
                            >
                                <span className="font-small">
                                    Invitation to join{' '}
                                    <span className="text-primary">
                                        {invitation.organizations?.name ||
                                            'Unknown Organization'}
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
