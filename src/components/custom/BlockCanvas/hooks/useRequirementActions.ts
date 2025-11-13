import { useCallback, useRef } from 'react';
import { v4 as _uuidv4 } from 'uuid';

/* eslint-disable @typescript-eslint/no-unused-vars */

import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Property } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { generateNextRequirementId } from '@/lib/utils/requirementIdGenerator';
import { Json, TablesInsert, TablesUpdate } from '@/types/base/database.types';
import {
    ERequirementPriority,
    ERequirementStatus,
    RequirementPriority,
    RequirementStatus,
    RequirementFormat as _RequirementFormat,
    RequirementLevel as _RequirementLevel,
} from '@/types/base/enums.types';
import { Requirement, RequirementAiAnalysis } from '@/types/base/requirements.types';

// Type for the requirement data that will be displayed in the table
export type DynamicRequirement = {
    id: string;
    ai_analysis: RequirementAiAnalysis;
} & {
    position?: number;
    height?: number;
} & {
    [key in Exclude<string, 'position' | 'height'>]?: CellValue;
};

interface UseRequirementActionsProps {
    blockId: string;
    documentId: string;
    localRequirements: Requirement[];
    setLocalRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
    properties: Property[] | undefined;
}

export const useRequirementActions = ({
    blockId,
    documentId,
    localRequirements,
    setLocalRequirements,
    properties,
}: UseRequirementActionsProps) => {
    const _createRequirementMutation = useCreateRequirement();
    const _updateRequirementMutation = useUpdateRequirement();
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const { getClientOrThrow } = useAuthenticatedSupabase();

    // Function to refresh requirements from the database
    const refreshRequirements = useCallback(async () => {
        console.log('🎯 STEP 6: refreshRequirements called');
        try {
            // Add a small delay to handle potential database replication lag
            console.log('🎯 STEP 6a: Waiting 100ms for database replication lag');
            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log('✅ STEP 6a: Delay completed, fetching from database');

            console.log('🎯 STEP 6b: Fetching fresh requirements from database', {
                blockId,
                documentId,
            });
            const supabase = getClientOrThrow();
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position', { ascending: true });

            if (error) {
                console.error('❌ STEP 6b: Database fetch failed:', error);
                throw error;
            }
            if (!requirements) {
                console.log('⚠️ STEP 6b: No requirements returned from database');
                return;
            }

            console.log(
                '✅ STEP 6b: Database fetch successful. Count:',
                requirements.length,
            );
            console.log('🎯 STEP 6c: Replacing local state with database data');
            setLocalRequirements(requirements);
            console.log('✅ STEP 6c: Local state replaced with fresh database data');
        } catch (error) {
            console.error('❌ STEP 6: Error refreshing requirements:', error);
        }
    }, [blockId, documentId, getClientOrThrow, setLocalRequirements]);

    // Natural field keys present as top-level DB columns
    const NATURAL_FIELD_KEYS = new Set([
        'name',
        'description',
        'external_id',
        'status',
        'priority',
    ]);

    // Helper function to create properties object from dynamic requirement
    const createPropertiesObjectFromDynamicReq = async (
        dynamicReq: DynamicRequirement,
    ) => {
        if (!properties) return { propertiesObj: {}, naturalFields: {} };

        // Fetch block columns to get position information; if none exist (new requirements table),
        // synthesize natural field "virtual" positions to avoid blocking saves.
        const supabase = getClientOrThrow();
        const { data: blockColumns } = await supabase
            .from('columns')
            .select('*')
            .eq('block_id', blockId)
            .order('position');

        const propertiesObj: Record<string, unknown> = {};
        const naturalFields: Record<string, string> = {};

        // Process each property
        properties.forEach((prop) => {
            const value = dynamicReq[prop.name];
            // Support both real and virtual columns: match by real property_id, then by property name
            const propNameLc = (prop.name || '').toLowerCase();
            const column =
                blockColumns?.find((col) => col.property_id === prop.id) ||
                (blockColumns || []).find((c) => {
                    const cNameLc = (
                        (c as unknown as { property?: { name?: string } })?.property?.name
                            ? ((c as unknown as { property?: { name?: string } })
                                  ?.property?.name as string)
                            : ''
                    ).toLowerCase();
                    if (!cNameLc) return false;
                    // Deduplicate case-insensitively against both UI names and DB keys
                    if (
                        c.id?.startsWith('virtual-') ||
                        c.property_id?.startsWith('virtual-')
                    ) {
                        return (
                            cNameLc === propNameLc ||
                            cNameLc === 'external_id' ||
                            cNameLc === 'name' ||
                            cNameLc === 'description' ||
                            cNameLc === 'status' ||
                            cNameLc === 'priority'
                        );
                    }
                    return cNameLc === propNameLc;
                });
            const lowerCaseName = prop.name.toLowerCase();

            // Check if this property maps to a natural field
            if (NATURAL_FIELD_KEYS.has(lowerCaseName)) {
                naturalFields[lowerCaseName] = typeof value === 'string' ? value : '';
                // Do not duplicate natural fields inside JSON properties; DB owns these columns
                return;
            }

            if (column) {
                propertiesObj[prop.name] = {
                    key: prop.name,
                    type: prop.property_type,
                    value: value ?? '',
                    options: prop.options,
                    position: column.position,
                    column_id: column.id,
                    property_id: prop.id,
                };
            }
        });

        // Fix dynamic value capture: Check for keys in dynamicReq that might not be in properties array yet
        // This handles newly created columns during paste that haven't been synced to the properties array
        const processedKeys = new Set(Object.keys(propertiesObj));
        const dynamicReqKeys = Object.keys(dynamicReq).filter(
            (key) =>
                key !== 'id' &&
                key !== 'ai_analysis' &&
                !NATURAL_FIELD_KEYS.has(key.toLowerCase()),
        );

        console.debug('[fix][dynamic-values] Checking dynamicReq keys:', dynamicReqKeys);
        console.debug(
            '[fix][dynamic-values] Already processed keys:',
            Array.from(processedKeys),
        );

        for (const key of dynamicReqKeys) {
            // Skip if already processed or if it's a natural field
            if (processedKeys.has(key) || NATURAL_FIELD_KEYS.has(key.toLowerCase())) {
                continue;
            }

            const val = dynamicReq[key];
            // Check if it's a valid value that should be saved
            if (
                typeof val === 'string' ||
                typeof val === 'number' ||
                Array.isArray(val) ||
                val === null
            ) {
                // Find the column in blockColumns to get metadata
                const column = blockColumns?.find((col) => {
                    const propName = (col as unknown as { property?: { name?: string } })
                        ?.property?.name;
                    return propName && propName.toLowerCase() === key.toLowerCase();
                });

                if (column) {
                    // Create propertiesObj entry for this dynamic column
                    propertiesObj[key] = {
                        key,
                        type: 'text', // Default to text for dynamic columns
                        value: val ?? '',
                        position: column.position ?? 0,
                        column_id: column.id,
                        property_id: column.property_id,
                    };
                    console.debug(
                        `[fix][dynamic-values] Added new dynamic column ${key} with value:`,
                        val,
                    );
                } else {
                    // Column not found in DB yet, but we still want to save the value
                    // This can happen if column was just created and hasn't synced yet
                    propertiesObj[key] = {
                        key,
                        type: 'text',
                        value: val ?? '',
                        position: 0,
                    };
                    console.debug(
                        `[fix][dynamic-values] Added dynamic column ${key} (column not in DB yet) with value:`,
                        val,
                    );
                }
            }
        }

        console.debug(
            '[fix][dynamic-values] Final propertiesObj keys:',
            Object.keys(propertiesObj),
        );

        return { propertiesObj, naturalFields };
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements) {
            return [];
        }

        return localRequirements
            .filter((req) => !deletedRowIdsRef.current.has(req.id)) // Filter out deleted
            .map((req) => {
                const dynamicReq: DynamicRequirement = {
                    id: req.id,
                    ai_analysis: req.ai_analysis as RequirementAiAnalysis,
                };

                // Extract values from properties object
                if (req.properties) {
                    Object.entries(req.properties).forEach(([key, prop]) => {
                        if (
                            typeof prop === 'object' &&
                            prop !== null &&
                            'value' in prop
                        ) {
                            // Ensure we only assign CellValue compatible values
                            const value = prop.value;
                            if (
                                typeof value === 'string' ||
                                typeof value === 'number' ||
                                value instanceof Date ||
                                Array.isArray(value) ||
                                value === null
                            ) {
                                dynamicReq[key] = value as CellValue;
                            } else {
                                dynamicReq[key] = String(value);
                            }
                        } else if (
                            typeof prop === 'string' ||
                            typeof prop === 'number' ||
                            prop === null ||
                            (Array.isArray(prop) &&
                                prop.every((item) => typeof item === 'string'))
                        ) {
                            dynamicReq[key] = prop as CellValue;
                        } else {
                            // Convert other types to string
                            dynamicReq[key] = String(prop);
                        }
                    });
                }

                // Overlay DB top-level fields for natural properties so UI shows true values
                if (properties && properties.length > 0) {
                    properties.forEach((prop) => {
                        const keyLc = prop.name.toLowerCase();
                        if (!NATURAL_FIELD_KEYS.has(keyLc)) return;
                        switch (keyLc) {
                            case 'name':
                                dynamicReq[prop.name] = (req.name ??
                                    '') as unknown as CellValue;
                                break;
                            case 'description':
                                dynamicReq[prop.name] = (req.description ??
                                    '') as unknown as CellValue;
                                break;
                            case 'external_id':
                                dynamicReq[prop.name] = (req.external_id ??
                                    '') as unknown as CellValue;
                                break;
                            case 'status':
                                // Use raw DB enum value to match select option values
                                dynamicReq[prop.name] =
                                    req.status as unknown as string as unknown as CellValue;
                                break;
                            case 'priority':
                                // Use raw DB enum value to match select option values
                                dynamicReq[prop.name] =
                                    req.priority as unknown as string as unknown as CellValue;
                                break;
                        }
                    });
                }

                return dynamicReq;
            });
    };

    // Helper function to format enum values for display
    const _formatEnumValueForDisplay = (value: unknown): string => {
        if (!value || typeof value !== 'string') return '';

        // Handle snake_case values (e.g., "in_progress" -> "In Progress")
        if (value.includes('_')) {
            return value
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        // Handle simple values (e.g., "draft" -> "Draft")
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    // Helper function to convert display values back to enum values
    const _parseDisplayValueToEnum = (displayValue: string): ERequirementStatus => {
        if (!displayValue) return RequirementStatus.draft;

        // First, normalize the input by converting to lowercase and replacing spaces with underscores
        const normalizedValue = displayValue.toLowerCase().replace(/\s+/g, '_');

        // Map of common variations to correct enum values
        const statusMap: Record<string, ERequirementStatus> = {
            archive: RequirementStatus.archived,
            archival: RequirementStatus.archived,
            active: RequirementStatus.active,
            archived: RequirementStatus.archived,
            draft: RequirementStatus.draft,
            deleted: RequirementStatus.deleted,
            in_review: RequirementStatus.in_review,
            review: RequirementStatus.in_review,
            in_progress: RequirementStatus.in_progress,
            progress: RequirementStatus.in_progress,
            approved: RequirementStatus.approved,
            rejected: RequirementStatus.rejected,
        };

        // Return the mapped value if it exists, otherwise return draft as default
        return statusMap[normalizedValue] || RequirementStatus.draft;
    };

    // Helper function to convert display values back to priority enum values
    const _parseDisplayValueToPriority = (displayValue: string): ERequirementPriority => {
        if (!displayValue) return RequirementPriority.low as ERequirementPriority;

        const normalizedValue = displayValue.toLowerCase().replace(/\s+/g, '_');
        const priorityMap: Record<string, ERequirementPriority> = {
            low: RequirementPriority.low as ERequirementPriority,
            medium: RequirementPriority.medium as ERequirementPriority,
            high: RequirementPriority.high as ERequirementPriority,
            critical: RequirementPriority.critical as ERequirementPriority,
        };
        return (
            priorityMap[normalizedValue] ||
            (RequirementPriority.low as ERequirementPriority)
        );
    };

    const getLastPosition = async (): Promise<number> => {
        try {
            const supabase = getClientOrThrow();
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('position')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (!requirements || requirements.length === 0) return 0;

            return (requirements[0].position || 0) + 1;
        } catch (error) {
            console.error('Error getting last position:', error);
            return 0;
        }
    };

    // Save a requirement
    const saveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId: string,
        userName: string,
        skipRefresh: boolean = false,
    ) => {
        console.log('🎯 STEP 5: saveRequirement called in useRequirementActions', {
            isNew,
            userId,
            userName,
            dynamicReq,
        });

        try {
            const supabase = getClientOrThrow();
            console.log(
                '🎯 STEP 5a: Creating properties object from dynamic requirement',
            );
            // Create properties object and extract natural fields
            const { propertiesObj, naturalFields } =
                await createPropertiesObjectFromDynamicReq(dynamicReq);
            console.log('✅ STEP 5a: Properties object created:', {
                propertiesObj,
                naturalFields,
            });
            console.debug(
                '[saveRequirement][properties keys]',
                Object.keys(propertiesObj || {}),
            );

            // Initialize with an empty history object
            let analysis_history: RequirementAiAnalysis = {
                descriptionHistory: [],
            };

            // Handle possible undefined or null ai_analysis
            if (dynamicReq.ai_analysis) {
                try {
                    // Clone the analysis_history to avoid mutation issues
                    analysis_history = JSON.parse(JSON.stringify(dynamicReq.ai_analysis));

                    // Ensure descriptionHistory is always an array even after cloning
                    if (!analysis_history?.descriptionHistory) {
                        analysis_history = {
                            descriptionHistory: [],
                        };
                    }
                } catch (e) {
                    // If parsing fails, fall back to the default empty history
                    console.error('Error parsing ai_analysis:', e);
                    analysis_history = {
                        descriptionHistory: [],
                    };
                }
            }

            // Safely push the new history item (analysis_history is guaranteed to be non-null at this point)
            analysis_history.descriptionHistory.push({
                description: naturalFields.description || '',
                createdAt: new Date().toISOString(),
                createdBy: userName || 'Unknown',
            });

            // Validate and normalize the status value if it exists
            let status: ERequirementStatus | undefined;
            if (naturalFields?.status) {
                status = _parseDisplayValueToEnum(naturalFields.status);

                // Validate that the status is a valid enum value
                if (!Object.values(RequirementStatus).includes(status)) {
                    throw new Error(`Invalid status value: ${status}`);
                }
            }

            // Normalize priority if provided
            let priorityEnum: ERequirementPriority | undefined;
            if (naturalFields?.priority) {
                priorityEnum = _parseDisplayValueToPriority(naturalFields.priority);
            }

            // Normalize and validate name (DB requires min length when trimmed)
            const normalizedName = (naturalFields?.name || '').trim();
            const safeName =
                normalizedName.length >= 2 ? normalizedName : 'New Requirement';

            const baseData = {
                ai_analysis: analysis_history,
                block_id: blockId,
                document_id: documentId,
                properties: propertiesObj as unknown as Json, // Keep additional per-column values in JSON
                updated_by: userId,
                // Allow description/external_id/status/priority when provided
                ...(naturalFields?.description && {
                    description: naturalFields.description,
                }),
                ...(naturalFields?.external_id && {
                    external_id: naturalFields.external_id,
                }),
                ...(status && { status }),
                ...(priorityEnum && { priority: priorityEnum }),
            } as Partial<Requirement>;

            let savedRequirement: Requirement;
            if (isNew) {
                console.log('🎯 STEP 5b: Processing new requirement');
                // Get the last position for new requirements
                console.log('🎯 STEP 5c: Getting last position for new requirement');
                const position = await getLastPosition();
                console.log('✅ STEP 5c: Got position:', position);

                // Generate auto requirement ID if not provided
                let externalId = naturalFields?.external_id;
                if (
                    !externalId ||
                    (typeof externalId === 'string' && externalId.trim() === '') ||
                    externalId === 'GENERATING...'
                ) {
                    try {
                        // Resolve organizationId via API route instead of client-side join
                        const resp = await fetch(`/api/documents/${documentId}`, {
                            method: 'GET',
                            cache: 'no-store',
                        });
                        if (resp.ok) {
                            const payload = (await resp.json()) as {
                                organizationId?: string | null;
                            };
                            const organizationId = payload.organizationId ?? null;
                            if (organizationId) {
                                externalId = await generateNextRequirementId(
                                    supabase,
                                    organizationId,
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error generating requirement ID:', error);
                    }

                    // Fallback if auto-generation fails
                    if (!externalId) {
                        const timestamp = Date.now().toString().slice(-6);
                        externalId = `REQ-${timestamp}`;
                    }
                }

                const newRequirementData = {
                    ...baseData,
                    created_by: userId,
                    name: safeName,
                    external_id: externalId,
                    position, // Add the position field
                    // Ensure ai_analysis is properly initialized
                    ai_analysis: {
                        descriptionHistory: [
                            {
                                description: naturalFields?.description || '',
                                createdAt: new Date().toISOString(),
                                createdBy: userName || 'Unknown',
                            },
                        ],
                    },
                };

                console.log(
                    '🎯 STEP 5d: Inserting new requirement into database:',
                    newRequirementData,
                );
                const insertPayload =
                    newRequirementData as unknown as TablesInsert<'requirements'>;
                const { data, error } = await supabase
                    .from('requirements')
                    .insert(insertPayload)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ STEP 5d: Database insertion failed:', error);
                    throw error;
                }
                if (!data) {
                    console.error('❌ STEP 5d: No data returned from insert');
                    throw new Error('No data returned from insert');
                }
                savedRequirement = data;
                console.log(
                    '✅ STEP 5d: Database insertion successful:',
                    savedRequirement,
                );

                // Update local state with the new requirement immediately without refetching
                console.log('🎯 STEP 5e: Updating local state with new requirement');
                setLocalRequirements((prev) => {
                    const newState = [...prev, savedRequirement];
                    console.log(
                        '✅ STEP 5e: Local state updated. New count:',
                        newState.length,
                    );
                    return newState;
                });
            } else {
                // For updates, only include fields that have values to avoid nullifying existing data
                const updateData: Partial<Requirement> = {
                    ...baseData,
                    updated_at: new Date().toISOString(),
                };

                // Only update name when provided and meets constraint
                if (naturalFields?.name && naturalFields.name.trim().length >= 2) {
                    updateData.name = naturalFields.name.trim();
                }

                // If position is provided in the dynamic requirement, include it in the update
                if ('position' in dynamicReq) {
                    updateData.position = dynamicReq.position as number;
                }

                const updatePayload =
                    updateData as unknown as TablesUpdate<'requirements'>;
                const { data, error } = await supabase
                    .from('requirements')
                    .update(updatePayload)
                    .eq('id', dynamicReq.id)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from update');
                savedRequirement = data;

                // Update local state with the updated requirement immediately without refetching
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === savedRequirement.id ? savedRequirement : req,
                    ),
                );
            }

            return savedRequirement;
            // Note: removed unreachable console.log below
            // console.log('🎉 STEP 5: saveRequirement completed successfully');
        } catch (error) {
            console.error('❌ STEP 5: Error saving requirement:', error);
            throw error;
        }
    };

    // Delete a requirement
    const deleteRequirement = async (dynamicReq: DynamicRequirement, userId: string) => {
        const supabase = getClientOrThrow();

        // Check for existing relationships (depth > 0) before deletion
        const { data: relationships, error: checkError } = await supabase
            .from('requirements_closure')
            .select('ancestor_id, descendant_id, depth')
            .or(`ancestor_id.eq.${dynamicReq.id},descendant_id.eq.${dynamicReq.id}`)
            .gt('depth', 0)
            .limit(1);

        if (checkError) {
            console.error('Error checking relationships:', checkError);
            throw new Error('Failed to check relationships before deletion');
        }

        if (relationships && relationships.length > 0) {
            throw new Error(
                'Cannot delete requirement with existing relationships. Please disconnect all relationships first on the Traceability page.',
            );
        }

        // Soft delete the requirement
        const { error: reqError } = await supabase
            .from('requirements')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: userId,
            })
            .eq('id', dynamicReq.id);

        if (reqError) {
            throw reqError;
        }

        // Delete the closure table self-reference (depth=0)
        // NOTE: closure table doesn't have is_deleted field, so we hard delete
        const { error: closureError } = await supabase
            .from('requirements_closure')
            .delete()
            .eq('ancestor_id', dynamicReq.id)
            .eq('descendant_id', dynamicReq.id)
            .eq('depth', 0);

        if (closureError) {
            console.error('Error deleting closure table entry:', closureError);
            // Don't throw - requirement is already deleted, just log the error
        }

        // Note: UI state update happens in the caller (handleConfirmDelete)
        // to ensure proper error handling and rollback
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createPropertiesObjectFromDynamicReq,
        refreshRequirements, // still available for manual refresh but not called automatically
    };
};
