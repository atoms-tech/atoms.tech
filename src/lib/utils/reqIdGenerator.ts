import { supabase } from '@/lib/supabase/supabaseBrowser';

/**
 * Generates the next sequential REQ-ID for a project
 * Format: REQ-XXX (e.g., REQ-001, REQ-002, etc.)
 *
 * @param projectId - The project ID to scope the REQ-ID generation
 * @returns Promise<string> - The next available REQ-ID
 */
export async function generateNextReqId(projectId: string): Promise<string> {
    try {
        // Query all existing requirements in the project to find the highest REQ-ID
        const { data: requirements, error } = await supabase
            .from('requirements')
            .select(
                `
                external_id,
                documents!inner (
                    project_id
                )
            `,
            )
            .eq('documents.project_id', projectId)
            .eq('is_deleted', false)
            .not('external_id', 'is', null);

        if (error) {
            console.error(
                'Error fetching requirements for REQ-ID generation:',
                error,
            );
            // Fallback to REQ-001 if there's an error
            return 'REQ-001';
        }

        // Extract REQ-IDs and find the highest number
        const reqIds = requirements
            .map((req) => req.external_id)
            .filter((id) => id && id.startsWith('REQ-'))
            .map((id) => {
                const match = id?.match(/REQ-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter((num) => !isNaN(num));

        // Find the highest number and increment by 1
        const maxNumber = reqIds.length > 0 ? Math.max(...reqIds) : 0;
        const nextNumber = maxNumber + 1;

        // Format with leading zeros (REQ-001, REQ-002, etc.)
        return `REQ-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating REQ-ID:', error);
        // Fallback to REQ-001 if there's an error
        return 'REQ-001';
    }
}

/**
 * Validates if a REQ-ID follows the correct format
 * @param reqId - The REQ-ID to validate
 * @returns boolean - True if valid format
 */
export function isValidReqIdFormat(reqId: string): boolean {
    return /^REQ-\d{3}$/.test(reqId);
}

/**
 * Checks if a REQ-ID already exists in a project
 * @param projectId - The project ID to check
 * @param reqId - The REQ-ID to check for duplicates
 * @returns Promise<boolean> - True if REQ-ID already exists
 */
export async function reqIdExists(
    projectId: string,
    reqId: string,
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('requirements')
            .select(
                `
                id,
                documents!inner (
                    project_id
                )
            `,
            )
            .eq('documents.project_id', projectId)
            .eq('external_id', reqId)
            .eq('is_deleted', false)
            .limit(1);

        if (error) {
            console.error('Error checking REQ-ID existence:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Unexpected error in reqIdExists:', error);
        return false;
    }
}
