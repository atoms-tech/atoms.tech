import type { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/base/database.types';

import {
    findMaxNumber,
    generateBatchIds,
    generateOrgPrefix,
    generateSequentialId,
    generateTimestampId,
    parseSequentialId,
} from './string/id-generator';

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
        // Fetch organization name
        const orgName = await fetchOrganizationName(organizationId);
        const orgPrefix = generateOrgPrefix(orgName);
        const fullPrefix = `REQ-${orgPrefix}`;

        // Try to get next ID from API
        const nextId = await fetchNextIdFromAPI(organizationId);
        if (nextId) {
            return nextId;
        }

        // Fallback to timestamp-based ID
        return generateTimestampId(fullPrefix);
    } catch (error) {
        console.error('Error generating requirement ID:', error);
        return generateTimestampId('REQ');
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
        const prefix = 'REQ-DOC-';

        // Get existing requirement IDs for this document
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

        // Find the highest number using utility function
        const externalIds = requirements?.map((r) => r.external_id).filter(Boolean) as string[];
        const maxNumber = findMaxNumber(externalIds, prefix);

        // Generate the next ID
        return generateSequentialId({ prefix: 'REQ-DOC', length: 3 }, maxNumber + 1);
    } catch (error) {
        console.error('Error generating document-scoped requirement ID:', error);
        return generateTimestampId('REQ-DOC');
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
        const prefix = 'REQ-PROJ-';

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

        // Find the highest number using utility function
        const externalIds = requirements?.map((r) => r.external_id).filter(Boolean) as string[];
        const maxNumber = findMaxNumber(externalIds, prefix);

        // Generate the next ID
        return generateSequentialId({ prefix: 'REQ-PROJ', length: 3 }, maxNumber + 1);
    } catch (error) {
        console.error('Error generating project-scoped requirement ID:', error);
        return generateTimestampId('REQ-PROJ');
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

        const orgPrefix = generateOrgPrefix(org?.name || 'ORG');
        const prefix = `REQ-${orgPrefix}-`;

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

        // Find the highest number using utility function
        const externalIds = requirements?.map((r) => r.external_id).filter(Boolean) as string[];
        const maxNumber = findMaxNumber(externalIds, prefix);

        // Generate batch of IDs using utility function
        return generateBatchIds({ prefix: `REQ-${orgPrefix}`, length: 3 }, maxNumber + 1, count);
    } catch (error) {
        console.error('Error generating batch requirement IDs:', error);
        // Fallback to timestamp-based IDs
        const ids: string[] = [];
        for (let i = 0; i < count; i++) {
            ids.push(generateTimestampId('REQ'));
        }
        return ids;
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch organization name from API
 */
async function fetchOrganizationName(organizationId: string): Promise<string> {
    try {
        const response = await fetch(`/api/organizations/${organizationId}`, {
            method: 'GET',
            cache: 'no-store',
        });

        if (response.ok) {
            const payload = (await response.json()) as {
                organization?: { name?: string };
            };
            return payload.organization?.name || 'ORG';
        }

        return 'ORG';
    } catch (error) {
        console.error('Error fetching organization name:', error);
        return 'ORG';
    }
}

/**
 * Fetch next requirement ID from API
 */
async function fetchNextIdFromAPI(organizationId: string): Promise<string | null> {
    try {
        const response = await fetch(
            `/api/organizations/${organizationId}/requirements/next-id`,
            { method: 'GET', cache: 'no-store' },
        );

        if (response.ok) {
            const payload = (await response.json()) as { nextExternalId?: string };
            return payload.nextExternalId || null;
        }

        return null;
    } catch (error) {
        console.error('Error fetching next ID from API:', error);
        return null;
    }
}
