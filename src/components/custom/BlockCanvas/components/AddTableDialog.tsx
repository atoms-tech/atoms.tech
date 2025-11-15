'use client';

import React, { useCallback, useRef, useState } from 'react';

import {
    ParsedTable,
    parseTableFile,
} from '@/components/custom/BlockCanvas/utils/importTable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type TableLayoutOption = 'blank' | 'requirements_default' | 'import';

interface AddTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (
        layout: TableLayoutOption,
        name: string,
        imported?: { headers: string[]; rows: Array<Array<unknown>> },
    ) => Promise<void> | void;
}

export function AddTableDialog({ isOpen, onClose, onCreate }: AddTableDialogProps) {
    const [layout, setLayout] = useState<TableLayoutOption>('requirements_default');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableName, setTableName] = useState('');
    const [importPreview, setImportPreview] = useState<ParsedTable | null>(null);
    const [importError, setImportError] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const resetImportState = useCallback(() => {
        setImportPreview(null);
        setImportError('');
        setIsParsing(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleCreate = async () => {
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            // Close immediately to prevent flicker/reopen during hydration
            onClose();
            if (layout === 'import') {
                await onCreate(layout, tableName.trim(), {
                    headers: importPreview?.headers || [],
                    rows: importPreview?.rows || [],
                });
            } else {
                await onCreate(layout, tableName.trim());
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setIsParsing(true);
        setImportError('');
        try {
            const parsed = await parseTableFile(file);
            setImportPreview(parsed);
        } catch (e) {
            const msg =
                (e as Error)?.message ||
                'Failed to parse file. Please ensure it is CSV, Excel (.xlsx/.xls) or ReqIF.';
            setImportError(msg);
            setImportPreview(null);
        } finally {
            setIsParsing(false);
        }
    }, []);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                // Only handle close from internal interactions (esc, click outside)
                if (!open) {
                    onClose();
                    resetImportState();
                    setLayout('requirements_default');
                    setTableName('');
                }
            }}
        >
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>New Table</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Table Name</label>
                        <Input
                            placeholder="Untitled Table"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                        />
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLayout('requirements_default')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                                setLayout('requirements_default');
                        }}
                        className={`border rounded-md p-3 cursor-pointer ${layout === 'requirements_default' ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                    >
                        <div className="font-medium">Requirements Default</div>
                        <div className="text-sm text-muted-foreground">
                            External_ID, Name, Description, Status, Priority columns. No
                            rows.
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLayout('blank')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setLayout('blank');
                        }}
                        className={`border rounded-md p-3 cursor-pointer ${layout === 'blank' ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                    >
                        <div className="font-medium">Blank</div>
                        <div className="text-sm text-muted-foreground">
                            No columns, no rows.
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLayout('import')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setLayout('import');
                        }}
                        className={`border rounded-md p-3 cursor-pointer ${layout === 'import' ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                    >
                        <div className="font-medium">Import from file</div>
                        <div className="text-sm text-muted-foreground">
                            Upload or drop CSV, Excel (.xlsx/.xls), or ReqIF (.reqif).
                        </div>
                    </div>

                    {layout === 'import' && (
                        <div className="space-y-2">
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    void handleFiles(e.dataTransfer?.files || null);
                                }}
                                className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${isDragging ? 'border-primary bg-muted/40' : 'border-muted'}`}
                            >
                                <div className="text-sm">
                                    Drag and drop a file here, or{' '}
                                    <button
                                        type="button"
                                        className="text-primary underline underline-offset-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        browse
                                    </button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Accepted: .csv, .xlsx, .xls, .reqif
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.reqif,.xml,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/xml,text/xml"
                                    className="hidden"
                                    onChange={(e) => void handleFiles(e.target.files)}
                                />
                            </div>
                            {isParsing && (
                                <div className="text-xs text-muted-foreground">
                                    Parsing file…
                                </div>
                            )}
                            {importError && (
                                <div className="text-xs text-red-500">{importError}</div>
                            )}
                            {importPreview && (
                                <div className="text-xs text-muted-foreground">
                                    Detected {importPreview.headers.length} columns and{' '}
                                    {importPreview.rows.length} rows
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={
                            isSubmitting ||
                            (layout === 'import' && (!importPreview || isParsing))
                        }
                    >
                        {isSubmitting
                            ? layout === 'import'
                                ? 'Importing...'
                                : 'Creating...'
                            : layout === 'import'
                              ? 'Import Table'
                              : 'Create Table'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
