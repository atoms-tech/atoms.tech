import {
    BaseRow,
    CellValue,
    EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';

export function isValidDateValue(value: unknown): boolean {
    if (value == null || value === '') return false;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (typeof value === 'string') {
        const dt = new Date(value);
        return !Number.isNaN(dt.getTime());
    }
    return false;
}

export function toIsoOrNull(value: unknown): string | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === 'string') {
        const dt = new Date(value);
        return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    return null;
}

export function sanitizeRowForColumns(
    row: BaseRow,
    columns: Array<EditableColumn<BaseRow>>,
): { sanitized: BaseRow; invalidDateFields: string[] } {
    const invalidDateFields: string[] = [];
    const sanitized: BaseRow = { ...row };

    for (const col of columns) {
        const key = col.accessor as string;
        if (col.type === 'date') {
            const value = row[key];
            const iso = toIsoOrNull(value);
            if (iso === null) {
                if (value != null && value !== '') invalidDateFields.push(col.header);
                sanitized[key] = null;
            } else {
                sanitized[key] = iso as unknown as CellValue;
            }
        }
    }

    return { sanitized, invalidDateFields };
}

export function sanitizeRowsOnFetch(
    rows: BaseRow[],
    columns: Array<EditableColumn<BaseRow>>,
): { rows: BaseRow[]; totalInvalidCells: number } {
    let totalInvalidCells = 0;
    const cleaned = rows.map((r) => {
        const { sanitized, invalidDateFields } = sanitizeRowForColumns(r, columns);
        totalInvalidCells += invalidDateFields.length;
        return sanitized;
    });
    return { rows: cleaned, totalInvalidCells };
}
