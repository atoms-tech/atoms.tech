'use client';

import type { ReactNode } from 'react';

import { MonospaceTable } from './MonospaceTable';

export interface Column<T> {
    header: string;
    width?: number;
    accessor: (item: T) => string;
    renderCell?: (item: T) => ReactNode;
    isSortable?: boolean;
}

export interface DashboardViewProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    renderDetails?: (item: T) => ReactNode;
}

function DashboardView<T>({
    data,
    columns,
    onRowClick,
    isLoading,
    emptyMessage = 'No items found.',
    renderDetails,
}: DashboardViewProps<T>) {
    if (isLoading) {
        return <div className="animate-pulse">Loading...</div>;
    }

    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-dark-text-secondary py-8">
                {emptyMessage}
            </div>
        );
    }

    return (
        <MonospaceTable
            data={data}
            columns={columns}
            onRowClick={onRowClick}
            renderDetails={renderDetails}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            showFilter={false}
        />
    );
}

export default DashboardView;
