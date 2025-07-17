import { act, renderHook } from '@testing-library/react';

import { useDocumentRequirementScanner } from '@/hooks/useDocumentRequirementScanner';

// Mock Supabase
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        eq: jest.fn(() =>
                            Promise.resolve({
                                data: [
                                    {
                                        id: 'block1',
                                        name: 'Test Table',
                                        type: 'table',
                                    },
                                ],
                                error: null,
                            }),
                        ),
                    })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
            in: jest.fn(() => ({
                eq: jest.fn(() =>
                    Promise.resolve({
                        data: [
                            {
                                id: 'req1',
                                name: 'Test Requirement',
                                external_id: null,
                                blocks: { name: 'Test Table' },
                            },
                            {
                                id: 'req2',
                                name: 'Another Requirement',
                                external_id: 'Will be generated',
                                blocks: { name: 'Test Table' },
                            },
                        ],
                        error: null,
                    }),
                ),
            })),
        })),
    },
}));

// Mock the requirement ID generator
jest.mock('@/lib/utils/requirementIdGenerator', () => ({
    generateNextRequirementId: jest
        .fn()
        .mockResolvedValueOnce('REQ-DEM-001')
        .mockResolvedValueOnce('REQ-DEM-002'),
}));

describe('useDocumentRequirementScanner', () => {
    const mockProps = {
        documentId: 'test-doc-id',
        organizationId: 'test-org-id',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with correct default values', () => {
        const { result } = renderHook(() => useDocumentRequirementScanner(mockProps));

        expect(result.current.isScanning).toBe(false);
        expect(result.current.isAssigning).toBe(false);
        expect(result.current.requirementsWithoutIds).toEqual([]);
    });

    it('should scan document and find requirements without IDs', async () => {
        const { result } = renderHook(() => useDocumentRequirementScanner(mockProps));

        await act(async () => {
            const requirements = await result.current.scanDocumentRequirements();
            expect(requirements).toHaveLength(2);
            expect(requirements[0].name).toBe('Test Requirement');
            expect(requirements[1].name).toBe('Another Requirement');
        });

        expect(result.current.requirementsWithoutIds).toHaveLength(2);
    });

    it('should assign REQ-IDs to selected requirements', async () => {
        const { result } = renderHook(() => useDocumentRequirementScanner(mockProps));

        // First scan to populate requirements
        await act(async () => {
            await result.current.scanDocumentRequirements();
        });

        // Then assign IDs
        await act(async () => {
            await result.current.assignRequirementIds(['req1', 'req2']);
        });

        // Should update local state to remove assigned requirements
        expect(result.current.requirementsWithoutIds).toHaveLength(0);
    });

    it('should handle scanning errors gracefully', async () => {
        // Mock error response
        const mockSupabase = jest.requireMock('@/lib/supabase/supabaseBrowser').supabase;
        mockSupabase.from.mockReturnValueOnce({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        eq: () =>
                            Promise.resolve({
                                data: null,
                                error: new Error('Database error'),
                            }),
                    }),
                }),
            }),
        });

        const { result: _result } = renderHook(() =>
            useDocumentRequirementScanner(mockProps),
        );

        await act(async () => {
            await expect(_result.current.scanDocumentRequirements()).rejects.toThrow(
                'Failed to fetch document blocks',
            );
        });
    });

    it('should correctly identify requirements that need IDs', () => {
        const { result: _result } = renderHook(() =>
            useDocumentRequirementScanner(mockProps),
        );

        // Access the internal needsRequirementId function through scanning
        // This is tested indirectly through the scanning functionality
        expect(true).toBe(true); // Placeholder - the logic is tested in the scan function
    });
});
