'use client';

import { saveWithPicker } from '@/components/custom/BlockCanvas/utils/exportCsv';

// Fallback: Very simple Excel export using HTML table (.xls)
export function buildExcelHtml(
    headers: string[],
    rows: Array<Array<unknown>>,
    includeHeader = true,
): string {
    const escape = (v: unknown) => {
        const s = v == null ? '' : String(v);
        // Minimal escaping for HTML
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const headerRow = includeHeader
        ? `<tr>${headers.map((h) => `<th>${escape(h)}</th>`).join('')}</tr>`
        : '';
    const body = rows
        .map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`)
        .join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
	<table border="1">
		${headerRow}
		${body}
	</table>
</body>
</html>
`.trim();
}

export async function saveExcel(
    headers: string[],
    rows: Array<Array<unknown>>,
    includeHeader: boolean,
    suggestedName: string,
) {
    // Try modern .xlsx via SheetJS; fallback to legacy HTML .xls
    try {
        const XLSX = await import('xlsx');
        const data: Array<Array<unknown>> = includeHeader ? [headers, ...rows] : rows;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        let name = suggestedName;
        if (!/\.xlsx$/i.test(name)) {
            name = name.replace(/\.[^.]+$/, '') + '.xlsx';
        }
        await saveWithPicker(blob, name);
        return;
    } catch {
        // Fallback to HTML .xls
        const html = buildExcelHtml(headers, rows, includeHeader);
        const blob = new Blob([html], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        });
        const name = suggestedName.replace(/\.xlsx$/i, '.xls');
        await saveWithPicker(blob, name);
    }
}
