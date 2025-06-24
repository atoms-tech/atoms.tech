import { supabase } from '@/lib/supabase/supabaseBrowser';

/**
 * Generates the next available REQ-ID for a given block
 * Format: REQ-001, REQ-002, etc.
 * 
 * @param blockId - The block ID to generate the REQ-ID for
 * @param documentId - The document ID (optional, for additional scoping)
 * @returns Promise<string> - The next available REQ-ID
 */
export async function generateNextReqId(
    blockId: string,
    documentId?: string
): Promise<string> {
    try {
        // Query existing requirements to find the highest REQ-ID number
        let query = supabase
            .from('requirements')
            .select('external_id')
            .eq('block_id', blockId)
            .eq('is_deleted', false)
            .not('external_id', 'is', null);

        // Optionally scope by document if provided
        if (documentId) {
            query = query.eq('document_id', documentId);
        }

        const { data: requirements, error } = await query;

        if (error) {
            console.error('Error fetching requirements for REQ-ID generation:', error);
            // Fallback to REQ-001 if there's an error
            return 'REQ-001';
        }

        // Extract numeric parts from existing REQ-IDs
        const existingNumbers: number[] = [];
        
        if (requirements && requirements.length > 0) {
            requirements.forEach((req) => {
                if (req.external_id) {
                    // Match patterns like REQ-001, REQ-123, etc.
                    const match = req.external_id.match(/^REQ-(\d+)$/i);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num)) {
                            existingNumbers.push(num);
                        }
                    }
                }
            });
        }

        // Find the next available number
        let nextNumber = 1;
        if (existingNumbers.length > 0) {
            // Sort numbers and find the next available one
            existingNumbers.sort((a, b) => a - b);
            
            // Find the first gap or use max + 1
            for (let i = 0; i < existingNumbers.length; i++) {
                if (existingNumbers[i] !== i + 1) {
                    nextNumber = i + 1;
                    break;
                }
            }
            
            // If no gaps found, use max + 1
            if (nextNumber === 1 && existingNumbers.length > 0) {
                nextNumber = Math.max(...existingNumbers) + 1;
            }
        }

        // Format with leading zeros (3 digits)
        const formattedNumber = nextNumber.toString().padStart(3, '0');
        return `REQ-${formattedNumber}`;

    } catch (error) {
        console.error('Unexpected error in generateNextReqId:', error);
        // Fallback to REQ-001 if there's an unexpected error
        return 'REQ-001';
    }
}

/**
 * Validates if a REQ-ID is in the correct format
 * @param reqId - The REQ-ID to validate
 * @returns boolean - True if valid format
 */
export function isValidReqIdFormat(reqId: string): boolean {
    return /^REQ-\d{3,}$/.test(reqId);
}

/**
 * Extracts the numeric part from a REQ-ID
 * @param reqId - The REQ-ID to extract from
 * @returns number | null - The numeric part or null if invalid
 */
export function extractReqIdNumber(reqId: string): number | null {
    const match = reqId.match(/^REQ-(\d+)$/i);
    if (match) {
        const num = parseInt(match[1], 10);
        return isNaN(num) ? null : num;
    }
    return null;
}

/**
 * Formats a number into a REQ-ID
 * @param num - The number to format
 * @returns string - The formatted REQ-ID
 */
export function formatReqId(num: number): string {
    const formattedNumber = num.toString().padStart(3, '0');
    return `REQ-${formattedNumber}`;
}
