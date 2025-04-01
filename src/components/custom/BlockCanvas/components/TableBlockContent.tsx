/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Columns } from 'lucide-react';
import React, { useState } from 'react';

import { SidePanel } from '@/components/base/panels/SidePanel';
import { EditableTable } from '@/components/custom/BlockCanvas/components/EditableTable';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { AddColumnDialog } from '@/components/custom/BlockCanvas/components/EditableTable/components/AddColumnDialog';
import {
    EditableColumn,
    EditableColumnType,
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { PropertyType } from '@/components/custom/BlockCanvas/types';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Requirement } from '@/types/base/requirements.types';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    onAddColumn: (
        name: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    orgId: string;
    projectId?: string;
    documentId?: string;
    onDelete?: () => void;
}

export const TableBlockContent: React.FC<TableBlockContentProps> = ({
    dynamicRequirements,
    columns,
    onSaveRequirement,
    onDeleteRequirement,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    onAddColumn,
    isEditMode,
    alwaysShowAddRow = false,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    orgId,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    projectId,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    documentId,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    onDelete,
}) => {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { userProfile } = useAuth();
    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    return (
        <div className="w-full min-w-0 relative">
            <div className="w-full min-w-0">
                <div className="w-full max-w-full">
                    <EditableTable
                        data={dynamicRequirements}
                        columns={columns}
                        onSave={onSaveRequirement}
                        onDelete={onDeleteRequirement}
                        emptyMessage="Click the 'New Row' below to add your first requirement."
                        showFilter={false}
                        isEditMode={isEditMode}
                        alwaysShowAddRow={alwaysShowAddRow}
                    />
                </div>
            </div>

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
