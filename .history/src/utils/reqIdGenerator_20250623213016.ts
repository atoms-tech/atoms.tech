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
                `Error fetching requirements for REQ-ID generation (scope: ${scope}):`,
                error,
            );
            // Fallback to REQ-001 if there's an error
            return 'REQ-001';
        }

        // Extract numeric parts from existing REQ-IDs across all patterns
        const existingNumbers: number[] = [];

        if (requirements && requirements.length > 0) {
            requirements.forEach((req) => {
                if (req.external_id) {
                    // Extract numbers from various REQ-ID patterns
                    const numbers = extractReqIdNumbers(req.external_id);
                    existingNumbers.push(...numbers);
                }
            });
        }

        // Find the next available number
        let nextNumber = 1;
        if (existingNumbers.length > 0) {
            // Sort numbers and find the highest + 1 (no gaps to avoid confusion)
            existingNumbers.sort((a, b) => a - b);
            nextNumber = Math.max(...existingNumbers) + 1;
        }

        // Format with leading zeros (3 digits minimum)
        const formattedNumber = nextNumber.toString().padStart(3, '0');
        return `REQ-${formattedNumber}`;
    } catch (error) {
        console.error('Unexpected error in generateNextReqId:', error);
        // Fallback to REQ-001 if there's an unexpected error
        return 'REQ-001';
    }
}

/**
 * Extracts all numeric parts from various REQ-ID patterns
 * Supports: REQ-001, REQ-123, R-45, FR-67, NFR-89, etc.
 * @param reqId - The REQ-ID string to extract numbers from
 * @returns number[] - Array of extracted numbers
 */
function extractReqIdNumbers(reqId: string): number[] {
    const numbers: number[] = [];

    // Common requirement ID patterns
    const patterns = [
        /^REQ-(\d+)$/i, // REQ-001, REQ-123
        /^R-(\d+)$/i, // R-45
        /^RQ-(\d+)$/i, // RQ-67
        /^FR-(\d+)$/i, // FR-89 (Functional Requirements)
        /^NFR-(\d+)$/i, // NFR-12 (Non-Functional Requirements)
        /^US-(\d+)$/i, // US-34 (User Stories)
        /^STORY-(\d+)$/i, // STORY-56
        /^EP-(\d+)$/i, // EP-78 (Epics)
        /^EPIC-(\d+)$/i, // EPIC-90
        /^FEAT-(\d+)$/i, // FEAT-12 (Features)
        /^FEATURE-(\d+)$/i, // FEATURE-34
        /^([A-Z]{2,4})-(\d+)$/i, // Generic pattern for any 2-4 letter prefix
    ];

    for (const pattern of patterns) {
        const match = reqId.match(pattern);
        if (match) {
            // For the generic pattern, we want the second capture group
            const numStr = pattern.source.includes('([A-Z]{2,4})')
                ? match[2]
                : match[1];
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
                numbers.push(num);
            }
        }
    }

    return numbers;
}

/**
 * Validates if a REQ-ID is in a supported format
 * @param reqId - The REQ-ID to validate
 * @returns boolean - True if valid format
 */
export function isValidReqIdFormat(reqId: string): boolean {
    const supportedPatterns = [
        /^REQ-\d{3,}$/i,
        /^R-\d{2,}$/i,
        /^RQ-\d{2,}$/i,
        /^FR-\d{2,}$/i,
        /^NFR-\d{2,}$/i,
        /^US-\d{2,}$/i,
        /^STORY-\d{2,}$/i,
        /^EP-\d{2,}$/i,
        /^EPIC-\d{2,}$/i,
        /^FEAT-\d{2,}$/i,
        /^FEATURE-\d{2,}$/i,
        /^[A-Z]{2,4}-\d{2,}$/i,
    ];

    return supportedPatterns.some((pattern) => pattern.test(reqId));
}

/**
 * Extracts the numeric part from a REQ-ID (supports multiple formats)
 * @param reqId - The REQ-ID to extract from
 * @returns number | null - The numeric part or null if invalid
 */
export function extractReqIdNumber(reqId: string): number | null {
    const numbers = extractReqIdNumbers(reqId);
    return numbers.length > 0 ? numbers[0] : null;
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

/**
 * Determines the optimal REQ-ID scope based on available context
 * @param projectId - The project ID
 * @param orgId - The organization ID
 * @param userPreference - User's preferred scope (optional)
 * @returns ReqIdScope - The recommended scope
 */
export function determineOptimalReqIdScope(
    projectId?: string,
    orgId?: string,
    userPreference?: ReqIdScope,
): ReqIdScope {
    // If user has a preference, respect it
    if (userPreference) {
        return userPreference;
    }

    // Default logic: use the broadest available scope for better uniqueness
    if (orgId) {
        return 'org'; // Organization-wide unique REQ-IDs
    } else if (projectId) {
        return 'project'; // Project-wide unique REQ-IDs
    } else {
        return 'document'; // Document-wide unique REQ-IDs
    }
}

/**
 * Smart REQ-ID generator that automatically determines the best scope
 * @param blockId - The block ID
 * @param documentId - The document ID
 * @param projectId - The project ID (optional)
 * @param orgId - The organization ID (optional)
 * @param userPreference - User's preferred scope (optional)
 * @returns Promise<string> - The next available REQ-ID
 */
export async function generateSmartReqId(
    blockId: string,
    documentId?: string,
    projectId?: string,
    orgId?: string,
    userPreference?: ReqIdScope,
): Promise<string> {
    const optimalScope = determineOptimalReqIdScope(
        projectId,
        orgId,
        userPreference,
    );

    return generateNextReqId(
        blockId,
        documentId,
        projectId,
        orgId,
        optimalScope,
    );
}
