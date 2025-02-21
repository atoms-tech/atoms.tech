'use client';

import React from 'react';

import { useSettingsStore } from '@/lib/store/settings.store';

import { MonospaceGrid } from './MonospaceGrid';
import { MonospaceTable } from './MonospaceTable';

export interface Column<T> {
    header: string;
    width?: number;
    accessor: (item: T) => string;
    renderCell?: (item: T) => React.ReactNode;
    isSortable?: boolean;
}

export interface DashboardViewProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    handleGoToPage?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    gridItemRender?: (item: T) => React.ReactNode;
    renderDetails?: (item: T) => React.ReactNode;
}

function DashboardView<T>({
    data,
    columns,
    onRowClick,
    handleGoToPage,
    isLoading,
    emptyMessage = 'No items found.',
    gridItemRender,
    renderDetails,
}: DashboardViewProps<T>) {
    const { viewMode: appViewMode } = useSettingsStore();

    const asciiColumns = columns.map((col) => ({
        ...col,
        width: col.width || 20,
    }));

    if (isLoading) {
        return appViewMode === 'compact' ? (
            <MonospaceGrid data={[]} columns={asciiColumns} />
        ) : (
            <div className="animate-pulse">Loading...</div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-dark-text-secondary py-8">
                {emptyMessage}
            </div>
        );
    }

    if (appViewMode === 'compact') {
        return (
            <MonospaceGrid
                data={data}
                columns={columns}
                onRowClick={onRowClick}
                handleGoToPage={handleGoToPage}
                gridItemRender={gridItemRender}
                renderDetails={renderDetails}
            />
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
