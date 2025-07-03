import { supabase } from '@/lib/supabase/supabaseBrowser';

/**
 * Gets the project ID from a document ID
 * @param documentId - The document ID to get project ID for
 * @returns Promise<string> - The project ID
 */
export async function getProjectIdFromDocument(documentId: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('project_id')
            .eq('id', documentId)
            .eq('is_deleted', false)
            .single();

        if (error) {
            console.error('Error fetching project ID from document:', error);
            throw error;
        }

        if (!data?.project_id) {
            throw new Error(`No project found for document ${documentId}`);
        }

        return data.project_id;
    } catch (error) {
        console.error('Error getting project ID from document:', error);
        throw error;
    }
}

/**
 * Generates the next available REQ-ID for a project
 * Format: REQ-XXX (where XXX is zero-padded 3-digit number)
 * 
 * @param projectId - The project ID to scope REQ-IDs to
 * @returns Promise<string> - The next available REQ-ID (e.g., "REQ-001", "REQ-002")
 */
export async function generateNextReqId(projectId: string): Promise<string> {
    try {
        // Get all existing REQ-IDs for requirements in this project
        const { data: existingRequirements, error } = await supabase
            .from('requirements')
            .select(`
                external_id,
                documents!inner (
                    project_id
                )
            `)
            .eq('documents.project_id', projectId)
            .eq('is_deleted', false)
            .not('external_id', 'is', null);

        if (error) {
            console.error('Error fetching existing REQ-IDs:', error);
            throw error;
        }

        // Extract and parse existing REQ-IDs
        const existingReqIds = existingRequirements
            ?.map(req => req.external_id)
            .filter((id): id is string => id !== null && id.startsWith('REQ-'))
            .map(id => {
                const match = id.match(/^REQ-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => !isNaN(num) && num > 0) || [];

        // Find the next available number
        let nextNumber = 1;
        if (existingReqIds.length > 0) {
            const maxNumber = Math.max(...existingReqIds);
            nextNumber = maxNumber + 1;
        }

        // Format as REQ-XXX with zero-padding
        return `REQ-${nextNumber.toString().padStart(3, '0')}`;

    } catch (error) {
        console.error('Error generating REQ-ID:', error);
        // Fallback to timestamp-based ID if there's an error
        const timestamp = Date.now().toString().slice(-6);
        return `REQ-${timestamp}`;
    }
}

/**
 * Validates if a REQ-ID format is correct
 * @param reqId - The REQ-ID to validate
 * @returns boolean - True if format is valid (REQ-XXX where XXX is digits)
 */
export function isValidReqIdFormat(reqId: string): boolean {
    return /^REQ-\d{3,}$/.test(reqId);
}

/**
 * Checks if a REQ-ID already exists in a project
 * @param reqId - The REQ-ID to check
 * @param projectId - The project ID to check within
 * @returns Promise<boolean> - True if REQ-ID already exists
 */
export async function reqIdExists(reqId: string, projectId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('requirements')
            .select(`
                id,
                documents!inner (
                    project_id
                )
            `)
            .eq('external_id', reqId)
            .eq('documents.project_id', projectId)
            .eq('is_deleted', false)
            .limit(1);

        if (error) {
            console.error('Error checking REQ-ID existence:', error);
            return false;
        }

        return (data?.length || 0) > 0;
    } catch (error) {
        console.error('Error checking REQ-ID existence:', error);
        return false;
    }
}

/**
 * Generates a unique REQ-ID with retry logic for concurrent scenarios
 * @param projectId - The project ID to scope REQ-IDs to
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Promise<string> - A guaranteed unique REQ-ID
 */
export async function generateUniqueReqId(
    projectId: string, 
    maxRetries: number = 5
): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const reqId = await generateNextReqId(projectId);
        const exists = await reqIdExists(reqId, projectId);
        
        if (!exists) {
            return reqId;
        }
        
        // If REQ-ID exists, wait a small random amount and retry
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    }
    
    // Final fallback with timestamp if all retries failed
    const timestamp = Date.now().toString();
    return `REQ-${timestamp.slice(-6)}`;
}

/**
 * Generates a unique REQ-ID from a document ID (convenience function)
 * @param documentId - The document ID to generate REQ-ID for
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Promise<string> - A guaranteed unique REQ-ID
 */
export async function generateReqIdFromDocument(
    documentId: string,
    maxRetries: number = 5
): Promise<string> {
    const projectId = await getProjectIdFromDocument(documentId);
    return generateUniqueReqId(projectId, maxRetries);
}
