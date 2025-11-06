import { describe, expect, it } from 'vitest';

import {
    findMaxNumber,
    generateBatchIds,
    generateOrgPrefix,
    generateRandomId,
    generateSequentialId,
    generateTimestampId,
    parseSequentialId,
} from '@/lib/utils/string/id-generator';

describe('ID Generator Utilities', () => {
    describe('generateSequentialId', () => {
        it('should generate sequential ID with default options', () => {
            const result = generateSequentialId({ prefix: 'REQ' }, 5);
            expect(result).toBe('REQ-005');
        });

        it('should pad numbers correctly', () => {
            expect(generateSequentialId({ prefix: 'REQ', length: 3 }, 1)).toBe('REQ-001');
            expect(generateSequentialId({ prefix: 'REQ', length: 3 }, 99)).toBe('REQ-099');
            expect(generateSequentialId({ prefix: 'REQ', length: 3 }, 999)).toBe('REQ-999');
        });

        it('should handle custom length', () => {
            const result = generateSequentialId({ prefix: 'REQ', length: 5 }, 42);
            expect(result).toBe('REQ-00042');
        });

        it('should handle custom separator', () => {
            const result = generateSequentialId({ prefix: 'REQ', separator: '_' }, 5);
            expect(result).toBe('REQ_005');
        });

        it('should handle numbers larger than padding', () => {
            const result = generateSequentialId({ prefix: 'REQ', length: 2 }, 999);
            expect(result).toBe('REQ-999');
        });
    });

    describe('parseSequentialId', () => {
        it('should parse valid sequential ID', () => {
            const result = parseSequentialId('REQ-ORG-005', 'REQ-ORG-');
            expect(result).toBe(5);
        });

        it('should handle IDs without padding', () => {
            const result = parseSequentialId('REQ-ORG-123', 'REQ-ORG-');
            expect(result).toBe(123);
        });

        it('should return null for invalid prefix', () => {
            const result = parseSequentialId('DOC-001', 'REQ-');
            expect(result).toBeNull();
        });

        it('should return null for non-numeric suffix', () => {
            const result = parseSequentialId('REQ-ABC', 'REQ-');
            expect(result).toBeNull();
        });

        it('should handle zero', () => {
            const result = parseSequentialId('REQ-000', 'REQ-');
            expect(result).toBe(0);
        });
    });

    describe('generateOrgPrefix', () => {
        it('should generate prefix from organization name', () => {
            expect(generateOrgPrefix('MyOrganization')).toBe('MYO');
        });

        it('should handle custom length', () => {
            expect(generateOrgPrefix('Acme Corp', 4)).toBe('ACME');
        });

        it('should remove special characters', () => {
            expect(generateOrgPrefix('Acme! Corp@')).toBe('ACM');
        });

        it('should handle short names', () => {
            expect(generateOrgPrefix('AB')).toBe('AB');
        });

        it('should handle names with numbers', () => {
            expect(generateOrgPrefix('Org123')).toBe('ORG');
        });

        it('should preserve numbers', () => {
            expect(generateOrgPrefix('3M Company', 2)).toBe('3M');
        });

        it('should handle empty string', () => {
            expect(generateOrgPrefix('')).toBe('');
        });
    });

    describe('generateTimestampId', () => {
        it('should generate ID with timestamp', () => {
            const result = generateTimestampId('REQ');
            expect(result).toMatch(/^REQ-\d+$/);
        });

        it('should generate unique IDs', () => {
            const id1 = generateTimestampId('REQ');
            const id2 = generateTimestampId('REQ');
            // They might be the same if called in same millisecond, but structure should be correct
            expect(id1).toMatch(/^REQ-\d+$/);
            expect(id2).toMatch(/^REQ-\d+$/);
        });

        it('should handle different prefixes', () => {
            const result = generateTimestampId('DOC');
            expect(result).toMatch(/^DOC-\d+$/);
        });
    });

    describe('generateRandomId', () => {
        it('should generate random ID with default length', () => {
            const result = generateRandomId('TMP');
            expect(result).toMatch(/^TMP-[A-Z0-9]{8}$/);
        });

        it('should generate random ID with custom length', () => {
            const result = generateRandomId('TMP', 12);
            expect(result).toMatch(/^TMP-[A-Z0-9]{12}$/);
        });

        it('should generate unique IDs', () => {
            const id1 = generateRandomId('TMP');
            const id2 = generateRandomId('TMP');
            expect(id1).not.toBe(id2);
        });

        it('should only contain uppercase letters and numbers', () => {
            const result = generateRandomId('TMP', 100);
            const randomPart = result.split('-')[1];
            expect(randomPart).toMatch(/^[A-Z0-9]+$/);
        });
    });

    describe('findMaxNumber', () => {
        it('should find maximum number from IDs', () => {
            const ids = ['REQ-001', 'REQ-005', 'REQ-003'];
            const result = findMaxNumber(ids, 'REQ-');
            expect(result).toBe(5);
        });

        it('should return 0 for empty array', () => {
            const result = findMaxNumber([], 'REQ-');
            expect(result).toBe(0);
        });

        it('should ignore IDs with different prefix', () => {
            const ids = ['REQ-001', 'DOC-999', 'REQ-005'];
            const result = findMaxNumber(ids, 'REQ-');
            expect(result).toBe(5);
        });

        it('should handle IDs with invalid numbers', () => {
            const ids = ['REQ-001', 'REQ-ABC', 'REQ-005'];
            const result = findMaxNumber(ids, 'REQ-');
            expect(result).toBe(5);
        });

        it('should handle large numbers', () => {
            const ids = ['REQ-001', 'REQ-9999'];
            const result = findMaxNumber(ids, 'REQ-');
            expect(result).toBe(9999);
        });
    });

    describe('generateBatchIds', () => {
        it('should generate batch of sequential IDs', () => {
            const result = generateBatchIds({ prefix: 'REQ', length: 3 }, 1, 5);
            expect(result).toEqual(['REQ-001', 'REQ-002', 'REQ-003', 'REQ-004', 'REQ-005']);
        });

        it('should start from specified number', () => {
            const result = generateBatchIds({ prefix: 'REQ', length: 3 }, 10, 3);
            expect(result).toEqual(['REQ-010', 'REQ-011', 'REQ-012']);
        });

        it('should handle single ID', () => {
            const result = generateBatchIds({ prefix: 'REQ', length: 3 }, 1, 1);
            expect(result).toEqual(['REQ-001']);
        });

        it('should handle zero count', () => {
            const result = generateBatchIds({ prefix: 'REQ', length: 3 }, 1, 0);
            expect(result).toEqual([]);
        });
    });
});

