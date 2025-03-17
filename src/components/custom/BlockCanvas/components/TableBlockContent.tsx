import type { FC } from 'react';
import { useState } from 'react';

import { SidePanel } from '@/components/base/panels/SidePanel';
import { EditableTable } from '@/components/custom/BlockCanvas/components/EditableTable';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { useAuth } from '@/hooks/useAuth';
import { Requirement } from '@/types/base/requirements.types';

import { AddColumnDialog } from './AddColumnDialog';
import { EditableColumn } from './EditableTable';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    onAddColumn: (name: string, dataType: string) => Promise<void>;
    isEditMode: boolean;
}

export const TableBlockContent: FC<TableBlockContentProps> = ({
    dynamicRequirements,
    columns,
    onSaveRequirement,
    onDeleteRequirement,
    onAddColumn,
    isEditMode,
}) => {
    const { userProfile } = useAuth();
    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-between mb-2">
                {isEditMode && (
                    <div className="flex justify-end">
                        <AddColumnDialog
                            onAddColumn={onAddColumn}
                            disabled={!userProfile?.id}
                        />
                    </div>
                )}
            </div>

            <EditableTable
                data={dynamicRequirements}
                columns={columns}
                onSave={onSaveRequirement}
                onDelete={onDeleteRequirement}
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
                        onDeleteRequirement({ id: selectedRequirement.id });
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
                    </div>
                )}
            </SidePanel>
        </div>
    );
};
