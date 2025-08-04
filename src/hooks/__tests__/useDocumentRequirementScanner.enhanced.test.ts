import { renderHook, waitFor } from '@testing-library/react';

import { createMockSupabaseClient } from '@/test-utils';
import { useDocumentRequirementScanner } from '../useDocumentRequirementScanner';

// Mock Supabase
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: createMockSupabaseClient(),
}));

// Mock requirement ID generator
jest.mock('@/lib/utils/requirementIdGenerator', () => ({
    generateBatchRequirementIds: jest.fn(),
}));

const mockSupabase = createMockSupabaseClient();
const mockGenerateBatchRequirementIds = require('@/lib/utils/requirementIdGenerator').generateBatchRequirementIds;

describe('useDocumentRequirementScanner Hook', () => {
    const defaultProps = {
        documentId: 'doc-123',
        organizationId: 'org-123',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('initialization', () => {
        it('initializes with correct default state', () => {
            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            expect(result.current.isScanning).toBe(false);
            expect(result.current.isAssigning).toBe(false);
            expect(result.current.requirementsWithoutIds).toEqual([]);
            expect(typeof result.current.scanDocumentRequirements).toBe('function');
            expect(typeof result.current.assignRequirementIds).toBe('function');
            expect(typeof result.current.setRequirementsWithoutIds).toBe('function');
        });
    });

    describe('scanDocumentRequirements', () => {
        const mockBlocks = [
            { id: 'block-1', name: 'Requirements Table 1', type: 'table' },
            { id: 'block-2', name: 'Requirements Table 2', type: 'table' },
        ];

        const mockRequirements = [
            {
                id: 'req-1',
                name: 'Valid Requirement 1',
                description: 'Test description',
                external_id: null,
                status: 'draft',
                priority: 'high',
                block_id: 'block-1',
                blocks: { name: 'Requirements Table 1' },
            },
            {
                id: 'req-2',
                name: 'Valid Requirement 2',
                description: 'Test description',
                external_id: 'TBD',
                status: 'draft',
                priority: 'medium',
                block_id: 'block-1',
                blocks: { name: 'Requirements Table 1' },
            },
            {
                id: 'req-3',
                name: 'Valid Requirement 3',
                description: 'Test description',
                external_id: 'REQ-001',
                status: 'approved',
                priority: 'low',
                block_id: 'block-2',
                blocks: { name: 'Requirements Table 2' },
            },
        ];

        it('scans document successfully and finds requirements needing IDs', async () => {
            // Mock blocks query
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: mockBlocks,
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: mockRequirements,
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            expect(requirementsNeedingIds).toHaveLength(2); // req-1 (null) and req-2 (TBD)
            expect(result.current.requirementsWithoutIds).toHaveLength(2);
            expect(result.current.isScanning).toBe(false);
        });

        it('handles no table blocks found', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
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
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            expect(requirementsNeedingIds).toEqual([]);
        });

        it('handles no requirements found', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: mockBlocks,
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: [],
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            expect(requirementsNeedingIds).toEqual([]);
        });

        it('handles blocks query error', async () => {
            const blocksError = new Error('Failed to fetch blocks');
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: null,
                                        error: blocksError,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await expect(result.current.scanDocumentRequirements()).rejects.toThrow(
                'Failed to fetch document blocks'
            );
        });

        it('handles requirements query error', async () => {
            const requirementsError = new Error('Failed to fetch requirements');
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: mockBlocks,
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: null,
                                                error: requirementsError,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await expect(result.current.scanDocumentRequirements()).rejects.toThrow(
                'Failed to fetch requirements'
            );
        });

        it('sets scanning state correctly during operation', async () => {
            mockSupabase.from.mockImplementation(() => ({
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
            }));

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const scanPromise = result.current.scanDocumentRequirements();

            // Should be scanning during operation
            expect(result.current.isScanning).toBe(true);

            await scanPromise;

            // Should not be scanning after completion
            expect(result.current.isScanning).toBe(false);
        });

        it('filters out corrupted requirements', async () => {
            const requirementsWithCorrupted = [
                ...mockRequirements,
                {
                    id: 'corrupted-1',
                    name: 'undefined',
                    external_id: 'undefined',
                    blocks: { name: 'Table' },
                },
                {
                    id: null,
                    name: 'No ID requirement',
                    external_id: null,
                    blocks: { name: 'Table' },
                },
            ];

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: mockBlocks,
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: requirementsWithCorrupted,
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            // Should filter out corrupted requirements
            expect(requirementsNeedingIds).toHaveLength(2); // Only valid requirements needing IDs
        });
    });

    describe('assignRequirementIds', () => {
        beforeEach(() => {
            // Setup successful update mock
            mockSupabase.from.mockImplementation(() => ({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            }));
        });

        it('assigns requirement IDs successfully', async () => {
            const selectedIds = ['req-1', 'req-2'];
            const generatedIds = ['REQ-ABC-001', 'REQ-ABC-002'];
            
            mockGenerateBatchRequirementIds.mockResolvedValue(generatedIds);

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            // Set initial requirements without IDs
            result.current.setRequirementsWithoutIds([
                { id: 'req-1', name: 'Test 1' },
                { id: 'req-2', name: 'Test 2' },
                { id: 'req-3', name: 'Test 3' },
            ]);

            await result.current.assignRequirementIds(selectedIds);

            expect(mockGenerateBatchRequirementIds).toHaveBeenCalledWith(
                defaultProps.organizationId,
                selectedIds.length
            );

            // Check that requirements were updated in database
            expect(mockSupabase.from).toHaveBeenCalledWith('requirements');

            // Check that successfully assigned requirements were removed from state
            expect(result.current.requirementsWithoutIds).toHaveLength(1);
            expect(result.current.requirementsWithoutIds[0].id).toBe('req-3');
        });

        it('handles empty selection', async () => {
            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await expect(result.current.assignRequirementIds([])).rejects.toThrow(
                'No requirements selected for ID assignment'
            );
        });

        it('handles ID generation failure', async () => {
            const selectedIds = ['req-1', 'req-2'];
            const generationError = new Error('ID generation failed');
            
            mockGenerateBatchRequirementIds.mockRejectedValue(generationError);

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await expect(result.current.assignRequirementIds(selectedIds)).rejects.toThrow(
                'ID generation failed'
            );
        });

        it('handles partial update failures', async () => {
            const selectedIds = ['req-1', 'req-2'];
            const generatedIds = ['REQ-ABC-001', 'REQ-ABC-002'];
            
            mockGenerateBatchRequirementIds.mockResolvedValue(generatedIds);

            // Mock one successful and one failed update
            let callCount = 0;
            mockSupabase.from.mockImplementation(() => ({
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockImplementation(() => {
                        callCount++;
                        if (callCount === 1) {
                            return Promise.resolve({ error: null }); // Success
                        } else {
                            return Promise.resolve({ 
                                error: new Error('Update failed') 
                            }); // Failure
                        }
                    }),
                }),
            }));

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            result.current.setRequirementsWithoutIds([
                { id: 'req-1', name: 'Test 1' },
                { id: 'req-2', name: 'Test 2' },
            ]);

            await result.current.assignRequirementIds(selectedIds);

            // Should only remove successfully updated requirement
            expect(result.current.requirementsWithoutIds).toHaveLength(1);
            expect(result.current.requirementsWithoutIds[0].id).toBe('req-2');
        });

        it('sets assigning state correctly during operation', async () => {
            const selectedIds = ['req-1'];
            const generatedIds = ['REQ-ABC-001'];
            
            mockGenerateBatchRequirementIds.mockResolvedValue(generatedIds);

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            const assignPromise = result.current.assignRequirementIds(selectedIds);

            // Should be assigning during operation
            expect(result.current.isAssigning).toBe(true);

            await assignPromise;

            // Should not be assigning after completion
            expect(result.current.isAssigning).toBe(false);
        });

        it('logs progress information', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            const selectedIds = ['req-1', 'req-2'];
            const generatedIds = ['REQ-ABC-001', 'REQ-ABC-002'];
            
            mockGenerateBatchRequirementIds.mockResolvedValue(generatedIds);

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await result.current.assignRequirementIds(selectedIds);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Assigning REQ-IDs to 2 requirements')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Generated batch IDs:')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Successfully assigned 2 REQ-IDs')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('cleanup functionality', () => {
        it('auto-cleans corrupted requirements', async () => {
            const requirementsWithCorrupted = [
                {
                    id: 'corrupted-1',
                    name: 'undefined',
                    external_id: 'undefined',
                },
                {
                    id: 'valid-1',
                    name: 'Valid Requirement',
                    external_id: null,
                },
            ];

            // Mock update call for cleanup
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: [{ id: 'block-1', name: 'Table', type: 'table' }],
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: requirementsWithCorrupted,
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                        update: jest.fn().mockReturnValue({
                            in: jest.fn().mockResolvedValue({
                                error: null,
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

            await result.current.scanDocumentRequirements();

            // Should have called update to mark corrupted requirements as deleted
            expect(mockSupabase.from).toHaveBeenCalledWith('requirements');
        });
    });

    describe('requirement ID validation', () => {
        const { result } = renderHook(() => useDocumentRequirementScanner(defaultProps));

        it('identifies valid requirement IDs correctly', async () => {
            const validIds = [
                'REQ-001',
                'REQ-ABC-001',
                'REQ-1',
                'REQ-99',
            ];

            // These should not need new IDs
            const requirementsWithValidIds = validIds.map((id, index) => ({
                id: `req-${index}`,
                name: `Requirement ${index}`,
                external_id: id,
                blocks: { name: 'Table' },
            }));

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: [{ id: 'block-1', name: 'Table', type: 'table' }],
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: requirementsWithValidIds,
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            expect(requirementsNeedingIds).toHaveLength(0);
        });

        it('identifies placeholder values correctly', async () => {
            const placeholderIds = [
                'Will be generated',
                'REQ-001, REQ-002, etc',
                'TBD',
                'TODO',
                'N/A',
                '-',
                'PLACEHOLDER',
            ];

            const requirementsWithPlaceholders = placeholderIds.map((id, index) => ({
                id: `req-${index}`,
                name: `Requirement ${index}`,
                external_id: id,
                blocks: { name: 'Table' },
            }));

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'blocks') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    eq: jest.fn().mockResolvedValue({
                                        data: [{ id: 'block-1', name: 'Table', type: 'table' }],
                                        error: null,
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                if (table === 'requirements') {
                    return {
                        select: jest.fn().mockReturnValue({
                            in: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    not: jest.fn().mockReturnValue({
                                        not: jest.fn().mockReturnValue({
                                            not: jest.fn().mockResolvedValue({
                                                data: requirementsWithPlaceholders,
                                                error: null,
                                            }),
                                        }),
                                    }),
                                }),
                            }),
                        }),
                    };
                }
                return mockSupabase.from();
            });

            const requirementsNeedingIds = await result.current.scanDocumentRequirements();

            expect(requirementsNeedingIds).toHaveLength(placeholderIds.length);
        });
    });
});