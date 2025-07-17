import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase/supabaseBrowser';
import { generateBatchRequirementIds } from '@/lib/utils/requirementIdGenerator';
import { Requirement } from '@/types/base/requirements.types';

interface RequirementWithoutId {
    id?: string;
    name?: string;
    external_id?: string | null;
}

export function useRequirementIdAssignment(documentId: string) {
    const [isAssigning, setIsAssigning] = useState(false);

    /**
     * Checks if a requirement needs a REQ-ID
     */
    const needsRequirementId = useCallback((requirement: Partial<Requirement>) => {
        const externalId = requirement.external_id;

        // Skip corrupted requirements with undefined name or external_id
        if (
            !requirement.id ||
            !requirement.name ||
            requirement.name === 'undefined' ||
            externalId === 'undefined'
        ) {
            console.warn(`⚠️ Skipping corrupted requirement:`, requirement);
            return false; // Don't process corrupted requirements
        }

        // Check for empty, null, or undefined
        if (!externalId || externalId.trim() === '') {
            console.log(
                `Requirement ${requirement.id} (${requirement.name}) needs ID. Current external_id: "${externalId}" (empty)`,
            );
            return true;
        }

        // Check for placeholder values
        const placeholderValues = [
            'Will be generated',
            'REQ-001, REQ-002, etc',
            'REQ-001',
            'etc',
            '-',
            'N/A',
            'TBD',
            'TODO',
            'PLACEHOLDER',
        ];

        const normalizedId = externalId.trim().toLowerCase();
        const isPlaceholder = placeholderValues.some((placeholder) =>
            normalizedId.includes(placeholder.toLowerCase()),
        );

        if (isPlaceholder) {
            console.log(
                `Requirement ${requirement.id} (${requirement.name}) needs ID. Current external_id: "${externalId}" (placeholder)`,
            );
            return true;
        }

        // Check for valid REQ-ID patterns (case-insensitive)
        const upperExternalId = externalId.toUpperCase();

        // Valid organization-scoped format (REQ-XXX-###)
        if (upperExternalId.match(/^REQ-[A-Z]{2,4}-\d{3,}$/)) {
            return false; // Valid organization-scoped format
        }

        // Valid simple format (REQ-###)
        if (upperExternalId.match(/^REQ-\d{3,}$/)) {
            return false; // Valid simple format
        }

        // Valid legacy single/double digit IDs (REQ-1, REQ-2, etc.)
        if (upperExternalId.match(/^REQ-\d{1,2}$/)) {
            return false; // Valid legacy format
        }

        // If none of the valid patterns match, it needs a new ID
        console.log(
            `Requirement ${requirement.id} (${requirement.name}) needs ID. Current external_id: "${externalId}" (invalid format)`,
        );
        return true;

        return false;
    }, []);

    /**
     * Finds all requirements that need REQ-IDs
     */
    const findRequirementsWithoutIds = useCallback(
        (requirements: Partial<Requirement>[]): RequirementWithoutId[] => {
            console.log(`Checking ${requirements.length} requirements for missing IDs`);
            const found = requirements.filter(needsRequirementId).map((req) => ({
                id: req.id,
                name: req.name,
                external_id: req.external_id,
            }));

            console.log(`Found ${found.length} requirements needing IDs:`, found);
            return found;
        },
        [needsRequirementId],
    );

    /**
     * Assigns REQ-IDs to multiple requirements in batch
     */
    const assignRequirementIds = useCallback(
        async (requirementIds: string[]): Promise<boolean> => {
            if (requirementIds.length === 0) return true;

            // Filter out empty requirement IDs
            const validRequirementIds = requirementIds.filter(
                (id) => id && id.trim() !== '',
            );

            if (validRequirementIds.length === 0) {
                console.warn('No valid requirement IDs provided');
                return true;
            }

            setIsAssigning(true);
            try {
                // Get organization ID from document
                const { data: document, error: docError } = await supabase
                    .from('documents')
                    .select(
                        `
                        project_id,
                        projects!inner(organization_id)
                    `,
                    )
                    .eq('id', documentId)
                    .single();

                if (docError || !document) {
                    console.error('Error fetching document:', docError);
                    throw new Error('Failed to fetch document information');
                }

                const organizationId = (
                    document as {
                        projects?: { organization_id?: string };
                    }
                )?.projects?.organization_id;

                if (!organizationId) {
                    throw new Error('Organization ID not found');
                }

                // Generate all REQ-IDs in batch to avoid duplicates
                console.log(
                    `Generating ${validRequirementIds.length} requirement IDs...`,
                );
                const externalIds = await generateBatchRequirementIds(
                    organizationId,
                    validRequirementIds.length,
                );

                if (externalIds.length !== validRequirementIds.length) {
                    throw new Error(
                        `Expected ${validRequirementIds.length} IDs but got ${externalIds.length}`,
                    );
                }

                // Create updates array
                const updates: Array<{ id: string; external_id: string }> = [];
                for (let i = 0; i < validRequirementIds.length; i++) {
                    const requirementId = validRequirementIds[i];
                    const externalId = externalIds[i];

                    if (!externalId || externalId.trim() === '') {
                        throw new Error(
                            `Generated empty external ID for requirement ${requirementId}`,
                        );
                    }

                    updates.push({
                        id: requirementId,
                        external_id: externalId,
                    });
                }

                // Validate no duplicates in generated IDs
                const generatedIds = updates.map((u) => u.external_id);
                const uniqueIds = new Set(generatedIds);
                if (uniqueIds.size !== generatedIds.length) {
                    throw new Error('Duplicate requirement IDs generated');
                }

                console.log(
                    'Generated requirement IDs:',
                    updates.map((u) => u.external_id),
                );

                // Batch update all requirements
                const updatePromises = updates.map(({ id, external_id }) =>
                    supabase
                        .from('requirements')
                        .update({
                            external_id,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', id),
                );

                const results = await Promise.allSettled(updatePromises);

                // Check for any failures
                const failures = results.filter((result) => result.status === 'rejected');

                if (failures.length > 0) {
                    console.error('Some requirement ID assignments failed:', failures);
                    throw new Error(
                        `Failed to assign ${failures.length} out of ${updates.length} requirement IDs`,
                    );
                }

                console.log(`Successfully assigned ${updates.length} requirement IDs`);
                return true;
            } catch (error) {
                console.error('Error assigning requirement IDs:', error);
                throw error;
            } finally {
                setIsAssigning(false);
            }
        },
        [documentId],
    );

    return {
        needsRequirementId,
        findRequirementsWithoutIds,
        assignRequirementIds,
        isAssigning,
    };
}
