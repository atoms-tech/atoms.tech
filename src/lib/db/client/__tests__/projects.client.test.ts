import { mockSupabase } from '@/test-utils/supabase-mock';
import {
    getProjectBySlug,
    getUserProjects,
    getProjectMembers,
} from '@/lib/db/client/projects.client';

// Mock the supabase client
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: mockSupabase,
}));

describe('projects.client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProjectBySlug', () => {
        it('should fetch project by slug successfully', async () => {
            const mockProject = {
                id: 'project-123',
                name: 'Test Project',
                description: 'A test project',
                slug: 'test-project',
                org_id: 'org-123',
                is_deleted: false,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockProject,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectBySlug('test-project');

            expect(result).toEqual(mockProject);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('projects');
        });

        it('should handle project not found by slug', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Project not found'),
                        }),
                    }),
                }),
            });

            await expect(getProjectBySlug('non-existent')).rejects.toThrow(
                'Project not found'
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

            await expect(getProjectBySlug('test-project')).rejects.toThrow(
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

            await getProjectBySlug('test-project');

            expect(mockChain.single).toHaveBeenCalled();
            expect(mockChain.eq).toHaveBeenCalledWith('slug', 'test-project');
        });

        it('should handle empty slug', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Invalid slug'),
                        }),
                    }),
                }),
            });

            await expect(getProjectBySlug('')).rejects.toThrow('Invalid slug');
        });
    });

    describe('getUserProjects', () => {
        it('should fetch user projects successfully', async () => {
            const mockProjectMembers = [
                { project_id: 'project-1' },
                { project_id: 'project-2' },
            ];

            const mockProjects = [
                {
                    id: 'project-1',
                    name: 'Project 1',
                    slug: 'project-1',
                    org_id: 'org-123',
                    is_deleted: false,
                },
                {
                    id: 'project-2',
                    name: 'Project 2',
                    slug: 'project-2',
                    org_id: 'org-123',
                    is_deleted: false,
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock the first call to project_members
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({
                                data: mockProjectMembers,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            // Mock the second call to projects
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({
                            data: mockProjects,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProjects('user-123', 'org-123');

            expect(result).toEqual(mockProjects);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('project_members');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('projects');
        });

        it('should handle user with no project memberships', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock empty project_members result
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({
                                data: [],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            // Mock projects query with empty array
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getUserProjects('user-123', 'org-123');

            expect(result).toEqual([]);
        });

        it('should handle project_members query errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Members query failed'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(getUserProjects('user-123', 'org-123')).rejects.toThrow(
                'Members query failed'
            );
        });

        it('should handle projects query errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock successful project_members query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({
                                data: [{ project_id: 'project-1' }],
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            // Mock failed projects query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        in: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Projects query failed'),
                        }),
                    }),
                }),
            });

            await expect(getUserProjects('user-123', 'org-123')).rejects.toThrow(
                'Projects query failed'
            );
        });

        it('should filter active memberships and non-deleted projects', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            const mockChain1 = {
                eq: jest.fn().mockReturnThis(),
            };

            const mockChain2 = {
                eq: jest.fn().mockReturnThis(),
                in: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                }),
            };

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue(mockChain1),
            });

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue(mockChain2),
            });

            mockChain1.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            await getUserProjects('user-123', 'org-123');

            expect(mockChain1.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(mockChain1.eq).toHaveBeenCalledWith('org_id', 'org-123');
            expect(mockChain1.eq).toHaveBeenCalledWith('status', 'active');
            expect(mockChain2.eq).toHaveBeenCalledWith('is_deleted', false);
        });
    });

    describe('getProjectMembers', () => {
        it('should fetch project members with profiles successfully', async () => {
            const mockMembers = [
                { user_id: 'user-1', role: 'admin' },
                { user_id: 'user-2', role: 'member' },
            ];

            const mockProfiles = [
                {
                    id: 'user-1',
                    name: 'User 1',
                    email: 'user1@example.com',
                    avatar_url: 'https://example.com/avatar1.jpg',
                },
                {
                    id: 'user-2',
                    name: 'User 2',
                    email: 'user2@example.com',
                    avatar_url: 'https://example.com/avatar2.jpg',
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock project_members query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: mockMembers,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock profiles query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                        data: mockProfiles,
                        error: null,
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');

            expect(result).toEqual([
                { ...mockProfiles[0], role: 'admin' },
                { ...mockProfiles[1], role: 'member' },
            ]);
        });

        it('should handle project with no members', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');

            expect(result).toEqual([]);
        });

        it('should handle null members data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');

            expect(result).toEqual([]);
        });

        it('should handle project_members query errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Members query failed'),
                        }),
                    }),
                }),
            });

            await expect(getProjectMembers('project-123')).rejects.toThrow(
                'Members query failed'
            );
        });

        it('should handle profiles query errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock successful members query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [{ user_id: 'user-1', role: 'admin' }],
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock failed profiles query
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                        data: null,
                        error: new Error('Profiles query failed'),
                    }),
                }),
            });

            await expect(getProjectMembers('project-123')).rejects.toThrow(
                'Profiles query failed'
            );
        });

        it('should filter active memberships only', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            await getProjectMembers('project-123');

            expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-123');
            expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
        });

        it('should correctly map roles to profiles', async () => {
            const mockMembers = [
                { user_id: 'user-1', role: 'owner' },
                { user_id: 'user-2', role: 'admin' },
                { user_id: 'user-3', role: 'member' },
            ];

            const mockProfiles = [
                { id: 'user-1', name: 'Owner User' },
                { id: 'user-2', name: 'Admin User' },
                { id: 'user-3', name: 'Member User' },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: mockMembers,
                            error: null,
                        }),
                    }),
                }),
            });

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                        data: mockProfiles,
                        error: null,
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');

            expect(result).toEqual([
                { id: 'user-1', name: 'Owner User', role: 'owner' },
                { id: 'user-2', name: 'Admin User', role: 'admin' },
                { id: 'user-3', name: 'Member User', role: 'member' },
            ]);
        });
    });

    describe('edge cases', () => {
        it('should handle malformed project data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { invalid: 'data' },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectBySlug('test-project');
            expect(result).toEqual({ invalid: 'data' });
        });

        it('should handle large member lists', async () => {
            const largeMemberList = Array.from({ length: 1000 }, (_, i) => ({
                user_id: `user-${i}`,
                role: i % 3 === 0 ? 'admin' : 'member',
            }));

            const largeProfileList = Array.from({ length: 1000 }, (_, i) => ({
                id: `user-${i}`,
                name: `User ${i}`,
                email: `user${i}@example.com`,
            }));

            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: largeMemberList,
                            error: null,
                        }),
                    }),
                }),
            });

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                        data: largeProfileList,
                        error: null,
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');
            expect(result).toHaveLength(1000);
            expect(result[0]).toHaveProperty('role');
        });

        it('should handle partial profile data', async () => {
            const mockMembers = [
                { user_id: 'user-1', role: 'admin' },
                { user_id: 'user-2', role: 'member' },
            ];

            const mockProfiles = [
                { id: 'user-1', name: 'User 1' }, // Missing some fields
            ];

            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: mockMembers,
                            error: null,
                        }),
                    }),
                }),
            });

            mockSupabaseInstance.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    in: jest.fn().mockResolvedValue({
                        data: mockProfiles,
                        error: null,
                    }),
                }),
            });

            const result = await getProjectMembers('project-123');
            expect(result).toEqual([
                { id: 'user-1', name: 'User 1', role: 'admin' },
            ]);
        });
    });
});