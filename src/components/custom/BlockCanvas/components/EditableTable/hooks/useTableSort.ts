import { useMemo, useState } from 'react';

import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';

export function useTableSort<
    T extends Record<string, CellValue> & { id: string },
>(data: T[], defaultSortKey?: keyof T | null) {
    const [sortKey, setSortKey] = useState<keyof T | null>(
        defaultSortKey || null,
    );
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Logic for sorting data
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            if (!sortKey) return 0;
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
            if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

            // Handle Date objects
            if (aValue instanceof Date && bValue instanceof Date) {
                return sortOrder === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            // Handle regular values
            return sortOrder === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [data, sortKey, sortOrder]);

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    return {
        sortedData,
        sortKey,
        sortOrder,
        handleSort,
        setSortKey,
        setSortOrder,
    };
}
