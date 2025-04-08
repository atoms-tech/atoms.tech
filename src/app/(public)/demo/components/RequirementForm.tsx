'use client';

import { Brain, CircleAlert, FilePlus, Shield, Wand } from 'lucide-react';
import { ChangeEvent, Dispatch, SetStateAction, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemoAnalysis } from '@/hooks/useDemoAnalysis';

export interface DemoFile {
    name: string;
    gumloopName: string;
    file: File;
}

interface RequirementFormProps {
    _organizationId: string;
    _requirement: {
        id: string;
    };
    reqText: string;
    setReqText: Dispatch<SetStateAction<string>>;
    systemName: string;
    setSystemName: Dispatch<SetStateAction<string>>;
    objective: string;
    setObjective: Dispatch<SetStateAction<string>>;
    isReasoning: boolean;
    setIsReasoning: Dispatch<SetStateAction<boolean>>;
    useRegulation: boolean;
    setUseRegulation: Dispatch<SetStateAction<boolean>>;
    isAnalysing: boolean;
    handleAnalyze: () => void;
    missingReqError: string;
    selectedFiles: { [key: string]: DemoFile };
    setSelectedFiles: Dispatch<SetStateAction<{ [key: string]: DemoFile }>>;
}

export function RequirementForm({
    _organizationId,
    _requirement,
    reqText,
    setReqText,
    systemName,
    setSystemName,
    objective,
    setObjective,
    isReasoning,
    setIsReasoning,
    useRegulation,
    setUseRegulation,
    isAnalysing,
    handleAnalyze,
    missingReqError,
    selectedFiles,
    setSelectedFiles,
}: RequirementFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startAnalysis: _startAnalysis } = useDemoAnalysis();

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setReqText(e.target.value);
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);

            // Add files to selectedFiles without uploading to Gumloop
            files.forEach((file) => {
                setSelectedFiles((prev) => ({
                    ...prev,
                    [file.name]: {
                        name: file.name,
                        gumloopName: file.name,
                        file: file,
                    },
                }));
            });
        } catch (error) {
            console.error('Failed to process files:', error);
        }
    };

    return (
        <Card className="p-6 dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px]">
            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="requirement"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Requirement
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="requirement"
                            name="requirement"
                            rows={4}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-black dark:border-gray-600 dark:text-white"
                            value={reqText}
                            onChange={handleInputChange}
                            placeholder="Enter your requirement here..."
                        />
                    </div>
                    {missingReqError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <CircleAlert className="h-4 w-4" />
                            {missingReqError}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="systemName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        System Name
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            id="systemName"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-black dark:border-gray-600 dark:text-white"
                            value={systemName}
                            onChange={(e) => setSystemName(e.target.value)}
                            placeholder="Enter system name..."
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="objective"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Objective
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            id="objective"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-black dark:border-gray-600 dark:text-white"
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Enter objective..."
                        />
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="reasoning"
                            checked={isReasoning}
                            onChange={() => setIsReasoning(!isReasoning)}
                        />
                        <label
                            htmlFor="reasoning"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                        >
                            <Brain className="h-4 w-4" />
                            Enable Reasoning
                        </label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="regulation"
                            checked={useRegulation}
                            onChange={() => setUseRegulation(!useRegulation)}
                        />
                        <label
                            htmlFor="regulation"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                        >
                            <Shield className="h-4 w-4" />
                            Enable Regulation
                        </label>
                    </div>
                </div>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                        multiple
                    />
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FilePlus className="h-4 w-4 mr-2" />
                        Upload Files
                    </Button>
                </div>

                {Object.keys(selectedFiles).length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-white">
                            Selected Files
                        </h3>
                        <ul className="space-y-1">
                            {Object.values(selectedFiles).map((file) => (
                                <li
                                    key={file.name}
                                    className="text-sm text-gray-600 dark:text-gray-300"
                                >
                                    {file.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Button
                    className="w-full"
                    onClick={handleAnalyze}
                    disabled={isAnalysing}
                >
                    <Wand className="h-4 w-4 mr-2" />
                    {isAnalysing ? 'Analyzing...' : 'Analyze'}
                </Button>
            </div>
        </Card>
    );
}
