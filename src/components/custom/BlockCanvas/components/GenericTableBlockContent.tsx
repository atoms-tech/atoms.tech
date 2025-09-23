import React, { useCallback, useEffect, useState } from 'react';

import { GlideEditableTable } from '@/components/custom/BlockCanvas/components/EditableTable';
import {
    BaseRow,
    EditableColumn,
    GlideTableProps,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
// import { createTableRowsAdapter } from '@/components/custom/BlockCanvas/components/EditableTable/adapters/rowsAdapter';
import { useRowActions } from '@/components/custom/BlockCanvas/hooks/useRowActions';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Props = {
    blockId: string;
    documentId: string;
    columns: EditableColumn<BaseRow>[];
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    useGlideTables?: boolean;
    tableMetadata?: unknown;
};

const GenericRowSidebar: React.FC<{
    row: BaseRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: Array<EditableColumn<BaseRow>>;
}> = ({ row, open, onOpenChange, columns }) => {
    if (!row) return null;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="font-mono p-0 gap-0 bg-background/90 border-l shadow-none overflow-scroll"
                data-overlay-disabled
            >
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-muted">
                    <div className="px-6 py-4">
                        <SheetHeader className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] tabular-nums tracking-widest text-muted-foreground">
                                    {String(columns.length).padStart(2, '0')}
                                </div>
                                <SheetTitle className="text-sm font-mono tracking-tight">
                                    ROW-{row.id}
                                </SheetTitle>
                            </div>
                        </SheetHeader>
                    </div>
                </div>
                <div className="px-6 mb-8">
                    {columns.map((column, index) => (
                        <div
                            key={String(column.accessor)}
                            className="py-3 grid grid-cols-[1fr,auto] gap-4 group hover:bg-muted/50 -mx-6 px-6 transition-all duration-200"
                        >
                            <div className="space-y-0.5">
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                    {column.header}
                                </div>
                                <div className="text-sm tracking-tight">
                                    {String(row[column.accessor] ?? '—')}
                                </div>
                            </div>
                            <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[10px] tabular-nums text-muted-foreground/60">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export const GenericTableBlockContent: React.FC<Props> = ({
    blockId,
    documentId,
    columns,
    isEditMode,
    alwaysShowAddRow = false,
}) => {
    const [rows, setRows] = useState<BaseRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Adapter kept for future composition; using useRowActions directly for now
    // const rowsAdapter = useMemo(() => createTableRowsAdapter(), []);

    const { saveRow, deleteRow, refreshRows } = useRowActions({
        blockId,
        documentId,
        localRows: rows,
        setLocalRows: setRows,
    });
    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await refreshRows();
        } finally {
            setIsLoading(false);
        }
    }, [refreshRows]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const tableProps: GlideTableProps<BaseRow> = {
        data: rows,
        columns,
        onSave: async (item, isNew) => saveRow(item, isNew),
        onDelete: async (item) => deleteRow(item),
        onPostSave: async () => refresh(),
        isLoading,
        isEditMode,
        alwaysShowAddRow,
        blockId,
        rowDetailPanel: GenericRowSidebar,
        rowMetadataKey: 'rows',
    };

    return (
        <div className="w-full min-w-0 relative">
            <div className="w-full max-w-full">
                <GlideEditableTable<BaseRow> {...tableProps} />
            </div>
        </div>
    );
};
