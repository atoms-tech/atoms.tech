import { atomsApiClient } from '@/lib/atoms-api';

/**
 * Generates the next unique requirement ID for an organization
 * Format: REQ-{org_prefix}-{sequential_number}
 * Example: REQ-ORG1-001, REQ-ORG1-002, etc.
 */
export async function generateNextRequirementId(organizationId: string): Promise<string> {
    try {
        // Get the organization to determine the prefix
        const api = atomsApiClient();
        const org = await api.organizations.getById(organizationId as string);

        // Create a short prefix from organization name (first 3 chars, uppercase)
        const orgPrefix = org?.name?.substring(0, 3).toUpperCase() || 'ORG';

        // Get the highest existing requirement ID for this organization
        // We need to join with documents and projects to get organization-scoped requirements
        const requirements = await api.requirements.listWithFilters({ organization_id: organizationId });

        // Find the highest number for this organization's requirements
        let maxNumber = 0;
        const prefix = `REQ-${orgPrefix}-`;

        if (requirements && requirements.length > 0) {
            for (const req of requirements) {
                if (req.external_id && req.external_id.startsWith(prefix)) {
                    const numberPart = req.external_id.substring(prefix.length);
                    const number = parseInt(numberPart, 10);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            }
        }

        // Generate the next ID
        const nextNumber = maxNumber + 1;
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error('Error generating requirement ID:', error);
        // Fallback to a timestamp-based ID if there's an error
        const timestamp = Date.now().toString().slice(-6);
        return `REQ-${timestamp}`;
    }
}

/**
 * Alternative simpler approach: Generate requirement ID based on document scope
 * Format: REQ-DOC-{sequential_number}
 */
export async function generateDocumentScopedRequirementId(
    documentId: string,
): Promise<string> {
    try {
        // Get the highest existing requirement ID for this document
        const api = atomsApiClient();
        const requirements = await api.requirements.listWithFilters({ document_id: documentId });

        // Find the highest number for this document's requirements
        let maxNumber = 0;
        const prefix = 'REQ-DOC-';

        if (requirements && requirements.length > 0) {
            for (const req of requirements) {
                if (req.external_id && req.external_id.startsWith(prefix)) {
                    const numberPart = req.external_id.substring(prefix.length);
                    const number = parseInt(numberPart, 10);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            }
        }

        // Generate the next ID
        const nextNumber = maxNumber + 1;
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error('Error generating document-scoped requirement ID:', error);
        // Fallback to a timestamp-based ID if there's an error
        const timestamp = Date.now().toString().slice(-6);
        return `REQ-DOC-${timestamp}`;
    }
}

/**
 * Project-scoped requirement ID generation
 * Format: REQ-PROJ-{sequential_number}
 */
export async function generateProjectScopedRequirementId(
    projectId: string,
): Promise<string> {
    try {
        // Get all requirements for this project through documents
        const api = atomsApiClient();
        const requirements = await api.requirements.listWithFilters({ project_id: projectId });

        // Find the highest number for this project's requirements
        let maxNumber = 0;
        const prefix = 'REQ-PROJ-';

        if (requirements && requirements.length > 0) {
            for (const req of requirements) {
                if (req.external_id && req.external_id.startsWith(prefix)) {
                    const numberPart = req.external_id.substring(prefix.length);
                    const number = parseInt(numberPart, 10);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            }
        }

        // Generate the next ID
        const nextNumber = maxNumber + 1;
        const paddedNumber = nextNumber.toString().padStart(3, '0');
        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error('Error generating project-scoped requirement ID:', error);
        // Fallback to a timestamp-based ID if there's an error
        const timestamp = Date.now().toString().slice(-6);
        return `REQ-PROJ-${timestamp}`;
    }
}

/**
 * Generate multiple requirement IDs in batch for an organization
 * This ensures sequential numbering without conflicts
 */
export async function generateBatchRequirementIds(
    organizationId: string,
    count: number,
): Promise<string[]> {
    try {
        // Get the organization to determine the prefix
        const api = atomsApiClient();
        const org = await api.organizations.getById(organizationId as string);

        // Create a short prefix from organization name (first 3 chars, uppercase)
        const orgPrefix = org?.name?.substring(0, 3).toUpperCase() || 'ORG';

        // Get the highest existing requirement ID for this organization
        const requirements = await api.requirements.listWithFilters({ organization_id: organizationId });

        // Find the highest number for this organization's requirements
        let maxNumber = 0;
        const prefix = `REQ-${orgPrefix}-`;

        if (requirements && requirements.length > 0) {
            for (const req of requirements) {
                if (req.external_id && req.external_id.startsWith(prefix)) {
                    const numberPart = req.external_id.substring(prefix.length);
                    const number = parseInt(numberPart, 10);
                    if (!isNaN(number) && number > maxNumber) {
                        maxNumber = number;
                    }
                }
            }
        }

        // Generate the batch of IDs
        const ids: string[] = [];
        for (let i = 1; i <= count; i++) {
            const nextNumber = maxNumber + i;
            const paddedNumber = nextNumber.toString().padStart(3, '0');
            ids.push(`${prefix}${paddedNumber}`);
        }

        return ids;
    } catch (error) {
        console.error('Error generating batch requirement IDs:', error);
        // Fallback to timestamp-based IDs if there's an error
        const ids: string[] = [];
        for (let i = 0; i < count; i++) {
            const timestamp = (Date.now() + i).toString().slice(-6);
            ids.push(`REQ-${timestamp}`);
        }
        return ids;
    }
}
