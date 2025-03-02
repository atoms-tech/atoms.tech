'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { SidePanel } from '@/components/base/panels/SidePanel';
import {
    type EditableColumn,
    EditableTable,
} from '@/components/custom/BlockCanvas/components/EditableTable';
import { BlockProps } from '@/components/custom/BlockCanvas/types';
import {
    useCreateRequirement,
    useUpdateRequirement,
} from '@/hooks/mutations/useRequirementMutations';
import { useAuth } from '@/hooks/useAuth';
import {
    RequirementFormat,
    RequirementLevel,
    RequirementPriority,
    RequirementStatus,
} from '@/types/base/enums.types';
import { Requirement } from '@/types/base/requirements.types';

// Type for the simplified requirement data that will be displayed in the table
type DisplayRequirement = {
    id: string;
    name: string;
    description: string | null;
    priority: RequirementPriority;
    status: RequirementStatus;
};

// Function to convert from full Requirement to DisplayRequirement
const toDisplayRequirement = (req: Requirement): DisplayRequirement => ({
    id: req.id,
    name: req.name,
    description: req.description,
    priority: req.priority,
    status: req.status,
});

// Function to merge DisplayRequirement changes back into full Requirement
const mergeRequirementChanges = (
    original: Requirement,
    changes: Partial<DisplayRequirement>,
): Requirement => ({
    ...original,
    ...changes,
});

export const TableBlock: React.FC<BlockProps> = ({ block, isEditMode }) => {
    const createRequirementMutation = useCreateRequirement();
    const updateRequirementMutation = useUpdateRequirement();
    const { userProfile } = useAuth();
    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [localRequirements, setLocalRequirements] = useState<Requirement[]>(
        block.requirements || [],
    );

    // Update local requirements when block.requirements changes
    React.useEffect(() => {
        setLocalRequirements(block.requirements || []);
    }, [block.requirements]);

    const handleSaveRequirement = async (
        displayReq: DisplayRequirement,
        isNew: boolean,
    ) => {
        if (!userProfile?.id) return;

        try {
            if (isNew) {
                // Generate a UUID for new requirements
                const tempId = displayReq.id || uuidv4();
                const newRequirement: Requirement = {
                    ...displayReq,
                    id: tempId,
                    format: RequirementFormat.incose,
                    level: RequirementLevel.system,
                    document_id: block.document_id,
                    block_id: block.id,
                    created_by: userProfile.id,
                    updated_by: userProfile.id,
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

                // Make API call
                const savedRequirement =
                    await createRequirementMutation.mutateAsync(newRequirement);

                // Update local state with the actual saved requirement
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === tempId ? savedRequirement : req,
                    ),
                );
            } else {
                // Find the original requirement
                const originalReq = localRequirements.find(
                    (req) => req.id === displayReq.id,
                );
                if (!originalReq) return;

                // Merge changes with the original requirement
                const updatedRequirement = mergeRequirementChanges(
                    originalReq,
                    displayReq,
                );
                updatedRequirement.updated_by = userProfile.id;

                // Update local state optimistically
                setLocalRequirements((prev) =>
                    prev.map((req) =>
                        req.id === displayReq.id ? updatedRequirement : req,
                    ),
                );

                // Make API call
                await updateRequirementMutation.mutateAsync(updatedRequirement);
            }
        } catch (error) {
            console.error('Failed to save requirement:', error);
            // Revert local state on error
            if (isNew) {
                setLocalRequirements((prev) =>
                    prev.filter((req) => req.id !== displayReq.id),
                );
            } else {
                setLocalRequirements(block.requirements || []);
            }
        }
    };

    const handleDeleteRequirement = async (displayReq: DisplayRequirement) => {
        try {
            // Find the original requirement
            const originalReq = localRequirements.find(
                (req) => req.id === displayReq.id,
            );
            if (!originalReq) return;

            // Update local state optimistically
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== displayReq.id),
            );

            // Make API call
            await updateRequirementMutation.mutateAsync({
                ...originalReq,
                is_deleted: true,
                updated_by: userProfile?.id,
            });
        } catch (error) {
            console.error('Failed to delete requirement:', error);
            // Revert local state on error
            setLocalRequirements(block.requirements || []);
        }
    };

    const columns: EditableColumn<DisplayRequirement>[] = [
        {
            header: 'Name',
            accessor: 'name',
            type: 'text',
            width: 200,
            required: true,
            isSortable: true,
        },
        {
            header: 'Description',
            accessor: 'description',
            type: 'text',
            width: 300,
        },
        {
            header: 'Priority',
            accessor: 'priority',
            type: 'select',
            options: Object.values(RequirementPriority),
            width: 120,
            isSortable: true,
            required: true,
        },
        {
            header: 'Status',
            accessor: 'status',
            type: 'select',
            options: Object.values(RequirementStatus),
            width: 120,
            isSortable: true,
            required: true,
        },
    ];

    // Convert requirements to display format
    const displayRequirements = localRequirements.map(toDisplayRequirement);

    return (
        <div className="space-y-4">
            <EditableTable
                data={displayRequirements}
                columns={columns}
                onSave={handleSaveRequirement}
                onDelete={handleDeleteRequirement}
                emptyMessage="Click the 'New Row' below to add your first requirement."
                showFilter={true}
                isEditMode={isEditMode}
            />

            <SidePanel
                isOpen={!!selectedRequirement}
                onClose={() => setSelectedRequirement(null)}
                showNavigateButton={true}
                showEditButton={true}
                onNavigate={() => {
                    // Navigate to requirement detail page
                    // You'll need to implement this based on your routing structure
                }}
                onOptionSelect={(option) => {
                    if (option === 'delete' && selectedRequirement) {
                        handleDeleteRequirement(
                            toDisplayRequirement(selectedRequirement),
                        );
                        setSelectedRequirement(null);
                    }
                }}
            >
                {selectedRequirement && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {selectedRequirement.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {selectedRequirement.description}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">
                                    Priority
                                </label>
                                <p className="mt-1">
                                    {selectedRequirement.priority}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Status
                                </label>
                                <p className="mt-1">
                                    {selectedRequirement.status}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </SidePanel>
        </div>
    );
};
