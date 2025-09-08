import { GridCell, Item, Rectangle } from '@glideapps/glide-data-grid';
import { useCallback } from 'react';

/**
 * useGlideCopy
 * Composable hook that provides DataEditor.getCellsForSelection to enable copy support.
 * Returns cell data in row-major order for the selected rectangle so users can copy to
 * Google Sheets, Excel, or elsewhere. Relies on the provided getCellContent to produce
 * consistent GridCell values (including copyData for custom cells).
 */
export function useGlideCopy(getCellContent: (cell: Item) => GridCell): {
    getCellsForSelection: (selection: Rectangle) => readonly (readonly GridCell[])[];
} {
    const getCellsForSelection = useCallback(
        (selection: Rectangle) => {
            if (!selection) return [];

            const rows: GridCell[][] = [];
            const startRow = selection.y;
            const endRow = selection.y + selection.height;
            const startCol = selection.x;
            const endCol = selection.x + selection.width;

            for (let r = startRow; r < endRow; r++) {
                const row: GridCell[] = [];
                for (let c = startCol; c < endCol; c++) {
                    row.push(getCellContent([c, r]));
                }
                rows.push(row);
            }

            return rows;
        },
        [getCellContent],
    );

    return { getCellsForSelection };
}
