import { useCallback } from 'react';
import { v4 as _uuidv4 } from 'uuid';

import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Property } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { generateNextRequirementId } from '@/lib/utils/requirementIdGenerator';
import { Json } from '@/types/base/database.types';
import {
    ERequirementPriority,
    ERequirementStatus,
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
    }, [blockId, documentId, setLocalRequirements]);

    // Helper function to create properties object from dynamic requirement
    const createPropertiesObjectFromDynamicReq = async (
        dynamicReq: DynamicRequirement,
    ) => {
        if (!properties) return { propertiesObj: {}, naturalFields: {} };

        // Fetch block columns to get position information
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
            const column = blockColumns?.find((col) => col.property_id === prop.id);
            const lowerCaseName = prop.name.toLowerCase();

            // Check if this property maps to a natural field
            if (
                ['name', 'description', 'external_id', 'status', 'priority'].includes(
                    lowerCaseName,
                )
            ) {
                naturalFields[lowerCaseName] = typeof value === 'string' ? value : '';
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

        return { propertiesObj, naturalFields };
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements) {
            return [];
        }

        return localRequirements.map((req) => {
            const dynamicReq: DynamicRequirement = {
                id: req.id,
                ai_analysis: req.ai_analysis as RequirementAiAnalysis,
            };

            // Extract values from properties object
            if (req.properties) {
                Object.entries(req.properties).forEach(([key, prop]) => {
                    if (typeof prop === 'object' && prop !== null && 'value' in prop) {
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

    const getLastPosition = async (): Promise<number> => {
        try {
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
    ) => {
        console.log('🎯 STEP 5: saveRequirement called in useRequirementActions', {
            isNew,
            userId,
            userName,
            dynamicReq,
        });

        try {
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

            const requirementData = {
                ai_analysis: analysis_history,
                block_id: blockId,
                document_id: documentId,
                properties: propertiesObj as unknown as Json, // Ensure properties is treated as Json
                updated_by: userId,
                // Use natural fields from properties if they exist
                ...(naturalFields?.name && { name: naturalFields.name }),
                ...(naturalFields?.description && {
                    description: naturalFields.description,
                }),
                ...(naturalFields?.external_id && {
                    external_id: naturalFields.external_id,
                }),
                ...(status && { status }),
                ...(naturalFields?.priority && {
                    priority: naturalFields.priority as ERequirementPriority,
                }),
            };

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

                        if (!docError && document) {
                            const organizationId = (
                                document as {
                                    projects?: { organization_id?: string };
                                }
                            )?.projects?.organization_id;
                            if (organizationId) {
                                externalId =
                                    await generateNextRequirementId(organizationId);
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
                    ...requirementData,
                    created_by: userId,
                    name: naturalFields?.name || 'New Requirement', // Default name for new requirements
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
                const { data, error } = await supabase
                    .from('requirements')
                    .insert(newRequirementData)
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
                    ...requirementData,
                    updated_at: new Date().toISOString(),
                };

                // If position is provided in the dynamic requirement, include it in the update
                if ('position' in dynamicReq) {
                    updateData.position = dynamicReq.position as number;
                }

                const { data, error } = await supabase
                    .from('requirements')
                    .update(updateData)
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
    const deleteRequirement = async (dynamicReq: DynamicRequirement, _userId: string) => {
        try {
            const { error } = await supabase
                .from('requirements')
                .delete()
                .eq('id', dynamicReq.id);

            if (error) throw error;

            // Update local state by removing the deleted requirement immediately without refetching
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== dynamicReq.id),
            );
        } catch (error) {
            console.error('Error deleting requirement:', error);
            throw error;
        }
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createPropertiesObjectFromDynamicReq,
        refreshRequirements, // still available for manual refresh but not called automatically
    };
};
