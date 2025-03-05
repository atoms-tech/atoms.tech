import { v4 as uuidv4 } from 'uuid';

import { BlockPropertySchema } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import { useSyncRequirementDataWithKVs } from '@/hooks/mutations/useRequirementPropertyKVMutations';
import {
    RequirementFormat,
    RequirementLevel,
    RequirementPriority,
    RequirementStatus,
} from '@/types/base/enums.types';
import { Requirement } from '@/types/base/requirements.types';

// Type for the requirement data that will be displayed in the table
export type DynamicRequirement = {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

interface UseRequirementActionsProps {
    blockId: string;
    documentId: string;
    localRequirements: Requirement[];
    setLocalRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
    blockPropertySchemas: BlockPropertySchema[] | undefined;
}

export const useRequirementActions = ({
    blockId,
    documentId,
    localRequirements,
    setLocalRequirements,
    blockPropertySchemas,
}: UseRequirementActionsProps) => {
    const createRequirementMutation = useCreateRequirement();
    const updateRequirementMutation = useUpdateRequirement();
    const syncRequirementDataWithKVs = useSyncRequirementDataWithKVs();

    // Helper function to create data object from dynamic requirement
    const createDataObjectFromDynamicReq = (
        dynamicReq: DynamicRequirement,
        schemas: BlockPropertySchema[] | undefined,
    ) => {
        if (!schemas) return {};

        return schemas.reduce(
            (acc, schema) => {
                if (
                    !['Name', 'Description', 'Status', 'Priority'].includes(
                        schema.name,
                    )
                ) {
                    acc[schema.name] = dynamicReq[schema.name] || '';
                }
                return acc;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as Record<string, any>,
        );
    };

    // Convert requirements to dynamic requirements for the table
    const getDynamicRequirements = (): DynamicRequirement[] => {
        if (!localRequirements || !blockPropertySchemas) {
            return [];
        }

        return localRequirements.map((req) => {
            // Start with the requirement ID and basic fields
            const dynamicReq: DynamicRequirement = {
                id: req.id,
                Name: req.name,
                Description: req.description,
                Status: req.status,
                Priority: req.priority,
            };

            // Add properties from requirement data field
            if (req.data) {
                blockPropertySchemas.forEach((schema) => {
                    // Skip the basic fields that are already added
                    if (
                        !['Name', 'Description', 'Status', 'Priority'].includes(
                            schema.name,
                        )
                    ) {
                        dynamicReq[schema.name] = req.data?.[schema.name] || '';
                    }
                });
            }

            return dynamicReq;
        });
    };

    const saveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId: string,
    ) => {
        if (!userId || !blockPropertySchemas) {
            return;
        }

        try {
            let requirementId = dynamicReq.id;

            if (isNew) {
                // Generate a UUID for new requirements
                const tempId = requirementId || uuidv4();

                // Extract name and description from dynamic requirement
                const name = dynamicReq['Name'] || 'New Requirement';
                const description = dynamicReq['Description'] || '';
                const status =
                    (dynamicReq['Status'] as RequirementStatus) ||
                    RequirementStatus.draft;
                const priority =
                    (dynamicReq['Priority'] as RequirementPriority) ||
                    RequirementPriority.medium;

                // Create data object from dynamic requirement
                const dataObject = createDataObjectFromDynamicReq(
                    dynamicReq,
                    blockPropertySchemas,
                );

                // Create the base requirement with data field
                const newRequirement: Requirement = {
                    id: tempId,
                    name,
                    description,
                    status,
                    priority,
                    format: RequirementFormat.incose,
                    level: RequirementLevel.system,
                    document_id: documentId,
                    block_id: blockId,
                    created_by: userId,
                    updated_by: userId,
                    data: dataObject,
                    ai_analysis: null,
                    enchanced_requirement: null,
                    external_id: null,
                    original_requirement: null,
                    tags: [],
                    created_at: null,
                    updated_at: null,
                    deleted_at: null,
                    deleted_by: null,
                    is_deleted: null,
                    version: 1,
                };

                // Update local state optimistically
                setLocalRequirements((prev) => [...prev, newRequirement]);

                // Save the requirement
                const savedRequirement =
                    await createRequirementMutation.mutateAsync(newRequirement);
                requirementId = savedRequirement.id;

                // Sync the requirement data with KVs
                await syncRequirementDataWithKVs.mutateAsync({
                    requirementId,
                    blockId,
                    data: dataObject,
                    userId,
                });
            } else {
                // Find the original requirement
                const originalReq = localRequirements.find(
                    (req) => req.id === requirementId,
                );
                if (!originalReq) {
                    return;
                }

                // Create data object from dynamic requirement
                const dataObject = createDataObjectFromDynamicReq(
                    dynamicReq,
                    blockPropertySchemas,
                );

                // Update the base requirement with name, description, status, priority
                const updatedRequirement: Partial<Requirement> = {
                    ...originalReq,
                    name: dynamicReq['Name'] || originalReq.name,
                    description:
                        dynamicReq['Description'] || originalReq.description,
                    status:
                        (dynamicReq['Status'] as RequirementStatus) ||
                        originalReq.status,
                    priority:
                        (dynamicReq['Priority'] as RequirementPriority) ||
                        originalReq.priority,
                    updated_by: userId,
                };

                // Update local state optimistically
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === requirementId
                            ? ({
                                  ...req,
                                  ...updatedRequirement,
                                  data: dataObject,
                              } as Requirement)
                            : req,
                    ),
                );

                // Update the requirement
                await updateRequirementMutation.mutateAsync(
                    updatedRequirement as Requirement,
                );

                // Sync the requirement data with KVs
                await syncRequirementDataWithKVs.mutateAsync({
                    requirementId,
                    blockId,
                    data: dataObject,
                    userId,
                });
            }
        } catch (error) {
            // Revert local state on error
            if (isNew) {
                setLocalRequirements((prev) =>
                    prev.filter((req) => req.id !== dynamicReq.id),
                );
            }
            throw error;
        }
    };

    const deleteRequirement = async (
        dynamicReq: DynamicRequirement,
        userId: string,
    ) => {
        try {
            // Find the original requirement
            const originalReq = localRequirements.find(
                (req) => req.id === dynamicReq.id,
            );
            if (!originalReq) {
                return;
            }

            // Update local state optimistically
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== dynamicReq.id),
            );

            // Make API call to delete the requirement
            await updateRequirementMutation.mutateAsync({
                ...originalReq,
                is_deleted: true,
                updated_by: userId,
            });
        } catch (error) {
            // Revert local state on error
            setLocalRequirements((_prev) => localRequirements);
            throw error;
        }
    };

    return {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        createDataObjectFromDynamicReq,
    };
};
