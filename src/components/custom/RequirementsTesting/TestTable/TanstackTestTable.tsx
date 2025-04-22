'use client';

import {
    ColumnDef,
    ColumnFiltersState,
    Row,
    SortingState,
    Table as TanstackTable,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react';
import { useState } from 'react';

import { useLinkedRequirementsCount } from '@/components/custom/RequirementsTesting/hooks/useTestReq';
import { TestReq } from '@/components/custom/RequirementsTesting/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TableMetaType {
    getStatusStyle: (status: string) => string;
    getPriorityStyle: (priority: string) => string;
    onEdit: (testCase: TestReq) => void;
    onDelete: (id: string) => void;
}

interface DataTableProps {
    data: TestReq[];
    columns: ColumnDef<TestReq>[];
    pageCount: number;
    pageSize: number;
    pageIndex: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
    getStatusStyle: (status: string) => string;
    getPriorityStyle: (priority: string) => string;
    onEdit: (testCase: TestReq) => void;
    onDelete: (id: string) => void;
}

export function DataTable({
    data,
    columns,
    pageCount,
    pageSize,
    pageIndex,
    onPaginationChange,
    getStatusStyle,
    getPriorityStyle,
    onEdit,
    onDelete,
}: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable<TestReq>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater(table.getState().pagination);
                onPaginationChange(newState.pageIndex, newState.pageSize);
            }
        },
        state: {
            sorting,
            columnFilters,
            pagination: {
                pageSize,
                pageIndex,
            },
        },
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        pageCount,
        meta: {
            getStatusStyle,
            getPriorityStyle,
            onEdit,
            onDelete,
        } as TableMetaType,
    });

    return (
        <div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="border-b border-border"
                            >
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        style={{
                                            width: header.column.columnDef.size,
                                        }}
                                        className={cn(
                                            'text-muted-foreground whitespace-nowrap text-sm group',
                                            header.column.getCanSort() &&
                                                'cursor-pointer select-none',
                                        )}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <Button
                                                variant="ghost"
                                                onClick={header.column.getToggleSortingHandler()}
                                                className={cn(
                                                    'h-8 px-0 hover:bg-transparent text-base font-medium w-full justify-start',
                                                    !header.column.getCanSort() &&
                                                        'cursor-default',
                                                    header.column.getIsSorted() &&
                                                        'text-primary',
                                                )}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {header.column.getCanSort() && (
                                                    <div
                                                        className={cn(
                                                            'ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex',
                                                            header.column.getIsSorted() &&
                                                                'opacity-100',
                                                            'hover:text-primary',
                                                        )}
                                                    >
                                                        {header.column.getIsSorted() ===
                                                        'asc' ? (
                                                            <ArrowUp className="h-4 w-4" />
                                                        ) : header.column.getIsSorted() ===
                                                          'desc' ? (
                                                            <ArrowDown className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowUpDown className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                )}
                                            </Button>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    className="group border-b border-border hover:bg-muted/50 dark:hover:bg-muted/25"
                                >
                                    {row
                                        .getVisibleCells()
                                        .map((cell, index) => (
                                            <TableCell
                                                key={cell.id}
                                                style={{
                                                    width: cell.column.columnDef
                                                        .size,
                                                }}
                                                className={cn(
                                                    'break-words whitespace-normal text-sm py-2',
                                                    index ===
                                                        row.getVisibleCells()
                                                            .length -
                                                            1 && 'relative',
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                                {index ===
                                                    row.getVisibleCells()
                                                        .length -
                                                        1 && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        (
                                                                            table
                                                                                .options
                                                                                .meta as TableMetaType
                                                                        )?.onEdit(
                                                                            row.original,
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        (
                                                                            table
                                                                                .options
                                                                                .meta as TableMetaType
                                                                        )?.onDelete(
                                                                            row
                                                                                .original
                                                                                .id ||
                                                                                '',
                                                                        );
                                                                    }}
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                )}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4 px-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Showing{' '}
                    {pageSize === data.length
                        ? 'All'
                        : `${pageIndex * pageSize + 1} - ${Math.min((pageIndex + 1) * pageSize, data.length)}`}{' '}
                    of {data.length} entries
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-border hover:bg-muted dark:border-border dark:hover:bg-muted"
                        >
                            Previous
                        </Button>
                        {Array.from(
                            { length: Math.min(5, pageCount) },
                            (_, i) => {
                                const pageNumber = i + 1;
                                return (
                                    <Button
                                        key={i}
                                        variant={
                                            pageNumber === pageIndex + 1
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() => table.setPageIndex(i)}
                                        className="border-border hover:bg-muted dark:border-border dark:hover:bg-muted"
                                    >
                                        {pageNumber}
                                    </Button>
                                );
                            },
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-border hover:bg-muted dark:border-border dark:hover:bg-muted"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add this component before the columns definition
const LinkedRequirementsCell = ({ testId }: { testId: string }) => {
    const { data: count = 0 } = useLinkedRequirementsCount(testId);
    return <span className="text-muted-foreground">{count}</span>;
};

// Column definitions with fixed widths
export const columns: ColumnDef<TestReq>[] = [
    {
        accessorKey: 'test_id',
        header: 'Test ID',
        cell: ({ row }: { row: Row<TestReq> }) =>
            row.original.test_id?.substring(0, 6) || '',
        enableSorting: true,
        size: 100,
    },
    {
        accessorKey: 'title',
        header: 'Title',
        enableSorting: true,
        size: 250,
    },
    {
        accessorKey: 'test_type',
        header: 'Type',
        enableSorting: true,
        size: 120,
    },
    {
        accessorKey: 'method',
        header: 'Method',
        enableSorting: true,
        size: 120,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        size: 120,
        cell: ({
            row,
            table,
        }: {
            row: Row<TestReq>;
            table: TanstackTable<TestReq>;
        }) => {
            const status = row.original.status;
            return (
                <span
                    className={`px-2 py-1 rounded text-sm ${
                        (table.options.meta as TableMetaType)?.getStatusStyle(
                            status,
                        ) || ''
                    }`}
                >
                    {status.replace('_', ' ')}
                </span>
            );
        },
    },
    {
        accessorKey: 'priority',
        header: 'Priority',
        enableSorting: true,
        size: 100,
        cell: ({
            row,
            table,
        }: {
            row: Row<TestReq>;
            table: TanstackTable<TestReq>;
        }) => {
            const priority = row.original.priority;
            return (
                <span
                    className={
                        (table.options.meta as TableMetaType)?.getPriorityStyle(
                            priority,
                        ) || ''
                    }
                >
                    {priority}
                </span>
            );
        },
    },
    {
        accessorKey: 'result',
        header: 'Result',
        enableSorting: true,
        size: 100,
        cell: ({ row }: { row: Row<TestReq> }) => {
            const result = row.original.result;
            if (result === 'Pass')
                return (
                    <span className="text-green-600 dark:text-green-400">
                        Pass
                    </span>
                );
            if (result === 'Fail')
                return (
                    <span className="text-red-600 dark:text-red-400">Fail</span>
                );
            return <span className="text-muted-foreground">Not Run</span>;
        },
    },
    {
        id: 'linkedRequirements',
        header: 'Linked Reqs',
        enableSorting: false,
        size: 100,
        cell: ({ row }: { row: Row<TestReq> }) => (
            <LinkedRequirementsCell testId={row.original.id || ''} />
        ),
    },
];
