import { supabase } from '@/lib/supabase/supabaseBrowser';

export type ReqIdScope = 'block' | 'document' | 'project' | 'org';

/**
 * Generates the next available REQ-ID considering all existing REQ-IDs in the specified scope
 * Format: REQ-001, REQ-002, etc.
 *
 * @param blockId - The block ID to generate the REQ-ID for
 * @param documentId - The document ID (optional, for additional scoping)
 * @param projectId - The project ID (optional, for project-wide scoping)
 * @param orgId - The organization ID (optional, for org-wide scoping)
 * @param scope - The scope to consider when generating REQ-IDs ('block' | 'document' | 'project' | 'org')
 * @returns Promise<string> - The next available REQ-ID
 */
export async function generateNextReqId(
    blockId: string,
    documentId?: string,
    projectId?: string,
    orgId?: string,
    scope: ReqIdScope = 'document',
): Promise<string> {
    try {
        // Build query based on scope
        let query = supabase
            .from('requirements')
            .select('external_id')
            .eq('is_deleted', false)
            .not('external_id', 'is', null);

        // Apply scope-based filtering
        switch (scope) {
            case 'block':
                query = query.eq('block_id', blockId);
                break;
            case 'document':
                if (documentId) {
                    query = query.eq('document_id', documentId);
                } else {
                    // Fallback to block scope if no document ID
                    query = query.eq('block_id', blockId);
                }
                break;
            case 'project':
                if (projectId) {
                    // Get all documents in the project first, then filter requirements
                    const { data: projectDocs } = await supabase
                        .from('documents')
                        .select('id')
                        .eq('project_id', projectId)
                        .eq('is_deleted', false);

                    if (projectDocs && projectDocs.length > 0) {
                        const docIds = projectDocs.map((doc) => doc.id);
                        query = query.in('document_id', docIds);
                    } else {
                        // Fallback to document scope if no project docs found
                        query = documentId
                            ? query.eq('document_id', documentId)
                            : query.eq('block_id', blockId);
                    }
                } else {
                    // Fallback to document scope if no project ID
                    query = documentId
                        ? query.eq('document_id', documentId)
                        : query.eq('block_id', blockId);
                }
                break;
            case 'org':
                if (orgId) {
                    // Get all projects in the org, then all documents, then filter requirements
                    const { data: orgProjects } = await supabase
                        .from('projects')
                        .select('id')
                        .eq('org_id', orgId)
                        .eq('is_deleted', false);

                    if (orgProjects && orgProjects.length > 0) {
                        const projectIds = orgProjects.map((proj) => proj.id);
                        const { data: orgDocs } = await supabase
                            .from('documents')
                            .select('id')
                            .in('project_id', projectIds)
                            .eq('is_deleted', false);

                        if (orgDocs && orgDocs.length > 0) {
                            const docIds = orgDocs.map((doc) => doc.id);
                            query = query.in('document_id', docIds);
                        } else {
                            // Fallback to project scope if no org docs found
                            query = projectId
                                ? query.eq('document_id', documentId)
                                : query.eq('block_id', blockId);
                        }
                    } else {
                        // Fallback to project scope if no org projects found
                        query = projectId
                            ? query.eq('document_id', documentId)
                            : query.eq('block_id', blockId);
                    }
                } else {
                    // Fallback to project scope if no org ID
                    query = projectId
                        ? query.eq('document_id', documentId)
                        : query.eq('block_id', blockId);
                }
                break;
        }

        const { data: requirements, error } = await query;

        if (error) {
            console.error(
                'Error fetching requirements for REQ-ID generation:',
                error,
            );
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
