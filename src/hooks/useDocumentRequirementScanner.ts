import { useCallback, useState } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { generateBatchRequirementIds } from '@/lib/utils/requirementIdGenerator';

interface RequirementWithoutId {
    id?: string;
    name?: string;
    description?: string | null;
    external_id?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    status?: string;
    priority?: string;
    block_id?: string;
    block_name?: string;
}

interface UseDocumentRequirementScannerProps {
    documentId: string;
    organizationId: string;
}

export function useDocumentRequirementScanner({
    documentId,
    organizationId,
}: UseDocumentRequirementScannerProps) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();
    const [isScanning, setIsScanning] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [requirementsWithoutIds, setRequirementsWithoutIds] = useState<
        RequirementWithoutId[]
    >([]);

    const ensureClient = useCallback(() => {
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }
        return supabase;
    }, [supabase, authError]);

    // Auto-cleanup corrupted requirements
    const cleanupCorruptedRequirements = useCallback(
        async (requirements: Record<string, unknown>[]) => {
            const corruptedRequirements = requirements.filter(
                (req) =>
                    !req.id ||
                    !req.name ||
                    req.name === 'undefined' ||
                    req.external_id === 'undefined',
            );

            if (corruptedRequirements.length > 0) {
                console.log(
                    `🧹 Auto-cleaning ${corruptedRequirements.length} corrupted requirements...`,
                );

                try {
                    const client = ensureClient();
                    const { error } = await client
                        .from('requirements')
                        .update({ is_deleted: true })
                        .in(
                            'id',
                            corruptedRequirements
                                .map((req) => req.id)
                                .filter((id): id is string => typeof id === 'string'),
                        );

                    if (!error) {
                        console.log(
                            `✅ Auto-cleaned ${corruptedRequirements.length} corrupted requirements`,
                        );
                    }
                } catch (error) {
                    console.error(
                        '❌ Failed to auto-cleanup corrupted requirements:',
                        error,
                    );
                }
            }
        },
        [ensureClient],
    );

    // Scan all requirements in the document across all tables
    const scanDocumentRequirements = useCallback(async (): Promise<
        RequirementWithoutId[]
    > => {
        // Function to check if a requirement needs an ID
        const needsRequirementId = (externalId: string | null | undefined): boolean => {
            // Check for empty, null, or undefined
            if (!externalId || externalId.trim() === '') {
                console.log(`🔍 Requirement needs ID: external_id is empty/null`);
                return true;
            }

            // Check for placeholder values
            const placeholderValues = [
                'Will be generated',
                'REQ-001, REQ-002, etc',
                'etc',
                'TBD',
                'TODO',
                'N/A',
                '-',
                'PLACEHOLDER',
            ];

            const normalizedId = externalId.trim().toLowerCase();
            const matchedPlaceholder = placeholderValues.find((placeholder) =>
                normalizedId.includes(placeholder.toLowerCase()),
            );

            if (matchedPlaceholder) {
                console.log(
                    `🔍 Requirement needs ID: "${externalId}" is a placeholder (matched: "${matchedPlaceholder}")`,
                );
                return true;
            }

            // Check for proper REQ-ID format (case-insensitive check first)
            const upperExternalId = externalId.toUpperCase();

            console.log(`🔍 Checking format for: "${upperExternalId}"`);

            // Valid organization-scoped format (REQ-XXX-###)
            if (upperExternalId.match(/^REQ-[A-Z]{2,4}-\d{3}$/)) {
                console.log(`✅ Valid organization-scoped ID: "${externalId}"`);
                return false;
            }

            // Valid simple format (REQ-###)
            if (upperExternalId.match(/^REQ-\d{3}$/)) {
                console.log(`✅ Valid simple ID: "${externalId}"`);
                return false;
            }

            // Valid legacy single/double digit IDs (REQ-1, REQ-2, etc.)
            if (upperExternalId.match(/^REQ-\d{1,2}$/)) {
                console.log(`✅ Valid legacy ID: "${externalId}"`);
                return false;
            }

            // If none of the valid patterns match, it needs a new ID
            console.log(`🔍 Requirement needs ID: "${externalId}" has invalid format`);
            return true;
        };

        setIsScanning(true);
        try {
            console.log('🔍 Scanning document for requirements without proper IDs...');

            const client = ensureClient();

            // First, get all blocks in the document
            const { data: blocks, error: blocksError } = await client
                .from('blocks')
                .select('id, name, type')
                .eq('document_id', documentId)
                .eq('type', 'table')
                .eq('is_deleted', false);

            if (blocksError) {
                console.error('Error fetching blocks:', blocksError);
                throw new Error('Failed to fetch document blocks');
            }

            if (!blocks || blocks.length === 0) {
                console.log('No table blocks found in document');
                return [];
            }

            console.log(`Found ${blocks.length} table blocks in document`);

            // Get all requirements from all table blocks
            const { data: requirements, error: requirementsError } = await client
                .from('requirements')
                .select(
                    `
                    id,
                    name,
                    description,
                    external_id,
                    created_at,
                    created_by,
                    status,
                    priority,
                    block_id,
                    blocks!inner(name)
                `,
                )
                .in(
                    'block_id',
                    blocks.map((block) => block.id),
                )
                .eq('is_deleted', false)
                .not('id', 'is', null)
                .not('name', 'is', null)
                .not('name', 'eq', 'undefined');

            if (requirementsError) {
                console.error('Error fetching requirements:', requirementsError);
                throw new Error('Failed to fetch requirements');
            }

            if (!requirements || requirements.length === 0) {
                console.log('No requirements found in document');
                return [];
            }

            console.log(`Found ${requirements.length} total requirements in document`);

            // Auto-cleanup corrupted requirements
            await cleanupCorruptedRequirements(requirements);

            // Debug: Log all requirements to identify issues
            console.log(
                '📋 All requirements found:',
                requirements.map((req) => ({
                    id: req.id,
                    name: req.name,
                    external_id: req.external_id,
                    block_name: (req.blocks as Record<string, unknown>)?.name,
                })),
            );

            // Filter requirements that need IDs with additional validation
            const requirementsNeedingIds = requirements
                .filter((req) => {
                    // Basic validation - ensure requirement has required fields
                    if (
                        !req.id ||
                        !req.name ||
                        req.name.trim() === '' ||
                        req.name === 'undefined'
                    ) {
                        console.warn(`⚠️ Skipping invalid requirement:`, req);
                        return false;
                    }

                    // Skip requirements with corrupted external_id (but allow null/empty for processing)
                    if (req.external_id === 'undefined') {
                        console.warn(
                            `⚠️ Skipping requirement with corrupted external_id:`,
                            req,
                        );
                        return false;
                    }

                    // Check if it needs an ID
                    return needsRequirementId(req.external_id);
                })
                .map((req) => ({
                    ...req,
                    block_name:
                        typeof (req.blocks as Record<string, unknown>)?.name === 'string'
                            ? ((req.blocks as Record<string, unknown>).name as string)
                            : 'Unknown Table',
                }));

            console.log(
                `Found ${requirementsNeedingIds.length} requirements needing IDs`,
            );

            setRequirementsWithoutIds(requirementsNeedingIds);
            return requirementsNeedingIds;
        } catch (error) {
            console.error('Error scanning document requirements:', error);
            throw error;
        } finally {
            setIsScanning(false);
        }
    }, [documentId, cleanupCorruptedRequirements, ensureClient]);

    // Assign REQ-IDs to selected requirements
    const assignRequirementIds = useCallback(
        async (selectedRequirementIds: string[]): Promise<void> => {
            if (selectedRequirementIds.length === 0) {
                throw new Error('No requirements selected for ID assignment');
            }

            setIsAssigning(true);
            try {
                console.log(
                    `🏷️ Assigning REQ-IDs to ${selectedRequirementIds.length} requirements...`,
                );

                // Generate all IDs in batch to ensure proper incrementing
                const client = ensureClient();
                console.log(
                    `🏷️ Generating ${selectedRequirementIds.length} REQ-IDs for organization ${organizationId}...`,
                );
                const newExternalIds = await generateBatchRequirementIds(
                    client,
                    organizationId,
                    selectedRequirementIds.length,
                );
                console.log(`🏷️ Generated batch IDs:`, newExternalIds);

                // Batch update all requirements at once for maximum performance
                console.log(
                    `🔄 Batch updating ${selectedRequirementIds.length} requirements...`,
                );

                // Use Promise.all for parallel updates (faster than sequential)
                const updatePromises = selectedRequirementIds.map(
                    async (requirementId, i) => {
                        const newExternalId = newExternalIds[i];

                        const { error } = await client
                            .from('requirements')
                            .update({ external_id: newExternalId })
                            .eq('id', requirementId);

                        if (error) {
                            console.error(
                                `❌ Failed to update requirement ${requirementId}:`,
                                error,
                            );
                            return {
                                requirementId,
                                newExternalId,
                                success: false,
                                error: error.message,
                            };
                        }

                        return { requirementId, newExternalId, success: true };
                    },
                );

                const results = await Promise.all(updatePromises);

                const successCount = results.filter((r) => r.success).length;
                const failureCount = results.filter((r) => !r.success).length;

                console.log(`✅ Successfully assigned ${successCount} REQ-IDs`);
                if (failureCount > 0) {
                    console.warn(`⚠️ Failed to assign ${failureCount} REQ-IDs`);
                }

                // Update local state to remove successfully assigned requirements
                const successfulIds = results
                    .filter((r) => r.success)
                    .map((r) => r.requirementId);
                setRequirementsWithoutIds((prev) =>
                    prev.filter((req) => !successfulIds.includes(req.id || '')),
                );
            } catch (error) {
                console.error('Error assigning requirement IDs:', error);
                throw error;
            } finally {
                setIsAssigning(false);
            }
        },
        [ensureClient, organizationId],
    );

    return {
        isScanning,
        isAssigning,
        requirementsWithoutIds,
        scanDocumentRequirements,
        assignRequirementIds,
        setRequirementsWithoutIds,
        authLoading,
    };
}
