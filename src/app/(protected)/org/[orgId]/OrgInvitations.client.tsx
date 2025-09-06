'use client';

import { X } from 'lucide-react'; // Import X icon
import { useState } from 'react';

import { Badge } from '@/components/ui/badge'; // Import Badge
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateOrgInvitation } from '@/hooks/mutations/useOrgInvitationMutations';
import { useOrgInvitationsByOrgId } from '@/hooks/queries/useOrganization';
import { atomsApiClient } from '@/lib/atoms-api';
import { useUser } from '@/lib/providers/user.provider';
import { InvitationStatus } from '@/types/base/enums.types';

interface OrgInvitationsProps {
    orgId: string;
}

export default function OrgInvitations({ orgId }: OrgInvitationsProps) {
    const [inviteEmail, setInviteEmail] = useState('');
    const [, setUserExists] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // Track error messages
    const { user } = useUser();
    const { mutateAsync: createInvitation, isPending } = useCreateOrgInvitation();
    const {
        data: allInvitations,
        isLoading: outgoingLoading,
        refetch,
    } = useOrgInvitationsByOrgId(orgId);

    // Filter invitations to only include pending ones
    const outgoingInvitations = allInvitations?.filter(
        (invitation) => invitation.status === InvitationStatus.pending,
    );

    const handleInvite = async () => {
        setErrorMessage(null); // Reset error message

        if (!inviteEmail) {
            setErrorMessage('Please enter a valid email.');
            return;
        }
        if (!user?.id) {
            setErrorMessage('User not authenticated.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.trim())) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        if (inviteEmail.trim() === user.email) {
            setErrorMessage('You cannot send an invitation to yourself.');
            return;
        }

        try {
            // Check if the user is already a member of the organization
            const api = atomsApiClient();
            const members = await api.organizations.listMembers(orgId);
            const isAlreadyMember = members.some(
                (member) => member.profiles?.email === inviteEmail.trim(),
            );

            if (isAlreadyMember) {
                setErrorMessage('This user is already a member of the organization.');
                return;
            }

            // Check if the email exists in the profiles table
            const profile = await api.auth.getByEmail(inviteEmail.trim());
            if (!profile) {
                setErrorMessage(
                    'This email does not belong to any user. Please ask the user to sign up first.',
                );
                setUserExists(false); // User does not exist
                return;
            }

            setUserExists(true); // User exists

            // Check for duplicate invitations
            const invitesInOrg = await api.orgInvitations.listByOrganization(orgId);
            const duplicateInvitations = invitesInOrg.filter(
                (inv: any) =>
                    inv.email === inviteEmail.trim() &&
                    inv.status === InvitationStatus.pending,
            );

            if (duplicateInvitations && duplicateInvitations.length > 0) {
                setErrorMessage(
                    'An invitation has already been sent to this email for this organization.',
                );
                return;
            }

            // Create the invitation
            await createInvitation(
                {
                    email: inviteEmail.trim(),
                    role: 'member',
                    status: InvitationStatus.pending,
                    created_by: user.id,
                    organization_id: orgId,
                    updated_by: user.id,
                },
                {
                    onSuccess: () => {
                        setInviteEmail('');
                        setErrorMessage(null); // Reset error message
                        setUserExists(null); // Reset user existence state
                        refetch(); // Refresh outgoing invitations
                    },
                    onError: (error) => {
                        console.error('Error sending invitation:', error);
                        setErrorMessage('Failed to send invitation.');
                    },
                },
            );
        } catch (error) {
            console.error('Error handling invitation:', error);
            setErrorMessage('Failed to process the invitation.');
        }
    };

    const handleRevoke = async (invitationId: string) => {
        if (!user?.id) {
            setErrorMessage('User not authenticated.');
            return;
        }

        try {
            const api = atomsApiClient();
            await api.orgInvitations.updateStatus(
                invitationId,
                InvitationStatus.revoked,
                user.id,
            );

            setErrorMessage(null); // Clear error message on success
            refetch(); // Refresh the list of outgoing invitations
        } catch (error) {
            console.error('Error revoking invitation:', error);
            setErrorMessage('Failed to revoke invitation.');
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Invite Users Section */}
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Invite Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col space-y-4">
                            <div className="flex space-x-4">
                                <Input
                                    type="email"
                                    placeholder="Enter user email"
                                    value={inviteEmail}
                                    onChange={(e) => {
                                        setInviteEmail(e.target.value);
                                        setErrorMessage(null); // Reset error message on input change
                                        setUserExists(null); // Reset user existence state on input change
                                    }}
                                />
                                <Button onClick={handleInvite} disabled={isPending}>
                                    Invite
                                </Button>
                            </div>
                            <div>
                                {errorMessage && (
                                    <p className="text-primary text-sm">{errorMessage}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Outgoing Invitations Section */}
            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Outgoing Invitations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {errorMessage && (
                            <div className="text-red-600 text-sm mb-4">
                                {errorMessage}
                            </div>
                        )}
                        {outgoingLoading ? (
                            <p>Loading outgoing invitations...</p>
                        ) : outgoingInvitations?.length ? (
                            <ul className="space-y-2">
                                {outgoingInvitations.map((invitation) => (
                                    <li
                                        key={invitation.id}
                                        className="flex justify-between items-center rounded-md p-3"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>{invitation.email}</span>
                                            <Badge
                                                variant="outline"
                                                className="border-gray-300 text-gray-500"
                                            >
                                                {invitation.status}
                                            </Badge>
                                        </div>
                                        {invitation.status ===
                                            InvitationStatus.pending && (
                                            <X
                                                className="h-5 w-5 text-accent cursor-pointer"
                                                onClick={() =>
                                                    handleRevoke(invitation.id)
                                                }
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-primary font-small ml-2">
                                No outgoing invitations
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
