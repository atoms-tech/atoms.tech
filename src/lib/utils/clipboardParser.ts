/**
 * Clipboard Parser Utility for Excel/Google Sheets Data
 * 
 * This utility handles parsing clipboard data from Excel and Google Sheets,
 * which typically comes in as tab-separated values (TSV) format.
 * 
 * Features:
 * - Parse TSV/CSV data from clipboard
 * - Auto-detect column headers
 * - Map data to existing table columns
 * - Validate and convert data types
 * - Handle malformed data gracefully
 */

import Papa from 'papaparse';

export interface ClipboardParseResult {
    success: boolean;
    data: Record<string, any>[];
    headers: string[];
    errors: string[];
    warnings: string[];
    columnMapping?: Record<string, string>;
}

export interface ParseOptions {
    hasHeaders?: boolean;
    delimiter?: string;
    skipEmptyLines?: boolean;
    trimHeaders?: boolean;
    maxRows?: number;
}

export interface ColumnMappingOptions {
    existingColumns: string[];
    autoMap?: boolean;
    caseSensitive?: boolean;
}

/**
 * Parse clipboard data (typically TSV from Excel/Google Sheets)
 */
export function parseClipboardData(
    clipboardText: string,
    options: ParseOptions = {}
): ClipboardParseResult {
    const {
        hasHeaders = true,
        delimiter = '\t', // Default to tab for Excel/Sheets
        skipEmptyLines = true,
        trimHeaders = true,
        maxRows = 1000
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate input
    if (!clipboardText || clipboardText.trim().length === 0) {
        return {
            success: false,
            data: [],
            headers: [],
            errors: ['No data found in clipboard'],
            warnings: []
        };
    }

    try {
        // Parse with PapaParse
        const parseResult = Papa.parse(clipboardText, {
            delimiter,
            header: hasHeaders,
            skipEmptyLines,
            trimHeaders,
            dynamicTyping: true, // Auto-convert numbers, booleans
            transformHeader: (header: string) => {
                // Clean up header names
                return trimHeaders ? header.trim() : header;
            }
        });

        // Check for parsing errors
        if (parseResult.errors && parseResult.errors.length > 0) {
            parseResult.errors.forEach(error => {
                if (error.type === 'Quotes') {
                    warnings.push(`Quote parsing issue at row ${error.row}: ${error.message}`);
                } else {
                    errors.push(`Parse error at row ${error.row}: ${error.message}`);
                }
            });
        }

        let data = parseResult.data as Record<string, any>[];
        let headers: string[] = [];

        // Extract headers
        if (hasHeaders && parseResult.meta?.fields) {
            headers = parseResult.meta.fields;
        } else if (data.length > 0) {
            // Generate headers if not provided
            const firstRow = data[0];
            headers = Object.keys(firstRow).map((_, index) => `Column ${index + 1}`);
        }

        // Limit rows if specified
        if (maxRows && data.length > maxRows) {
            data = data.slice(0, maxRows);
            warnings.push(`Data truncated to ${maxRows} rows`);
        }

        // Validate data structure
        if (data.length === 0) {
            return {
                success: false,
                data: [],
                headers,
                errors: ['No valid data rows found'],
                warnings
            };
        }

        // Clean up data - remove completely empty rows
        data = data.filter(row => {
            return Object.values(row).some(value => 
                value !== null && value !== undefined && value !== ''
            );
        });

        return {
            success: true,
            data,
            headers,
            errors,
            warnings
        };

    } catch (error) {
        return {
            success: false,
            data: [],
            headers: [],
            errors: [`Failed to parse clipboard data: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings
        };
    }
}

/**
 * Map parsed data columns to existing table columns
 */
export function mapColumnsToExisting(
    parseResult: ClipboardParseResult,
    options: ColumnMappingOptions
): ClipboardParseResult & { columnMapping: Record<string, string> } {
    const { existingColumns, autoMap = true, caseSensitive = false } = options;
    const columnMapping: Record<string, string> = {};

    if (!parseResult.success || !autoMap) {
        return { ...parseResult, columnMapping };
    }

    // Create mapping from parsed headers to existing columns
    parseResult.headers.forEach(parsedHeader => {
        const normalizedParsed = caseSensitive ? parsedHeader : parsedHeader.toLowerCase();
        
        // Try exact match first
        let matchedColumn = existingColumns.find(col => 
            caseSensitive ? col === parsedHeader : col.toLowerCase() === normalizedParsed
        );

        // Try partial match if no exact match
        if (!matchedColumn) {
            matchedColumn = existingColumns.find(col => {
                const normalizedExisting = caseSensitive ? col : col.toLowerCase();
                return normalizedExisting.includes(normalizedParsed) || 
                       normalizedParsed.includes(normalizedExisting);
            });
        }

        if (matchedColumn) {
            columnMapping[parsedHeader] = matchedColumn;
        }
    });

    return { ...parseResult, columnMapping };
}

/**
 * Transform parsed data to match existing table structure
 */
export function transformDataForTable(
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    existingColumns: string[]
): Record<string, any>[] {
    return data.map(row => {
        const transformedRow: Record<string, any> = {};
        
        // Initialize with empty values for all existing columns
        existingColumns.forEach(col => {
            transformedRow[col] = '';
        });

        // Map data using column mapping
        Object.entries(row).forEach(([parsedColumn, value]) => {
            const mappedColumn = columnMapping[parsedColumn];
            if (mappedColumn && existingColumns.includes(mappedColumn)) {
                transformedRow[mappedColumn] = value;
            }
        });

        return transformedRow;
    });
}

/**
 * Validate clipboard data against table schema
 */
export function validateClipboardData(
    data: Record<string, any>[],
    columnTypes?: Record<string, string>
): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || data.length === 0) {
        errors.push('No data to validate');
        return { isValid: false, errors, warnings };
    }

    // Basic validation
    data.forEach((row, index) => {
        const rowNumber = index + 1;
        
        // Check if row has any data
        const hasData = Object.values(row).some(value => 
            value !== null && value !== undefined && value !== ''
        );
        
        if (!hasData) {
            warnings.push(`Row ${rowNumber} is empty`);
        }

        // Type validation if column types provided
        if (columnTypes) {
            Object.entries(row).forEach(([column, value]) => {
                const expectedType = columnTypes[column];
                if (expectedType && value !== null && value !== undefined && value !== '') {
                    // Add type validation logic here if needed
                    // For now, we rely on PapaParse's dynamic typing
                }
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Main function to handle complete clipboard paste workflow
 */
export async function handleClipboardPaste(
    existingColumns: string[],
    parseOptions: ParseOptions = {},
    mappingOptions: Omit<ColumnMappingOptions, 'existingColumns'> = {}
): Promise<ClipboardParseResult & { columnMapping: Record<string, string> }> {
    try {
        // Read from clipboard
        const clipboardText = await navigator.clipboard.readText();
        
        // Parse the data
        const parseResult = parseClipboardData(clipboardText, parseOptions);
        
        if (!parseResult.success) {
            return { ...parseResult, columnMapping: {} };
        }

        // Map columns
        const mappedResult = mapColumnsToExisting(parseResult, {
            existingColumns,
            ...mappingOptions
        });

        return mappedResult;
    } catch (error) {
        return {
            success: false,
            data: [],
            headers: [],
            errors: [`Failed to read clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
            columnMapping: {}
        };
    }
}
