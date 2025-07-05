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
import {
    Requirement,
    RequirementAiAnalysis,
} from '@/types/base/requirements.types';

// Type for the requirement data that will be displayed in the table
export type DynamicRequirement = {
    id: string;
    ai_analysis: RequirementAiAnalysis;
    [key: string]: CellValue;
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
        try {
            const { data: requirements, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('position', { ascending: true });

            if (error) throw error;
            if (!requirements) return;

            setLocalRequirements(requirements);
        } catch (error) {
            console.error('Error refreshing requirements:', error);
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
            const column = blockColumns?.find(
                (col) => col.property_id === prop.id,
            );
            const lowerCaseName = prop.name.toLowerCase();

            // Check if this property maps to a natural field
            if (
                [
                    'name',
                    'description',
                    'external_id',
                    'status',
                    'priority',
                ].includes(lowerCaseName)
            ) {
                naturalFields[lowerCaseName] =
                    typeof value === 'string' ? value : '';
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
    const _parseDisplayValueToEnum = (
        displayValue: string,
    ): ERequirementStatus => {
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
        try {
            // Create properties object and extract natural fields
            const { propertiesObj, naturalFields } =
                await createPropertiesObjectFromDynamicReq(dynamicReq);

            // Initialize with an empty history object
            let analysis_history: RequirementAiAnalysis = {
                descriptionHistory: [],
            };

            // Handle possible undefined or null ai_analysis
            if (dynamicReq.ai_analysis) {
                try {
                    // Clone the analysis_history to avoid mutation issues
                    analysis_history = JSON.parse(
                        JSON.stringify(dynamicReq.ai_analysis),
                    );

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
                // Get the last position for new requirements
                const position = await getLastPosition();

                const newRequirementData = {
                    ...requirementData,
                    created_by: userId,
                    name: naturalFields?.name || 'New Requirement', // Default name for new requirements
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

                const { data, error } = await supabase
                    .from('requirements')
                    .insert(newRequirementData)
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned from insert');
                savedRequirement = data;

                // Update local state with the new requirement
                setLocalRequirements((prev) => [...prev, savedRequirement]);
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

                // Update local state with the updated requirement
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === savedRequirement.id ? savedRequirement : req,
                    ),
                );
            }

            return savedRequirement;
        } catch (error) {
            console.error('Error saving requirement:', error);
            throw error;
        }
    };

    // Delete a requirement
    const deleteRequirement = async (
        dynamicReq: DynamicRequirement,
        _userId: string,
    ) => {
        try {
            const { error } = await supabase
                .from('requirements')
                .delete()
                .eq('id', dynamicReq.id);

            if (error) throw error;

            // Update local state by removing the deleted requirement
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
        refreshRequirements,
    };
};
