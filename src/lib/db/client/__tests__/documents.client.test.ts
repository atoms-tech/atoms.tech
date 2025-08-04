import { mockSupabase } from '@/test-utils/supabase-mock';
import {
    getProjectDocuments,
    getDocumentBlocksAndRequirements,
    getDocumentData,
} from '@/lib/db/client/documents.client';

// Mock the supabase client
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: mockSupabase,
}));

describe('documents.client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProjectDocuments', () => {
        it('should fetch project documents successfully', async () => {
            const mockDocuments = [
                {
                    id: 'doc-1',
                    title: 'Document 1',
                    content: 'Content 1',
                    project_id: 'project-123',
                    is_deleted: false,
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                },
                {
                    id: 'doc-2',
                    title: 'Document 2',
                    content: 'Content 2',
                    project_id: 'project-123',
                    is_deleted: false,
                    created_at: '2023-01-02T00:00:00Z',
                    updated_at: '2023-01-02T00:00:00Z',
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: mockDocuments,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('project-123');

            expect(result).toEqual(mockDocuments);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('documents');
        });

        it('should handle empty project documents', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('project-123');

            expect(result).toEqual([]);
        });

        it('should handle database errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: new Error('Database connection failed'),
                        }),
                    }),
                }),
            });

            await expect(getProjectDocuments('project-123')).rejects.toThrow(
                'Database connection failed'
            );
        });

        it('should filter deleted documents', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            await getProjectDocuments('project-123');

            expect(mockChain.eq).toHaveBeenCalledWith('project_id', 'project-123');
            expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
        });

        it('should handle null project ID', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: [],
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('');

            expect(result).toEqual([]);
        });
    });

    describe('getDocumentBlocksAndRequirements', () => {
        it('should fetch document blocks and requirements successfully', async () => {
            const mockBlocksWithRequirements = [
                {
                    id: 'block-1',
                    type: 'text',
                    content: 'Block content 1',
                    document_id: 'doc-123',
                    is_deleted: false,
                    requirements: [
                        {
                            id: 'req-1',
                            title: 'Requirement 1',
                            document_id: 'doc-123',
                            is_deleted: false,
                        },
                    ],
                },
                {
                    id: 'block-2',
                    type: 'table',
                    content: 'Block content 2',
                    document_id: 'doc-123',
                    is_deleted: false,
                    requirements: [],
                },
            ];

            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: mockBlocksWithRequirements,
                error: null,
            });

            const result = await getDocumentBlocksAndRequirements('doc-123');

            expect(result).toEqual(mockBlocksWithRequirements);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('blocks');
        });

        it('should handle complex query with joins', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            await getDocumentBlocksAndRequirements('doc-123');

            // Check that the select includes the join query
            expect(mockSupabaseInstance.from().select).toHaveBeenCalledWith(
                expect.stringContaining('requirements:requirements(*)')
            );
        });

        it('should filter deleted blocks and requirements', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            await getDocumentBlocksAndRequirements('doc-123');

            expect(mockChain.eq).toHaveBeenCalledWith('document_id', 'doc-123');
            expect(mockChain.eq).toHaveBeenCalledWith('requirements.document_id', 'doc-123');
            expect(mockChain.eq).toHaveBeenCalledWith('requirements.is_deleted', false);
            expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
        });

        it('should handle database errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: new Error('Join query failed'),
                                }),
                            }),
                        }),
                    }),
                }),
            });

            await expect(getDocumentBlocksAndRequirements('doc-123')).rejects.toThrow(
                'Join query failed'
            );
        });

        it('should handle document with no blocks', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            const mockChain = {
                eq: jest.fn().mockReturnThis(),
            };

            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue(mockChain),
            });

            mockChain.eq.mockResolvedValue({
                data: [],
                error: null,
            });

            const result = await getDocumentBlocksAndRequirements('doc-123');

            expect(result).toEqual([]);
        });
    });

    describe('getDocumentData', () => {
        it('should fetch document data successfully', async () => {
            const mockDocument = {
                id: 'doc-123',
                title: 'Test Document',
                content: 'Document content',
                project_id: 'project-123',
                is_deleted: false,
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                slug: 'test-document',
                author_id: 'user-123',
            };

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockDocument,
                                error: null,
                            }),
                        }),
                    }),
                }),
            });

            const result = await getDocumentData('doc-123');

            expect(result).toEqual(mockDocument);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('documents');
        });

        it('should handle document not found', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Document not found'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(getDocumentData('non-existent')).rejects.toThrow(
                'Document not found'
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

            await getDocumentData('doc-123');

            expect(mockChain.single).toHaveBeenCalled();
        });

        it('should filter deleted documents', async () => {
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

            await getDocumentData('doc-123');

            expect(mockChain.eq).toHaveBeenCalledWith('id', 'doc-123');
            expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
        });

        it('should handle database connection errors', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Database connection timeout'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(getDocumentData('doc-123')).rejects.toThrow(
                'Database connection timeout'
            );
        });

        it('should handle empty document ID', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: new Error('Invalid document ID'),
                            }),
                        }),
                    }),
                }),
            });

            await expect(getDocumentData('')).rejects.toThrow('Invalid document ID');
        });
    });

    describe('edge cases', () => {
        it('should handle null data gracefully', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: null,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('project-123');
            expect(result).toBeNull();
        });

        it('should handle malformed response data', async () => {
            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: 'invalid-data',
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('project-123');
            expect(result).toBe('invalid-data');
        });

        it('should handle very large document datasets', async () => {
            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: `doc-${i}`,
                title: `Document ${i}`,
                content: `Content ${i}`,
                project_id: 'project-123',
                is_deleted: false,
            }));

            const mockSupabaseInstance = mockSupabase as any;
            mockSupabaseInstance.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({
                            data: largeDataset,
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await getProjectDocuments('project-123');
            expect(result).toHaveLength(10000);
            expect(result[0]).toEqual(largeDataset[0]);
        });
    });
});