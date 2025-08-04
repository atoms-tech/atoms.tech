import { mockSupabase } from '@/test-utils/supabase-mock';
import {
    getUserProfile,
    getAuthUser,
} from '@/lib/db/client/user.client';

// Mock the supabase client
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: mockSupabase,
}));

describe('user.client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserProfile', () => {
        it('should fetch user profile successfully', async () => {
            const mockProfile = {
                id: 'user-123',
                email: 'user@example.com',
                name: 'John Doe',
                avatar_url: 'https://example.com/avatar.jpg',
                bio: 'Software developer',
                location: 'San Francisco',
                company: 'Tech Corp',
                website: 'https://johndoe.com',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockProfile,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');

            expect(result).toEqual(mockProfile);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('profiles');
        });

        it('should handle user profile not found', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('User profile not found'),
                        }),
                    }),
                }),
            });

            await expect(getUserProfile('non-existent')).rejects.toThrow(
                'User profile not found'
            );
        });

        it('should handle database errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Database connection failed'),
                        }),
                    }),
                }),
            });

            await expect(getUserProfile('user-123')).rejects.toThrow(
                'Database connection failed'
            );
        });

        it('should use single() method for unique results', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            await getUserProfile('user-123');

            expect(mockChain.single).toHaveBeenCalled();
            expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should handle empty user ID', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Invalid user ID'),
                        }),
                    }),
                }),
            });

            await expect(getUserProfile('')).rejects.toThrow('Invalid user ID');
        });

        it('should handle profile with minimal data', async () => {
            const mockMinimalProfile = {
                id: 'user-123',
                email: 'user@example.com',
                name: null,
                avatar_url: null,
                bio: null,
                location: null,
                company: null,
                website: null,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockMinimalProfile,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');

            expect(result).toEqual(mockMinimalProfile);
            expect(result.name).toBeNull();
            expect(result.avatar_url).toBeNull();
            expect(result.bio).toBeNull();
        });

        it('should handle profile with very long bio', async () => {
            const longBio = 'A'.repeat(5000);
            const mockProfileWithLongBio = {
                id: 'user-123',
                email: 'user@example.com',
                name: 'John Doe',
                bio: longBio,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockProfileWithLongBio,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');

            expect(result.bio).toHaveLength(5000);
            expect(result.bio).toBe(longBio);
        });
    });

    describe('getAuthUser', () => {
        it('should fetch authenticated user successfully', async () => {
            const mockAuthUser = {
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    phone: null,
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    last_sign_in_at: '2023-01-01T00:00:00Z',
                    app_metadata: {},
                    user_metadata: {
                        avatar_url: 'https://example.com/avatar.jpg',
                        name: 'John Doe',
                    },
                    aud: 'authenticated',
                    confirmation_sent_at: null,
                    confirmed_at: '2023-01-01T00:00:00Z',
                    email_confirmed_at: '2023-01-01T00:00:00Z',
                    phone_confirmed_at: null,
                    recovery_sent_at: null,
                    role: 'authenticated',
                },
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: mockAuthUser,
                    error: null,
                }),
            };

            const result = await getAuthUser();

            expect(result).toEqual(mockAuthUser);
            expect(mockSupabaseInstance.auth.getUser).toHaveBeenCalled();
        });

        it('should handle authentication errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error('Authentication failed'),
                }),
            };

            await expect(getAuthUser()).rejects.toThrow('Authentication failed');
        });

        it('should handle unauthenticated user', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: null },
                    error: null,
                }),
            };

            const result = await getAuthUser();

            expect(result).toEqual({ user: null });
        });

        it('should handle session expired error', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error('Session expired'),
                }),
            };

            await expect(getAuthUser()).rejects.toThrow('Session expired');
        });

        it('should handle invalid JWT token', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: null,
                    error: new Error('Invalid JWT token'),
                }),
            };

            await expect(getAuthUser()).rejects.toThrow('Invalid JWT token');
        });

        it('should handle network errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockRejectedValue(new Error('Network error')),
            };

            await expect(getAuthUser()).rejects.toThrow('Network error');
        });

        it('should handle user with OAuth provider data', async () => {
            const mockOAuthUser = {
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    app_metadata: {
                        provider: 'github',
                        providers: ['github'],
                    },
                    user_metadata: {
                        avatar_url: 'https://github.com/user/avatar.jpg',
                        name: 'John Doe',
                        user_name: 'johndoe',
                        provider_id: '12345',
                    },
                    identities: [
                        {
                            id: '12345',
                            user_id: 'user-123',
                            provider: 'github',
                            identity_data: {
                                avatar_url: 'https://github.com/user/avatar.jpg',
                                name: 'John Doe',
                                user_name: 'johndoe',
                            },
                        },
                    ],
                },
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: mockOAuthUser,
                    error: null,
                }),
            };

            const result = await getAuthUser();

            expect(result).toEqual(mockOAuthUser);
            expect(result.user.app_metadata.provider).toBe('github');
            expect(result.user.identities).toHaveLength(1);
        });

        it('should handle user with multiple identities', async () => {
            const mockMultiIdentityUser = {
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    app_metadata: {
                        providers: ['github', 'google'],
                    },
                    user_metadata: {
                        avatar_url: 'https://github.com/user/avatar.jpg',
                        name: 'John Doe',
                    },
                    identities: [
                        {
                            id: '12345',
                            user_id: 'user-123',
                            provider: 'github',
                            identity_data: {
                                avatar_url: 'https://github.com/user/avatar.jpg',
                                name: 'John Doe',
                                user_name: 'johndoe',
                            },
                        },
                        {
                            id: '67890',
                            user_id: 'user-123',
                            provider: 'google',
                            identity_data: {
                                avatar_url: 'https://google.com/user/avatar.jpg',
                                name: 'John Doe',
                                email: 'user@example.com',
                            },
                        },
                    ],
                },
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: mockMultiIdentityUser,
                    error: null,
                }),
            };

            const result = await getAuthUser();

            expect(result).toEqual(mockMultiIdentityUser);
            expect(result.user.identities).toHaveLength(2);
            expect(result.user.app_metadata.providers).toContain('github');
            expect(result.user.app_metadata.providers).toContain('google');
        });
    });

    describe('edge cases', () => {
        it('should handle malformed profile data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { invalid: 'data', missing: 'fields' },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');
            expect(result).toEqual({ invalid: 'data', missing: 'fields' });
        });

        it('should handle profile with special characters', async () => {
            const mockProfileWithSpecialChars = {
                id: 'user-123',
                email: 'user+test@example.com',
                name: 'John "Johnny" O\'Doe',
                bio: 'Bio with "quotes" and \'apostrophes\' and <tags>',
                location: 'São Paulo, Brazil',
                company: 'Tech & Co.',
                website: 'https://example.com/user?param=value&other=test',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockProfileWithSpecialChars,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');

            expect(result).toEqual(mockProfileWithSpecialChars);
            expect(result.name).toBe('John "Johnny" O\'Doe');
            expect(result.bio).toContain('<tags>');
        });

        it('should handle null response data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProfile('user-123');
            expect(result).toBeNull();
        });

        it('should handle auth user with null data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            };

            const result = await getAuthUser();
            expect(result).toBeNull();
        });

        it('should handle very large user metadata', async () => {
            const largeMetadata = {
                custom_field: 'X'.repeat(100000),
                preferences: {
                    theme: 'dark',
                    language: 'en',
                    notifications: Array.from({ length: 1000 }, (_, i) => ({
                        id: i,
                        type: 'email',
                        enabled: i % 2 === 0,
                    })),
                },
            };

            const mockAuthUser = {
                user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    user_metadata: largeMetadata,
                },
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.auth = {
                getUser: jest.fn().mockResolvedValue({
                    data: mockAuthUser,
                    error: null,
                }),
            };

            const result = await getAuthUser();

            expect(result).toEqual(mockAuthUser);
            expect(result.user.user_metadata.custom_field).toHaveLength(100000);
            expect(result.user.user_metadata.preferences.notifications).toHaveLength(1000);
        });
    });
});