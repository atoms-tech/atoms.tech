import {
    generateNextReqId,
    generateReqIdFromDocument,
    generateUniqueReqId,
    getProjectIdFromDocument,
    isValidReqIdFormat,
    reqIdExists,
} from '@/lib/utils/reqIdGenerator';

// Mock Supabase
jest.mock('@/lib/supabase/supabaseBrowser', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        not: jest.fn(() => ({
                            data: [
                                { external_id: 'REQ-001' },
                                { external_id: 'REQ-002' },
                                { external_id: 'REQ-005' },
                                { external_id: 'REQ-010' },
                            ],
                            error: null,
                        })),
                        single: jest.fn(() => ({
                            data: { project_id: 'test-project-id' },
                            error: null,
                        })),
                        limit: jest.fn(() => ({
                            data: [],
                            error: null,
                        })),
                    })),
                })),
            })),
        })),
    },
}));

describe('REQ-ID Generator', () => {
    describe('isValidReqIdFormat', () => {
        test('validates correct REQ-ID formats', () => {
            expect(isValidReqIdFormat('REQ-001')).toBe(true);
            expect(isValidReqIdFormat('REQ-123')).toBe(true);
            expect(isValidReqIdFormat('REQ-999')).toBe(true);
            expect(isValidReqIdFormat('REQ-1234')).toBe(true);
        });

        test('rejects invalid REQ-ID formats', () => {
            expect(isValidReqIdFormat('INVALID')).toBe(false);
            expect(isValidReqIdFormat('REQ-1')).toBe(false);
            expect(isValidReqIdFormat('REQ-12')).toBe(false);
            expect(isValidReqIdFormat('req-001')).toBe(false);
            expect(isValidReqIdFormat('REQ-ABC')).toBe(false);
            expect(isValidReqIdFormat('REQ-')).toBe(false);
            expect(isValidReqIdFormat('')).toBe(false);
        });
    });

    describe('generateNextReqId', () => {
        test('generates REQ-011 when existing IDs are REQ-001, REQ-002, REQ-005, REQ-010', async () => {
            const result = await generateNextReqId('test-project-id');
            expect(result).toBe('REQ-011');
        });

        test('handles empty project (should generate REQ-001)', async () => {
            // Mock empty response
            const mockSupabase = require('@/lib/supabase/supabaseBrowser').supabase;
            mockSupabase.from.mockReturnValueOnce({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        eq: jest.fn(() => ({
                            not: jest.fn(() => ({
                                data: [],
                                error: null,
                            })),
                        })),
                    })),
                })),
            });

            const result = await generateNextReqId('empty-project-id');
            expect(result).toBe('REQ-001');
        });
    });

    describe('getProjectIdFromDocument', () => {
        test('retrieves project ID from document ID', async () => {
            const result = await getProjectIdFromDocument('test-document-id');
            expect(result).toBe('test-project-id');
        });
    });

    describe('reqIdExists', () => {
        test('returns false for non-existing REQ-ID', async () => {
            const result = await reqIdExists('REQ-999', 'test-project-id');
            expect(result).toBe(false);
        });
    });

    describe('generateUniqueReqId', () => {
        test('generates unique REQ-ID with retry logic', async () => {
            const result = await generateUniqueReqId('test-project-id');
            expect(result).toMatch(/^REQ-\d{3,}$/);
        });
    });

    describe('generateReqIdFromDocument', () => {
        test('generates REQ-ID from document ID', async () => {
            const result = await generateReqIdFromDocument('test-document-id');
            expect(result).toMatch(/^REQ-\d{3,}$/);
        });
    });
});

// Demo function to showcase the REQ-ID generation
export function demonstrateReqIdGeneration() {
    console.log('🎯 REQ-ID Generation Demo');
    console.log('========================');
    
    // Test format validation
    console.log('\n📋 Format Validation Tests:');
    const testIds = ['REQ-001', 'REQ-123', 'INVALID', 'REQ-1', 'REQ-12345', 'req-001', 'REQ-ABC'];
    testIds.forEach(id => {
        const isValid = isValidReqIdFormat(id);
        console.log(`${isValid ? '✅' : '❌'} "${id}": ${isValid ? 'VALID' : 'INVALID'}`);
    });

    // Simulate REQ-ID generation
    console.log('\n🔢 Sequential Generation Simulation:');
    const mockExistingIds = ['REQ-001', 'REQ-002', 'REQ-005', 'REQ-010'];
    console.log(`Existing IDs: ${mockExistingIds.join(', ')}`);
    
    // Simulate next ID generation
    const numbers = mockExistingIds
        .map(id => {
            const match = id.match(/^REQ-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);
    
    const nextNumber = Math.max(...numbers) + 1;
    const nextId = `REQ-${nextNumber.toString().padStart(3, '0')}`;
    console.log(`Next generated ID: ${nextId}`);

    // Test gap handling
    console.log('\n🕳️ Gap Handling Test:');
    const gappedIds = ['REQ-001', 'REQ-003', 'REQ-007'];
    const gappedNumbers = gappedIds
        .map(id => {
            const match = id.match(/^REQ-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);
    
    const nextAfterGap = Math.max(...gappedNumbers) + 1;
    const nextGapId = `REQ-${nextAfterGap.toString().padStart(3, '0')}`;
    console.log(`IDs with gaps: ${gappedIds.join(', ')}`);
    console.log(`Next ID (doesn't fill gaps): ${nextGapId}`);

    console.log('\n✨ Implementation Features:');
    console.log('• Automatic REQ-ID generation on requirement creation');
    console.log('• Project-scoped uniqueness');
    console.log('• Format validation (REQ-XXX pattern)');
    console.log('• Concurrent creation handling with retry logic');
    console.log('• Backward compatibility with existing requirements');
    console.log('• Fallback to timestamp-based IDs if retries fail');
    
    return {
        formatValidation: testIds.map(id => ({ id, valid: isValidReqIdFormat(id) })),
        nextId,
        nextGapId,
        algorithm: 'Sequential numbering with project scope'
    };
}
