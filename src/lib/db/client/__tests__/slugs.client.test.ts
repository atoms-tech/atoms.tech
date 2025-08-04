import { mockSupabase } from '@/test-utils/supabase-mock';
import { useEntitySlugs } from '@/lib/db/client/slugs.client';

// Mock the supabase client
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: mockSupabase,
}));

describe('slugs.client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('useEntitySlugs', () => {
        it('should fetch organization slug successfully', async () => {
            const mockOrg = { slug: 'test-org' };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrg,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await useEntitySlugs({ orgId: 'org-123' });

            expect(result).toEqual({ org: 'test-org' });
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
        });

        it('should fetch project slug successfully', async () => {
            const mockProject = { slug: 'test-project' };

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

            const result = await useEntitySlugs({ projectId: 'project-123' });

            expect(result).toEqual({ project: 'test-project' });
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('projects');
        });

        it('should fetch document slug successfully', async () => {
            const mockDocument = { slug: 'test-document' };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockDocument,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await useEntitySlugs({ documentId: 'document-123' });

            expect(result).toEqual({ document: 'test-document' });
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('documents');
        });

        it('should fetch all entity slugs successfully', async () => {
            const mockOrg = { slug: 'test-org' };
            const mockProject = { slug: 'test-project' };
            const mockDocument = { slug: 'test-document' };

            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock sequential calls for each entity
            mockSupabaseInstance.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockOrg,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockProject,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockDocument,
                                error: null,
                            }),
                        }),
                    }),
                });

            const result = await useEntitySlugs({
                orgId: 'org-123',
                projectId: 'project-123',
                documentId: 'document-123',
            });

            expect(result).toEqual({
                org: 'test-org',
                project: 'test-project',
                document: 'test-document',
            });
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('projects');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('documents');
        });

        it('should handle partial parameters', async () => {
            const mockOrg = { slug: 'test-org' };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrg,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await useEntitySlugs({
                orgId: 'org-123',
                // projectId and documentId not provided
            });

            expect(result).toEqual({ org: 'test-org' });
            expect(mockSupabaseInstance.from).toHaveBeenCalledTimes(1);
        });

        it('should handle empty parameters', async () => {
            const result = await useEntitySlugs({});

            expect(result).toEqual({});
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('should handle null organization data', async () => {
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

            const result = await useEntitySlugs({ orgId: 'org-123' });

            expect(result).toEqual({});
        });

        it('should handle null project data', async () => {
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

            const result = await useEntitySlugs({ projectId: 'project-123' });

            expect(result).toEqual({});
        });

        it('should handle null document data', async () => {
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

            const result = await useEntitySlugs({ documentId: 'document-123' });

            expect(result).toEqual({});
        });

        it('should handle database errors gracefully', async () => {
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

            // Function should not throw, but should handle error gracefully
            const result = await useEntitySlugs({ orgId: 'org-123' });

            expect(result).toEqual({});
        });

        it('should handle mixed success and failure cases', async () => {
            const mockOrg = { slug: 'test-org' };

            const mockSupabaseInstance = mockSupabase as any;
            
            // Mock org query success
            mockSupabaseInstance.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockOrg,
                                error: null,
                            }),
                        }),
                    }),
                })
                // Mock project query failure
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Project not found'),
                            }),
                        }),
                    }),
                });

            const result = await useEntitySlugs({
                orgId: 'org-123',
                projectId: 'project-123',
            });

            expect(result).toEqual({ org: 'test-org' });
        });

        it('should handle empty string IDs', async () => {
            const result = await useEntitySlugs({
                orgId: '',
                projectId: '',
                documentId: '',
            });

            expect(result).toEqual({});
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('should handle undefined IDs', async () => {
            const result = await useEntitySlugs({
                orgId: undefined,
                projectId: undefined,
                documentId: undefined,
            });

            expect(result).toEqual({});
            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('should query correct tables with correct IDs', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { slug: 'test-slug' },
                    error: null,
                }),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            await useEntitySlugs({ orgId: 'org-123' });

            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('organizations');
            expect(mockChain.eq).toHaveBeenCalledWith('id', 'org-123');
        });

        it('should handle slugs with special characters', async () => {
            const mockOrg = { slug: 'test-org_with-special.chars' };
            const mockProject = { slug: 'project-with-123-numbers' };
            const mockDocument = { slug: 'document.with.dots' };

            const mockSupabaseInstance = mockSupabase as any;
            
            mockSupabaseInstance.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockOrg,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockProject,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockDocument,
                                error: null,
                            }),
                        }),
                    }),
                });

            const result = await useEntitySlugs({
                orgId: 'org-123',
                projectId: 'project-123',
                documentId: 'document-123',
            });

            expect(result).toEqual({
                org: 'test-org_with-special.chars',
                project: 'project-with-123-numbers',
                document: 'document.with.dots',
            });
        });

        it('should handle very long slugs', async () => {
            const longSlug = 'very-long-slug-' + 'x'.repeat(1000);
            const mockOrg = { slug: longSlug };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockOrg,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await useEntitySlugs({ orgId: 'org-123' });

            expect(result).toEqual({ org: longSlug });
            expect(result.org).toHaveLength(1015);
        });

        it('should handle concurrent queries for multiple entities', async () => {
            const mockOrg = { slug: 'test-org' };
            const mockProject = { slug: 'test-project' };
            const mockDocument = { slug: 'test-document' };

            const mockSupabaseInstance = mockSupabase as any;
            
            // All queries should be made concurrently
            mockSupabaseInstance.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockOrg,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockProject,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockDocument,
                                error: null,
                            }),
                        }),
                    }),
                });

            const startTime = Date.now();
            const result = await useEntitySlugs({
                orgId: 'org-123',
                projectId: 'project-123',
                documentId: 'document-123',
            });
            const endTime = Date.now();

            expect(result).toEqual({
                org: 'test-org',
                project: 'test-project',
                document: 'test-document',
            });
            // Should execute quickly since queries are concurrent
            expect(endTime - startTime).toBeLessThan(100);
        });
    });
});