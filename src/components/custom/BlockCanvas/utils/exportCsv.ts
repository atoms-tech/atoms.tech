'use client';

// Simple CSV utilities for table export
export function escapeCsvField(value: unknown): string {
    const s =
        value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
    // Escape quotes by doubling them and wrap field in quotes if needed
    const needsQuoting = s.includes(',') || s.includes('\n') || s.includes('"');
    const escaped = s.replace(/"/g, '""');
    return needsQuoting ? `"${escaped}"` : escaped;
}

export function buildCsv(
    headers: string[],
    rows: Array<Array<unknown>>,
    includeHeader = true,
): string {
    const headerLine = includeHeader
        ? headers.map((h) => (h ?? '').toString().replace(/\r?\n/g, ' ')).join(',')
        : null;
    const dataLines = rows.map((row) =>
        row.map((cell) => escapeCsvField(cell)).join(','),
    );
    const lines =
        includeHeader && headerLine != null ? [headerLine, ...dataLines] : dataLines;
    return lines.join('\r\n');
}

// Save using the File System Access API if available; fallback to anchor download
export async function saveCsvWithPicker(
    csvContent: string,
    suggestedName: string,
): Promise<void> {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    await saveWithPicker(blob, suggestedName);
}

// Generic file save with picker (cancel-safe) with fallback download
export async function saveWithPicker(blob: Blob, suggestedName: string): Promise<void> {
    const w = (typeof window !== 'undefined' ? window : {}) as unknown as {
        showSaveFilePicker?: (options?: unknown) => Promise<{
            createWritable: () => Promise<{
                write: (b: Blob) => Promise<void>;
                close: () => Promise<void>;
            }>;
        }>;
    };

    // Helper to detect user-cancelled picker
    const isUserCancel = (err: unknown): boolean => {
        const anyErr = err as { name?: string; message?: string };
        const name = (anyErr?.name || '').toLowerCase();
        const msg = (anyErr?.message || '').toLowerCase();
        return name === 'aborterror' || msg.includes('abort') || msg.includes('cancel');
    };

    if (w?.showSaveFilePicker) {
        try {
            const handle = await w.showSaveFilePicker({
                suggestedName,
                excludeAcceptAllOption: false,
            } as unknown);
            // @ts-expect-error - createWritable exists on file handle in supporting browsers
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            // If user cancelled, do nothing
            if (isUserCancel(err)) return;
            // Otherwise, fallback to download
            downloadBlob(blob, suggestedName);
            return;
        }
    }
    // If picker not supported, fallback to download
    downloadBlob(blob, suggestedName);
}

export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
