/**
 * Generic ID Generation Utilities
 *
 * Reusable functions for generating various types of IDs
 * Consolidates ID generation logic from across the codebase
 */

export interface IDGeneratorOptions {
    prefix: string;
    length?: number;
    separator?: string;
}

/**
 * Generate a sequential ID with prefix and padding
 *
 * @param options - ID generation options
 * @param number - The sequential number
 * @returns Formatted ID string
 *
 * @example
 * generateSequentialId({ prefix: 'REQ-ORG', length: 3 }, 5)
 * // Returns: 'REQ-ORG-005'
 */
export function generateSequentialId(
    options: IDGeneratorOptions,
    number: number,
): string {
    const { prefix, length = 3, separator = '-' } = options;
    const paddedNumber = String(number).padStart(length, '0');
    return `${prefix}${separator}${paddedNumber}`;
}

/**
 * Parse a sequential ID to extract the number
 *
 * @param id - The ID to parse
 * @param prefix - The expected prefix (including separator)
 * @returns The extracted number, or null if invalid
 *
 * @example
 * parseSequentialId('REQ-ORG-005', 'REQ-ORG-')
 * // Returns: 5
 */
export function parseSequentialId(id: string, prefix: string): number | null {
    if (!id.startsWith(prefix)) {
        return null;
    }

    const numberPart = id.substring(prefix.length);
    const parsed = parseInt(numberPart, 10);

    return isNaN(parsed) ? null : parsed;
}

/**
 * Generate an organization prefix from name
 * Takes the first N characters, uppercases them, and removes non-alphanumeric chars
 *
 * @param orgName - Organization name
 * @param length - Number of characters to use (default: 3)
 * @returns Sanitized prefix
 *
 * @example
 * generateOrgPrefix('My Organization')
 * // Returns: 'MYO'
 *
 * generateOrgPrefix('Acme Corp!', 4)
 * // Returns: 'ACME'
 */
export function generateOrgPrefix(orgName: string, length: number = 3): string {
    return orgName
        .substring(0, length)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/**
 * Generate a timestamp-based ID
 * Useful for fallback IDs when sequential generation fails
 *
 * @param prefix - ID prefix
 * @returns ID with timestamp
 *
 * @example
 * generateTimestampId('REQ')
 * // Returns: 'REQ-1704067200000'
 */
export function generateTimestampId(prefix: string): string {
    return `${prefix}-${Date.now()}`;
}

/**
 * Generate a random alphanumeric ID
 *
 * @param prefix - ID prefix
 * @param length - Length of random part (default: 8)
 * @returns Random ID
 *
 * @example
 * generateRandomId('TMP', 8)
 * // Returns: 'TMP-A3F9B2C1'
 */
export function generateRandomId(prefix: string, length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${result}`;
}

/**
 * Find the maximum number from a list of IDs with a given prefix
 * Useful for determining the next sequential ID
 *
 * @param ids - Array of ID strings
 * @param prefix - The prefix to match (including separator)
 * @returns The maximum number found, or 0 if none found
 *
 * @example
 * findMaxNumber(['REQ-ORG-001', 'REQ-ORG-005', 'REQ-ORG-003'], 'REQ-ORG-')
 * // Returns: 5
 */
export function findMaxNumber(ids: string[], prefix: string): number {
    let maxNumber = 0;

    for (const id of ids) {
        const number = parseSequentialId(id, prefix);
        if (number !== null && number > maxNumber) {
            maxNumber = number;
        }
    }

    return maxNumber;
}

/**
 * Generate a batch of sequential IDs
 *
 * @param options - ID generation options
 * @param startNumber - Starting number
 * @param count - Number of IDs to generate
 * @returns Array of sequential IDs
 *
 * @example
 * generateBatchIds({ prefix: 'REQ', length: 3 }, 1, 5)
 * // Returns: ['REQ-001', 'REQ-002', 'REQ-003', 'REQ-004', 'REQ-005']
 */
export function generateBatchIds(
    options: IDGeneratorOptions,
    startNumber: number,
    count: number,
): string[] {
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
        ids.push(generateSequentialId(options, startNumber + i));
    }

    return ids;
}

