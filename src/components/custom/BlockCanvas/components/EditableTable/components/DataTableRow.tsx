import { ArrowUpRight, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

import { CellRenderer } from '@/components/custom/BlockCanvas/components/EditableTable/CellRenderer';
import {
    CellValue,
    EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDocumentStore } from '@/lib/store/document.store';
import { cn } from '@/lib/utils';

interface DataTableRowProps<T> {
    item: T;
    columns: EditableColumn<T>[];
    isEditing: boolean;
    editingData: Record<string, T>;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
    onDelete: (item: T) => void;
    onHoverCell?: (row: number, col: number) => void;
    rowIndex: number;
    selectedCell?: { row: number; col: number } | null;
    onCellSelect?: (row: number, col: number) => void;
}

export function DataTableRow<
    T extends Record<string, CellValue> & {
        id: string;
    },
>({
    item,
    columns,
    isEditing,
    editingData,
    onCellChange,
    onDelete,
    onHoverCell,
    rowIndex,
    selectedCell,
    onCellSelect,
}: DataTableRowProps<T>) {
    const [isOpen, setIsOpen] = React.useState(false);
    const router = useRouter();
    const params = useParams();
    const orgId = params.orgId as string;
    const projectId = params.projectId as string;
    const { currentDocument } = useDocumentStore();

    const handleRowClick = () => {
        if (!isEditing) {
            setIsOpen(true);
        }
    };

    const handleNavigateToRequirement = () => {
        router.push(
            `/org/${orgId}/project/${projectId}/requirements/${item.id}`,
        );
    };

    const handleNavigateToTrace = () => {
        // Include the document ID as a query parameter
        const documentId = currentDocument?.id || params.documentId;
        router.push(
            `/org/${orgId}/project/${projectId}/requirements/${item.id}/trace?documentId=${documentId}`,
        );
    };

    return (
        <>
            <TableRow
                className={cn(
                    'font-mono hover:bg-muted/50',
                    !isEditing && 'cursor-pointer',
                )}
                onClick={isEditing ? undefined : handleRowClick}
            >
                {columns.map((column, colIndex) => (
                    <TableCell
                        key={`${String(item.id)}-${String(column.accessor)}`}
                        onMouseEnter={() => onHoverCell?.(rowIndex, colIndex)}
                        onMouseLeave={() => onHoverCell?.(0, 0)}
                        className={cn(
                            'p-0 relative',
                            isEditing &&
                                selectedCell?.row === rowIndex &&
                                selectedCell?.col === colIndex &&
                                'before:absolute before:inset-0 before:border-2 before:border-blue-500 before:pointer-events-none',
                        )}
                        onClick={(e) => {
                            if (!isEditing) return;
                            e.stopPropagation();
                            onCellSelect?.(rowIndex, colIndex);
                        }}
                    >
                        <div className="relative w-full h-full min-h-[32px]">
                            <CellRenderer
                                item={item}
                                column={column}
                                isEditing={isEditing}
                                value={
                                    editingData[item.id]?.[column.accessor] ??
                                    item[column.accessor]
                                }
                                onCellChange={onCellChange}
                            />
                        </div>
                    </TableCell>
                ))}
                {isEditing && (
                    <TableCell>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                )}
            </TableRow>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent
                    className="font-mono p-0 gap-0 bg-background/90 border-l shadow-none"
                    data-overlay-disabled
                >
                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-muted">
                        <div className="px-6 py-4">
                            <SheetHeader className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] tabular-nums tracking-widest text-muted-foreground">
                                        {String(columns.length).padStart(
                                            2,
                                            '0',
                                        )}
                                    </div>
                                    <SheetTitle className="text-sm font-mono tracking-tight">
                                        REQ-{item.id}
                                    </SheetTitle>
                                </div>
                            </SheetHeader>
                            <div className="mt-4 flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="group h-8 px-4 text-[10px] font-medium tracking-widest rounded-none border hover:bg-accent transition-all duration-200"
                                    onClick={handleNavigateToRequirement}
                                >
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        ANALYZE
                                    </span>
                                    <ArrowUpRight className="ml-2 h-3 w-3 text-muted-foreground/70 group-hover:text-accent-foreground/70 transition-colors" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="group h-8 px-4 text-[10px] font-medium tracking-widest rounded-none border hover:bg-accent transition-all duration-200"
                                    onClick={handleNavigateToTrace}
                                >
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        TRACE
                                    </span>
                                    <ArrowUpRight className="ml-2 h-3 w-3 text-muted-foreground/70 group-hover:text-accent-foreground/70 transition-colors" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6">
                        {columns.map((column, index) => (
                            <div
                                key={String(column.accessor)}
                                className={cn(
                                    'py-3 grid grid-cols-[1fr,auto] gap-4 group hover:bg-muted/50 -mx-6 px-6 transition-all duration-200',
                                )}
                            >
                                <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                        {column.header}
                                    </div>
                                    <div className="text-sm tracking-tight">
                                        {String(item[column.accessor] || '—')}
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
        </>
    );
}
