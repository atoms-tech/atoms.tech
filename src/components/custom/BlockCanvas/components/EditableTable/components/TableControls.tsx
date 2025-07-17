import { motion } from 'framer-motion';
import { Columns, FilterIcon, Plus } from 'lucide-react';
import { useState } from 'react';

import { AddColumnDialog } from '@/components/custom/BlockCanvas/components/EditableTable/components/AddColumnDialog';
import {
    EditableColumn,
    EditableColumnType,
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

export interface TableControlsProps<T = unknown> {
    showFilter: boolean;
    filterComponent?: React.ReactNode;
    onNewRow: () => void;
    onAddColumn?: (
        columnName: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => void;
    onAddColumnFromProperty?: (propertyId: string, defaultValue: string) => void;
    onEnterEditMode: () => void;
    isVisible: boolean;
    orgId: string;
    projectId?: string;
    documentId?: string;
    sortKey?: string | null;
    sortOrder?: 'asc' | 'desc';
    onSort?: (key: keyof T) => void;
    columns?: EditableColumn<T>[];
}

export function TableControls<T extends Record<string, unknown>>({
    showFilter,
    filterComponent,
    onNewRow,
    onAddColumn,
    onAddColumnFromProperty,
    onEnterEditMode,
    isVisible,
    orgId,
    projectId,
    documentId,
}: Omit<TableControlsProps<T>, 'sortKey' | 'sortOrder' | 'onSort' | 'columns'>) {
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
    const { userProfile } = useAuth();

    // Define rolePermissions with explicit type
    const rolePermissions: Record<'owner' | 'editor' | 'viewer', string[]> = {
        owner: ['addColumn', 'addRow'],
        editor: ['addColumn', 'addRow'],
        viewer: [],
    };

    // Explicitly type userRole
    const userRole: keyof typeof rolePermissions =
        (userProfile as { role?: keyof typeof rolePermissions })?.role || 'viewer';

    console.log('Project ID:', projectId); // Ensure projectId is logged for debugging

    const canPerformAction = (action: string) => {
        return rolePermissions[userRole].includes(action);
    };

    if (!isVisible || !canPerformAction('addRow')) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: -42 }}
                exit={{ opacity: 0, x: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute left-0 top-0 h-full flex items-center"
            >
                <TooltipProvider delayDuration={0}>
                    <div className="flex flex-col gap-0.5 bg-background border-y border-l rounded-l-md shadow-lg">
                        {showFilter && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-none"
                                        >
                                            <FilterIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" sideOffset={5}>
                                        <p>Filter table</p>
                                    </TooltipContent>
                                </Tooltip>
                                {filterComponent && (
                                    <div className="p-2">{filterComponent}</div>
                                )}
                            </>
                        )}
                        {onAddColumn && canPerformAction('addColumn') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => setIsAddColumnOpen(true)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-none"
                                    >
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" sideOffset={5}>
                                    <p>Add new column</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() => {
                                        onEnterEditMode();
                                        onNewRow();
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-none"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" sideOffset={5}>
                                <p>Add new row</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </motion.div>
            {onAddColumn && (
                <AddColumnDialog
                    isOpen={isAddColumnOpen}
                    onClose={() => setIsAddColumnOpen(false)}
                    onSave={onAddColumn}
                    onSaveFromProperty={onAddColumnFromProperty}
                    orgId={orgId}
                    projectId={projectId}
                    documentId={documentId}
                />
            )}
        </>
    );
}
