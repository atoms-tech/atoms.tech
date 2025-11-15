'use client';

// Lightweight, dependency-free table import utilities for CSV, Excel, and ReqIF

export type ParsedTable = {
    headers: string[];
    rows: Array<Array<unknown>>;
};

export async function parseTableFile(file: File): Promise<ParsedTable> {
    const name = (file.name || '').toLowerCase();
    const contentType = (file.type || '').toLowerCase();

    if (name.endsWith('.csv') || contentType.includes('csv') || isLikelyCsvName(name)) {
        const text = await file.text();
        return parseCsvText(text);
    }

    if (
        name.endsWith('.xlsx') ||
        name.endsWith('.xls') ||
        contentType.includes('excel') ||
        contentType.includes(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ) ||
        contentType.includes('application/vnd.ms-excel')
    ) {
        const buf = await file.arrayBuffer();
        return parseExcel(buf);
    }

    if (name.endsWith('.reqif') || name.endsWith('.xml') || contentType.includes('xml')) {
        const text = await file.text();
        return parseReqIF(text);
    }

    // Fallback: try CSV first, then Excel
    try {
        const text = await file.text();
        return parseCsvText(text);
    } catch {
        const buf = await file.arrayBuffer();
        return parseExcel(buf);
    }
}

function isLikelyCsvName(name: string): boolean {
    return /\.txt$/.test(name) || /\.data$/.test(name);
}

// ---------------- CSV ----------------

export function parseCsvText(text: string): ParsedTable {
    const rows = tokenizeCsv(text);
    if (rows.length === 0) return { headers: [], rows: [] };
    const headerCandidate = rows[0].map((h) => sanitizeHeader(String(h ?? '')));

    // If header is empty or all blank, synthesize Column N
    const allBlank = headerCandidate.every((h) => !h);
    const headers = allBlank
        ? rows[0].map((_c, i) => `Column ${i + 1}`)
        : uniqifyHeaders(headerCandidate);

    const dataRows = rows.slice(1).map((r) => {
        const out: unknown[] = [];
        for (let i = 0; i < headers.length; i++) {
            out.push(r[i] ?? '');
        }
        return out;
    });
    return { headers, rows: dataRows };
}

function tokenizeCsv(input: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    const pushField = () => {
        row.push(field);
        field = '';
    };
    const pushRow = () => {
        // Trim potential trailing carriage return
        result.push(row);
        row = [];
    };

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (inQuotes) {
            if (ch === '"') {
                const peek = input[i + 1];
                if (peek === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else {
            if (ch === ',') {
                pushField();
            } else if (ch === '\n') {
                pushField();
                pushRow();
            } else if (ch === '\r') {
                // Handle CRLF: lookahead for \n and skip it
                const peek = input[i + 1];
                if (peek === '\n') {
                    i++;
                }
                pushField();
                pushRow();
            } else if (ch === '"') {
                inQuotes = true;
            } else {
                field += ch;
            }
        }
    }
    // Push last field/row
    pushField();
    pushRow();
    // Remove possible empty last row if file ends with newline
    if (result.length > 0) {
        const last = result[result.length - 1];
        if (last.length === 1 && last[0] === '') {
            result.pop();
        }
    }
    return result;
}

// ---------------- Excel (.xlsx/.xls via SheetJS) ----------------

async function parseExcel(buf: ArrayBuffer): Promise<ParsedTable> {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { headers: [], rows: [] };
    const ws = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as Array<
        Array<unknown>
    >;
    if (!aoa || aoa.length === 0) return { headers: [], rows: [] };
    const rawHeaders = (aoa[0] || []).map((h) => sanitizeHeader(String(h ?? '')));
    const headers =
        rawHeaders.length > 0
            ? uniqifyHeaders(rawHeaders)
            : generateDefaultHeaders(aoa[0]?.length || 0);
    const dataRows = aoa.slice(1).map((r) => {
        const out: unknown[] = [];
        for (let i = 0; i < headers.length; i++) {
            out.push((r || [])[i] ?? '');
        }
        return out;
    });
    return { headers, rows: dataRows };
}

// ---------------- ReqIF (minimal STRING attributes) ----------------

function parseReqIF(xmlText: string): ParsedTable {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    // Basic error handling
    const parserError = doc.getElementsByTagName('parsererror')[0];
    if (parserError) {
        throw new Error('Invalid XML/ReqIF file');
    }
    const ns =
        doc.documentElement.namespaceURI ||
        'http://www.omg.org/spec/ReqIF/20110401/reqif.xsd';

    const q = (tag: string) => Array.from(doc.getElementsByTagNameNS(ns, tag));
    const defNodes = q('ATTRIBUTE-DEFINITION-STRING');
    const defIdToName = new Map<string, string>();
    const defOrder: string[] = [];
    for (const d of defNodes) {
        const id = d.getAttribute('IDENTIFIER') || '';
        const name = d.getAttribute('LONG-NAME') || '';
        if (id) {
            defIdToName.set(id, sanitizeHeader(name || 'Column'));
            defOrder.push(id);
        }
    }

    const soNodes = q('SPEC-OBJECT');
    const rows: Array<Array<unknown>> = [];
    const headersSet = new Set<string>();
    const rowsAsMaps: Array<Map<string, unknown>> = [];

    for (const so of soNodes) {
        const valueNodes = Array.from(
            so.getElementsByTagNameNS(ns, 'ATTRIBUTE-VALUE-STRING'),
        );
        const map = new Map<string, unknown>();
        for (const v of valueNodes) {
            const defRef = v.getElementsByTagNameNS(
                ns,
                'ATTRIBUTE-DEFINITION-STRING-REF',
            )[0];
            const valueNode = v.getElementsByTagNameNS(ns, 'THE-VALUE')[0];
            const defId = defRef?.textContent || '';
            const name = defIdToName.get(defId) || defId || 'Column';
            const value = valueNode?.textContent ?? '';
            map.set(name, value);
            headersSet.add(name);
        }
        rowsAsMaps.push(map);
    }

    // Determine headers: prefer def order mapped to names, then append any extras encountered
    const headersFromDefs = defOrder
        .map((id) => defIdToName.get(id))
        .filter((n): n is string => !!n);
    const extras = Array.from(headersSet).filter((h) => !headersFromDefs.includes(h));
    const headers = uniqifyHeaders([...headersFromDefs, ...extras]);

    for (const m of rowsAsMaps) {
        const row: unknown[] = [];
        for (const h of headers) {
            row.push(m.get(h) ?? '');
        }
        rows.push(row);
    }

    return { headers, rows };
}

// ---------------- Helpers ----------------

function sanitizeHeader(name: string): string {
    const trimmed = (name || '').replace(/\r?\n/g, ' ').trim();
    if (!trimmed) return '';
    return trimmed;
}

function uniqifyHeaders(headers: string[]): string[] {
    const seen = new Map<string, number>();
    return headers.map((h, idx) => {
        const base = h || `Column ${idx + 1}`;
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        if (count === 0) return base;
        return `${base} (${count + 1})`;
    });
}

function generateDefaultHeaders(n: number): string[] {
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(`Column ${i + 1}`);
    return out;
}
