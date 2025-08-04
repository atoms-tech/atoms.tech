import { mockSupabase } from '@/test-utils/supabase-mock';
import {
    createOrganization,
    getOrganizationById,
    getOrganizationsByUserId,
    updateOrganization,
    deleteOrganization,
    getOrganizationMembers,
    inviteUserToOrganization,
    removeUserFromOrganization,
    updateMemberRole,
    getOrganizationInvitations,
    acceptOrganizationInvitation,
    rejectOrganizationInvitation,
    getOrganizationSettings,
    updateOrganizationSettings,
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    OrganizationSettings,
} from '@/lib/db/client/organizations.client';

// Mock the supabase client
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: mockSupabase,
}));

describe('organizations.client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrganization', () => {
        it('should create an organization successfully', async () => {
            const mockOrganization: Organization = {
                id: 'org-123',
                name: 'Test Organization',
                description: 'A test organization',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'test-organization',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrganization,
                            error: null,
                        }),
                    }),
                }),
            });

            const organizationData = {
                name: 'Test Organization',
                description: 'A test organization',
                owner_id: 'user-123',
            };

            const result = await createOrganization(organizationData);

            expect(result).toEqual(mockOrganization);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should handle creation errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Organization creation failed'),
                        }),
                    }),
                }),
            });

            const organizationData = {
                name: 'Test Organization',
                description: 'A test organization',
                owner_id: 'user-123',
            };

            await expect(createOrganization(organizationData)).rejects.toThrow(
                'Organization creation failed'
            );
        });

        it('should handle creation with minimal data', async () => {
            const mockOrganization: Organization = {
                id: 'org-123',
                name: 'Minimal Org',
                description: null,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'minimal-org',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrganization,
                            error: null,
                        }),
                    }),
                }),
            });

            const organizationData = {
                name: 'Minimal Org',
                owner_id: 'user-123',
            };

            const result = await createOrganization(organizationData);

            expect(result).toEqual(mockOrganization);
        });
    });

    describe('getOrganizationById', () => {
        it('should get an organization by ID successfully', async () => {
            const mockOrganization: Organization = {
                id: 'org-123',
                name: 'Test Organization',
                description: 'A test organization',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'test-organization',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrganization,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationById('org-123');

            expect(result).toEqual(mockOrganization);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should handle organization not found', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Organization not found'),
                        }),
                    }),
                }),
            });

            await expect(getOrganizationById('non-existent')).rejects.toThrow(
                'Organization not found'
            );
        });

        it('should handle empty organization ID', async () => {
            await expect(getOrganizationById('')).rejects.toThrow();
        });
    });

    describe('getOrganizationsByUserId', () => {
        it('should get organizations for a user successfully', async () => {
            const mockOrganizations: Organization[] = [
                {
                    id: 'org-123',
                    name: 'Organization 1',
                    description: 'First organization',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    owner_id: 'user-123',
                    settings: {},
                    slug: 'organization-1',
                    logo_url: null,
                    website_url: null,
                    is_active: true,
                },
                {
                    id: 'org-456',
                    name: 'Organization 2',
                    description: 'Second organization',
                    created_at: '2023-01-02T00:00:00Z',
                    updated_at: '2023-01-02T00:00:00Z',
                    owner_id: 'user-123',
                    settings: {},
                    slug: 'organization-2',
                    logo_url: null,
                    website_url: null,
                    is_active: true,
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockOrganizations,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationsByUserId('user-123');

            expect(result).toEqual(mockOrganizations);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should handle user with no organizations', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationsByUserId('user-123');

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Database connection failed'),
                        }),
                    }),
                }),
            });

            await expect(getOrganizationsByUserId('user-123')).rejects.toThrow(
                'Database connection failed'
            );
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization successfully', async () => {
            const mockUpdatedOrganization: Organization = {
                id: 'org-123',
                name: 'Updated Organization',
                description: 'Updated description',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'updated-organization',
                logo_url: 'https://example.com/logo.png',
                website_url: 'https://example.com',
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockUpdatedOrganization,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const updateData = {
                name: 'Updated Organization',
                description: 'Updated description',
                logo_url: 'https://example.com/logo.png',
                website_url: 'https://example.com',
            };

            const result = await updateOrganization('org-123', updateData);

            expect(result).toEqual(mockUpdatedOrganization);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should handle partial updates', async () => {
            const mockUpdatedOrganization: Organization = {
                id: 'org-123',
                name: 'Updated Name Only',
                description: 'Original description',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'updated-name-only',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockUpdatedOrganization,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const updateData = {
                name: 'Updated Name Only',
            };

            const result = await updateOrganization('org-123', updateData);

            expect(result).toEqual(mockUpdatedOrganization);
        });

        it('should handle update errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Update failed'),
                            }),
                        }),
                    }),
                }),
            });

            const updateData = {
                name: 'Updated Organization',
            };

            await expect(updateOrganization('org-123', updateData)).rejects.toThrow(
                'Update failed'
            );
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization successfully', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            });

            await deleteOrganization('org-123');

            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should handle deletion errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: new Error('Deletion failed'),
                    }),
                }),
            });

            await expect(deleteOrganization('org-123')).rejects.toThrow(
                'Deletion failed'
            );
        });
    });

    describe('getOrganizationMembers', () => {
        it('should get organization members successfully', async () => {
            const mockMembers: OrganizationMember[] = [
                {
                    id: 'member-123',
                    organization_id: 'org-123',
                    user_id: 'user-123',
                    role: 'owner',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                },
                {
                    id: 'member-456',
                    organization_id: 'org-123',
                    user_id: 'user-456',
                    role: 'member',
                    created_at: '2023-01-02T00:00:00Z',
                    updated_at: '2023-01-02T00:00:00Z',
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockMembers,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationMembers('org-123');

            expect(result).toEqual(mockMembers);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_members');
        });

        it('should handle organization with no members', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationMembers('org-123');

            expect(result).toEqual([]);
        });
    });

    describe('inviteUserToOrganization', () => {
        it('should invite a user to organization successfully', async () => {
            const mockInvitation: OrganizationInvitation = {
                id: 'invitation-123',
                organization_id: 'org-123',
                inviter_id: 'user-123',
                invitee_email: 'test@example.com',
                role: 'member',
                status: 'pending',
                expires_at: '2023-01-08T00:00:00Z',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockInvitation,
                            error: null,
                        }),
                    }),
                }),
            });

            const invitationData = {
                organization_id: 'org-123',
                inviter_id: 'user-123',
                invitee_email: 'test@example.com',
                role: 'member' as const,
            };

            const result = await inviteUserToOrganization(invitationData);

            expect(result).toEqual(mockInvitation);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_invitations');
        });

        it('should handle invitation errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Invitation failed'),
                        }),
                    }),
                }),
            });

            const invitationData = {
                organization_id: 'org-123',
                inviter_id: 'user-123',
                invitee_email: 'test@example.com',
                role: 'member' as const,
            };

            await expect(inviteUserToOrganization(invitationData)).rejects.toThrow(
                'Invitation failed'
            );
        });
    });

    describe('removeUserFromOrganization', () => {
        it('should remove a user from organization successfully', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            error: null,
                        }),
                    }),
                }),
            });

            await removeUserFromOrganization('org-123', 'user-456');

            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_members');
        });

        it('should handle removal errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            error: new Error('Removal failed'),
                        }),
                    }),
                }),
            });

            await expect(removeUserFromOrganization('org-123', 'user-456')).rejects.toThrow(
                'Removal failed'
            );
        });
    });

    describe('updateMemberRole', () => {
        it('should update member role successfully', async () => {
            const mockUpdatedMember: OrganizationMember = {
                id: 'member-456',
                organization_id: 'org-123',
                user_id: 'user-456',
                role: 'admin',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: mockUpdatedMember,
                                    error: null,
                                }),
                            }),
                        }),
                    }),
                }),
            });

            const result = await updateMemberRole('org-123', 'user-456', 'admin');

            expect(result).toEqual(mockUpdatedMember);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_members');
        });

        it('should handle role update errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: new Error('Role update failed'),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            await expect(updateMemberRole('org-123', 'user-456', 'admin')).rejects.toThrow(
                'Role update failed'
            );
        });
    });

    describe('getOrganizationInvitations', () => {
        it('should get organization invitations successfully', async () => {
            const mockInvitations: OrganizationInvitation[] = [
                {
                    id: 'invitation-123',
                    organization_id: 'org-123',
                    inviter_id: 'user-123',
                    invitee_email: 'test1@example.com',
                    role: 'member',
                    status: 'pending',
                    expires_at: '2023-01-08T00:00:00Z',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                },
                {
                    id: 'invitation-456',
                    organization_id: 'org-123',
                    inviter_id: 'user-123',
                    invitee_email: 'test2@example.com',
                    role: 'admin',
                    status: 'accepted',
                    expires_at: '2023-01-08T00:00:00Z',
                    created_at: '2023-01-02T00:00:00Z',
                    updated_at: '2023-01-02T00:00:00Z',
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockInvitations,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationInvitations('org-123');

            expect(result).toEqual(mockInvitations);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_invitations');
        });

        it('should handle organization with no invitations', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationInvitations('org-123');

            expect(result).toEqual([]);
        });
    });

    describe('acceptOrganizationInvitation', () => {
        it('should accept invitation successfully', async () => {
            const mockAcceptedInvitation: OrganizationInvitation = {
                id: 'invitation-123',
                organization_id: 'org-123',
                inviter_id: 'user-123',
                invitee_email: 'test@example.com',
                role: 'member',
                status: 'accepted',
                expires_at: '2023-01-08T00:00:00Z',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockAcceptedInvitation,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await acceptOrganizationInvitation('invitation-123');

            expect(result).toEqual(mockAcceptedInvitation);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_invitations');
        });

        it('should handle invitation acceptance errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Invitation acceptance failed'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(acceptOrganizationInvitation('invitation-123')).rejects.toThrow(
                'Invitation acceptance failed'
            );
        });
    });

    describe('rejectOrganizationInvitation', () => {
        it('should reject invitation successfully', async () => {
            const mockRejectedInvitation: OrganizationInvitation = {
                id: 'invitation-123',
                organization_id: 'org-123',
                inviter_id: 'user-123',
                invitee_email: 'test@example.com',
                role: 'member',
                status: 'rejected',
                expires_at: '2023-01-08T00:00:00Z',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockRejectedInvitation,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await rejectOrganizationInvitation('invitation-123');

            expect(result).toEqual(mockRejectedInvitation);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_invitations');
        });

        it('should handle invitation rejection errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Invitation rejection failed'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(rejectOrganizationInvitation('invitation-123')).rejects.toThrow(
                'Invitation rejection failed'
            );
        });
    });

    describe('getOrganizationSettings', () => {
        it('should get organization settings successfully', async () => {
            const mockSettings: OrganizationSettings = {
                id: 'settings-123',
                organization_id: 'org-123',
                theme: 'dark',
                language: 'en',
                timezone: 'UTC',
                notifications: {
                    email: true,
                    push: false,
                    sms: false,
                },
                features: {
                    advanced_analytics: true,
                    api_access: true,
                    custom_branding: false,
                },
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockSettings,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationSettings('org-123');

            expect(result).toEqual(mockSettings);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_settings');
        });

        it('should handle settings not found', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Settings not found'),
                        }),
                    }),
                }),
            });

            await expect(getOrganizationSettings('org-123')).rejects.toThrow(
                'Settings not found'
            );
        });
    });

    describe('updateOrganizationSettings', () => {
        it('should update organization settings successfully', async () => {
            const mockUpdatedSettings: OrganizationSettings = {
                id: 'settings-123',
                organization_id: 'org-123',
                theme: 'light',
                language: 'es',
                timezone: 'EST',
                notifications: {
                    email: false,
                    push: true,
                    sms: true,
                },
                features: {
                    advanced_analytics: true,
                    api_access: true,
                    custom_branding: true,
                },
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T01:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockUpdatedSettings,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const updateData = {
                theme: 'light' as const,
                language: 'es',
                timezone: 'EST',
                notifications: {
                    email: false,
                    push: true,
                    sms: true,
                },
                features: {
                    advanced_analytics: true,
                    api_access: true,
                    custom_branding: true,
                },
            };

            const result = await updateOrganizationSettings('org-123', updateData);

            expect(result).toEqual(mockUpdatedSettings);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organization_settings');
        });

        it('should handle settings update errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Settings update failed'),
                            }),
                        }),
                    }),
                }),
            });

            const updateData = {
                theme: 'light' as const,
            };

            await expect(updateOrganizationSettings('org-123', updateData)).rejects.toThrow(
                'Settings update failed'
            );
        });
    });

    describe('edge cases', () => {
        it('should handle null and undefined values gracefully', async () => {
            const mockOrganization: Organization = {
                id: 'org-123',
                name: 'Test Organization',
                description: null,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                owner_id: 'user-123',
                settings: null,
                slug: 'test-organization',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrganization,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationById('org-123');

            expect(result).toEqual(mockOrganization);
            expect(result.description).toBeNull();
            expect(result.settings).toBeNull();
            expect(result.logo_url).toBeNull();
            expect(result.website_url).toBeNull();
        });

        it('should handle empty arrays in responses', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getOrganizationsByUserId('user-123');

            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle very long string values', async () => {
            const longDescription = 'A'.repeat(10000);
            const mockOrganization: Organization = {
                id: 'org-123',
                name: 'Test Organization',
                description: longDescription,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                owner_id: 'user-123',
                settings: {},
                slug: 'test-organization',
                logo_url: null,
                website_url: null,
                is_active: true,
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrganization,
                            error: null,
                        }),
                    }),
                }),
            });

            const organizationData = {
                name: 'Test Organization',
                description: longDescription,
                owner_id: 'user-123',
            };

            const result = await createOrganization(organizationData);

            expect(result).toEqual(mockOrganization);
            expect(result.description).toHaveLength(10000);
        });
    });
});