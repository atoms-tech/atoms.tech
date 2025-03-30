import {
    Brain,
    Check,
    CircleAlert,
    FilePlus,
    Upload,
    Wand,
} from 'lucide-react';
import { ChangeEvent, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface RequirementFormProps {
    requirement: {
        id: string;
        name?: string;
    };
    reqText: string;
    setReqText: (text: string) => void;
    systemName: string;
    setSystemName: (name: string) => void;
    objective: string;
    setObjective: (objective: string) => void;
    isReasoning: boolean;
    setIsReasoning: (value: boolean) => void;
    isAnalysing: boolean;
    handleAnalyze: () => void;
    missingReqError: string;
    missingFilesError: string;
    isUploading: boolean;
    uploadButtonText: string;
    handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
    existingDocs?: Array<{ id: string; name: string }>;
    existingDocsValue: string;
    handleExistingDocSelect: (docName: string) => void;
    selectedFiles: { [key: string]: string };
}

export function RequirementForm({
    requirement,
    reqText,
    setReqText,
    systemName,
    setSystemName,
    objective,
    setObjective,
    isReasoning,
    setIsReasoning,
    isAnalysing,
    handleAnalyze,
    missingReqError,
    missingFilesError,
    isUploading,
    uploadButtonText,
    handleFileUpload,
    existingDocs,
    existingDocsValue,
    handleExistingDocSelect,
    selectedFiles,
}: RequirementFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setReqText(e.target.value);
    };

    return (
        <Card className="p-6">
            <h3 className="font-semibold mb-2">{requirement?.name}</h3>
            <textarea
                className="w-full h-32 p-2 border rounded-md text-muted-foreground"
                value={reqText}
                onChange={handleInputChange}
                placeholder="Enter requirement text"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label
                        htmlFor="systemName"
                        className="text-sm font-medium block mb-1"
                    >
                        System Name
                    </label>
                    <input
                        id="systemName"
                        type="text"
                        className="w-full p-2 border rounded-md text-muted-foreground"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        placeholder="e.g. Backup Camera"
                    />
                </div>
                <div>
                    <label
                        htmlFor="objective"
                        className="text-sm font-medium block mb-1"
                    >
                        System Objective
                    </label>
                    <input
                        id="objective"
                        type="text"
                        className="w-full p-2 border rounded-md text-muted-foreground"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g. Provide rear visibility"
                    />
                </div>
            </div>
            <div className="mt-4 space-y-2">
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
                    <Button
                        className="gap-2"
                        onClick={handleAnalyze}
                        disabled={isAnalysing}
                    >
                        {isAnalysing ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                            <Wand className="h-4 w-4" />
                        )}
                        Analyze with AI
                    </Button>
                </div>
                {(missingReqError || missingFilesError) && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded">
                        <CircleAlert className="h-4 w-4" />
                        <span>{missingReqError || missingFilesError}</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.md"
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

                {existingDocs && existingDocs.length > 0 && (
                    <div className="mt-2">
                        <Select
                            value={existingDocsValue}
                            onValueChange={handleExistingDocSelect}
                        >
                            <SelectTrigger className="w-full gap-2">
                                <FilePlus className="h-4 w-4" />
                                <SelectValue placeholder="Add existing document" />
                            </SelectTrigger>
                            <SelectContent>
                                {existingDocs.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.name}>
                                        {doc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {Object.keys(selectedFiles).length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                            Attached Files
                        </h4>
                        <ul className="space-y-1">
                            {Object.values(selectedFiles).map((fileName) => (
                                <li
                                    key={fileName}
                                    className="text-sm text-muted-foreground flex items-center"
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    {fileName}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
}
