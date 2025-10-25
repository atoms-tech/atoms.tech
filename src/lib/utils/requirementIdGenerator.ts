import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

/**
 * Generates the next unique requirement ID for an organization
 * Format: REQ-{org_prefix}-{sequential_number}
 * Example: REQ-ORG1-001, REQ-ORG1-002, etc.
 */
export async function generateNextRequirementId(
    supabase: SupabaseClient<Database>,
    organizationId: string,
): Promise<string> {
    try {
        // Get the organization to determine the prefix
        // Fetch org name via API
        const respOrg = await fetch(`/api/organizations/${organizationId}`, {
            method: 'GET',
            cache: 'no-store',
        });
        let orgName = 'ORG';
        if (respOrg.ok) {
            const payload = (await respOrg.json()) as {
                organization?: { name?: string };
            };
            orgName = payload.organization?.name || 'ORG';
        }

        // orgName defaults to 'ORG' when API fails

        // Create a short prefix from organization name (first 3 chars, uppercase)
        const orgPrefix = orgName.substring(0, 3).toUpperCase();

        // Get the highest existing requirement ID for this organization
        // We need to join with documents and projects to get organization-scoped requirements
        // Ask server API to compute next ID using service role with necessary joins
        const respNext = await fetch(
            `/api/organizations/${organizationId}/requirements/next-id`,
            { method: 'GET', cache: 'no-store' },
        );
        if (respNext.ok) {
            const payload = (await respNext.json()) as { nextExternalId?: string };
            if (payload.nextExternalId) return payload.nextExternalId;
        }

        // Fallback to timestamp-based ID handled in catch (no local scanning)
        return `REQ-${orgPrefix}-${new Date().getTime().toString().slice(-3)}`;
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
    supabase: SupabaseClient<Database>,
    documentId: string,
): Promise<string> {
    try {
        // Get the highest existing requirement ID for this document
        const { data: requirements, error: reqError } = await supabase
            .from('requirements')
            .select('external_id')
            .eq('document_id', documentId)
            .not('external_id', 'is', null)
            .order('created_at', { ascending: false });

        if (reqError) {
            console.error('Error fetching requirements:', reqError);
            throw new Error('Failed to fetch existing requirements');
        }

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
    supabase: SupabaseClient<Database>,
    projectId: string,
): Promise<string> {
    try {
        // Get all requirements for this project through documents
        const { data: requirements, error: reqError } = await supabase
            .from('requirements')
            .select(
                `
                external_id,
                documents!inner(project_id)
            `,
            )
            .eq('documents.project_id', projectId)
            .not('external_id', 'is', null)
            .order('created_at', { ascending: false });

        if (reqError) {
            console.error('Error fetching requirements:', reqError);
            throw new Error('Failed to fetch existing requirements');
        }

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
    supabase: SupabaseClient<Database>,
    organizationId: string,
    count: number,
): Promise<string[]> {
    try {
        // Get the organization to determine the prefix
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', organizationId)
            .single();

        if (orgError) {
            console.error('Error fetching organization:', orgError);
            throw new Error('Failed to fetch organization');
        }

        // Create a short prefix from organization name (first 3 chars, uppercase)
        const orgPrefix = org?.name?.substring(0, 3).toUpperCase() || 'ORG';

        // Get the highest existing requirement ID for this organization
        const { data: requirements, error: reqError } = await supabase
            .from('requirements')
            .select(
                `
                external_id,
                documents!inner(
                    project_id,
                    projects!inner(
                        organization_id
                    )
                )
            `,
            )
            .eq('documents.projects.organization_id', organizationId)
            .not('external_id', 'is', null)
            .order('created_at', { ascending: false });

        if (reqError) {
            console.error('Error fetching requirements:', reqError);
            throw new Error('Failed to fetch existing requirements');
        }

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
