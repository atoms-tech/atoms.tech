'use client';

import { transitionConfig } from '@/lib/utils/animations';
import { LayoutGroup, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import React from 'react';

interface Column<T> {
    header: string;
    width?: number;
    accessor: (item: T) => string;
    renderCell?: (item: T) => React.ReactNode;
}

interface MonospaceGridProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    handleGoToPage?: (item: T) => void;
    gridItemRender?: (item: T) => React.ReactNode;
    renderDetails?: (item: T) => React.ReactNode;
}

export function MonospaceGrid<T>({
    data,
    columns,
    onRowClick,
    handleGoToPage,
    gridItemRender,
    renderDetails,
}: MonospaceGridProps<T>) {
    const [, setSelectedItem] = React.useState<T | null>(null);

    const handleItemClick = React.useCallback(
        (item: T) => {
            if (onRowClick) {
                onRowClick(item);
            }
            if (renderDetails) {
                setSelectedItem(item);
            }
            if (handleGoToPage && !renderDetails) {
                handleGoToPage(item);
            }
        },
        [onRowClick, renderDetails, handleGoToPage],
    );

    return (
        <LayoutGroup>
            <motion.div
                className={`overflow-hidden relative space-y-4 pt-4`}
                layout
                transition={transitionConfig}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {data.map((item, index) => (
                        <div key={index} onClick={() => handleItemClick(item)}>
                            {gridItemRender ? (
                                <div onClick={() => handleItemClick(item)}>
                                    {gridItemRender(item)}
                                </div>
                            ) : (
                                <div
                                    onClick={() => handleItemClick(item)}
                                    className="w-full bg-card border border-border rounded-lg shadow-sm p-6 text-foreground font-mono cursor-pointer hover:border-primary transition-colors"
                                >
                                    <div className="flex items-start space-x-4">
                                        <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">
                                                {columns[0]?.accessor(item)}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                                {columns
                                                    .slice(1)
                                                    .map((column, colIndex) => (
                                                        <span
                                                            key={colIndex}
                                                            className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-[200px]"
                                                        >
                                                            {column.accessor(
                                                                item,
                                                            )}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>
        </LayoutGroup>
    );
}

export default MonospaceGrid;
