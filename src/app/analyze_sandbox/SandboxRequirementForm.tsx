"use client";

import {
    Brain,
    Check,
    FilePlus,
    Pencil,
    Save,
    Upload,
    Wand,
    X,
    Trash,
    CircleAlert,
} from 'lucide-react';
import React, { ChangeEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LocalRegulationFile = {
    name: string;
    gumloopName: string;
    supabaseId: string; // local id placeholder
    file?: File;
};

export function SandboxRequirementForm({
    reqText,
    setReqText,
    isReasoning,
    setIsReasoning,
    isAnalysing,
    onAnalyze,
    onFilesChanged,
}: {
    reqText: string;
    setReqText: (v: string) => void;
    isReasoning: boolean;
    setIsReasoning: (v: boolean) => void;
    isAnalysing: boolean;
    onAnalyze: () => void;
    onFilesChanged: (files: { [key: string]: { file?: File } }) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [analysisData, setAnalysisData] = useState<unknown>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editingFileName, setEditingFileName] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<Record<string, LocalRegulationFile>>(
        {},
    );

    const hasUnsavedChanges = useMemo(() => reqText.trim().length > 0, [reqText]);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            const files = Array.from(e.target.files);
            // Add directly to local selectedFiles (no Supabase/Gumloop in sandbox)
            setSelectedFiles((prev) => {
                const updated = { ...prev };
                for (const file of files) {
                    const id = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 7)}`;
                    updated[id] = {
                        name: file.name,
                        gumloopName: file.name,
                        supabaseId: id,
                        file,
                    };
                }
                return updated;
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditFile = (supabaseId: string) => {
        setEditingFile(supabaseId);
        setEditingFileName(selectedFiles[supabaseId].name);
    };

    const handleSaveFileName = (supabaseId: string) => {
        if (
            editingFileName.trim() === '' ||
            editingFileName === selectedFiles[supabaseId].name
        ) {
            setEditingFile(null);
            setEditingFileName('');
            return;
        }
        const fileToUpdate = selectedFiles[supabaseId];
        setSelectedFiles((prev) => {
            const updated = { ...prev };
            updated[supabaseId] = {
                ...fileToUpdate,
                name: editingFileName,
                gumloopName: editingFileName,
            };
            return updated;
        });
        setEditingFile(null);
    };

    const handleCancelEdit = () => {
        setEditingFile(null);
        setEditingFileName('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, supabaseId: string) => {
        if (e.key === 'Enter') handleSaveFileName(supabaseId);
        else if (e.key === 'Escape') handleCancelEdit();
    };

    const handleRemoveFile = (supabaseId: string) => {
        setSelectedFiles((prev) => {
            const updated = { ...prev };
            delete updated[supabaseId];
            return updated;
        });
    };

    const [existingDocsValue, setExistingDocsValue] = useState<string>('');

    const unusedDocsNameMap: Record<string, LocalRegulationFile> = {}; // No existing docs in sandbox

    const handleExistingDocSelect = (supabaseId: string) => {
        // For parity, if you prefill unusedDocsNameMap, this will add it
        const doc = unusedDocsNameMap[supabaseId];
        if (!doc) return;
        setSelectedFiles((prev) => ({ ...prev, [supabaseId]: doc }));
        setExistingDocsValue('');
    };

    const [uploadButtonText, setUploadButtonText] = useState('Upload Regulation Document');

    React.useEffect(() => {
        if (isUploading) setUploadButtonText('Uploading...');
        else setUploadButtonText('Upload Regulation Document');
    }, [isUploading]);

    const emitFiles = () => {
        const sf: { [k: string]: { file?: File } } = Object.fromEntries(
            Object.entries(selectedFiles).map(([k, v]) => [k, { file: v.file }]),
        );
        onFilesChanged(sf);
    };

    return (
        <Card className="p-6">
            <h3 className="font-semibold mb-2">Requirement</h3>
            <textarea
                className="w-full p-2 border rounded-md text-muted-foreground"
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                placeholder="Enter requirement text"
                style={{ height: '278px' }}
            />
            <div className="mt-4 space-y-8">
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        <Checkbox
                            checked={isReasoning}
                            onChange={() => setIsReasoning(!isReasoning)}
                            label="Reasoning"
                            labelClassName="hidden md:block"
                        />
                    </div>
                    <div className="flex gap-4">
                        {/* Save hidden in sandbox (no persistence) */}
                        {/* <Button className="gap-2" disabled>
                            <Save className="h-4 w-4" />
                            {hasUnsavedChanges ? 'Save*' : 'Save'}
                        </Button> */}
                        <Button className="gap-2" onClick={onAnalyze} disabled={isAnalysing}>
                            {isAnalysing ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                                <Wand className="h-4 w-4" />
                            )}
                            Analyze with AI
                        </Button>
                    </div>
                </div>

                {/* Optional error banner stub for parity */}
                {false && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded">
                        <CircleAlert className="h-4 w-4" />
                        <span>Error</span>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                    multiple
                    className="hidden"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 w-full"
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    {uploadButtonText}
                </Button>

                <div className="mt-2">
                    <Select
                        value={existingDocsValue}
                        onValueChange={handleExistingDocSelect}
                        disabled={Object.keys(unusedDocsNameMap).length === 0}
                    >
                        <SelectTrigger className="w-full gap-2">
                            <FilePlus className="h-4 w-4" />
                            <SelectValue placeholder="Use existing requirement document" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(unusedDocsNameMap).map((doc) => (
                                <SelectItem key={doc.supabaseId} value={doc.supabaseId}>
                                    {doc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {Object.keys(selectedFiles).length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Attached Files</h4>
                        <ul className="space-y-1">
                            {Object.entries(selectedFiles).map(([supabaseId, file]) => (
                                <li key={supabaseId} className="text-sm text-muted-foreground flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Check className="h-3 w-3 mr-1" />
                                        {editingFile === supabaseId ? (
                                            <input
                                                type="text"
                                                value={editingFileName}
                                                onChange={(e) => setEditingFileName(e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, supabaseId)}
                                                autoFocus
                                                className="p-1 border rounded-md text-sm"
                                            />
                                        ) : (
                                            file.name
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {editingFile === supabaseId ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveFileName(supabaseId)}
                                                    className="text-green-500 hover:text-green-700 mr-1"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEditFile(supabaseId)}
                                                    className="text-gray-500 hover:text-gray-700 mr-1"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFile(supabaseId)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Optional debug area - hidden by default for identical UI */}
        </Card>
    );
}
