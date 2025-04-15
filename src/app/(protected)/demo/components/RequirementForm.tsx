import { Brain, CircleAlert, Trash, Upload, Wand } from 'lucide-react';
import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useChunkr } from '@/hooks/useChunkr';
import { useGumloop } from '@/hooks/useGumloop';
import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

export interface RegulationFile {
    name: string;
    gumloopName: string;
}

interface RequirementFormProps {
    reqText: string;
    setReqText: Dispatch<SetStateAction<string>>;
    systemName: string;
    setSystemName: Dispatch<SetStateAction<string>>;
    objective: string;
    setObjective: Dispatch<SetStateAction<string>>;
    isReasoning: boolean;
    setIsReasoning: Dispatch<SetStateAction<boolean>>;
    isAnalysing: boolean;
    handleAnalyze: () => void;
    missingReqError: string;
    missingFilesError: string;
    setMissingFilesError: Dispatch<SetStateAction<string>>;
    selectedFiles: { [key: string]: RegulationFile };
    setSelectedFiles: Dispatch<
        SetStateAction<{ [key: string]: RegulationFile }>
    >;
}

export function RequirementForm({
    reqText,
    setReqText,
    isReasoning,
    setIsReasoning,
    isAnalysing,
    handleAnalyze,
    missingReqError,
    missingFilesError,
    setMissingFilesError,
    selectedFiles,
    setSelectedFiles,
}: RequirementFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [processingPdfFiles, setProcessingPdfFiles] = useState<
        Omit<RegulationFile, 'gumloopName'>[]
    >([]);

    const { uploadFiles } = useGumloop();
    const { startOcrTask, getTaskStatuses } = useChunkr();
    const [ocrPipelineTaskIds, setOcrPipelineTaskIds] = useState<string[]>([]);
    const taskStatusQueries = getTaskStatuses(ocrPipelineTaskIds);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);
            setIsUploading(true);
            setMissingFilesError('');

            const nonPdfFiles = [];
            const pdfFiles = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.toLowerCase().endsWith('.pdf')) {
                    pdfFiles.push({
                        file,
                        name: file.name,
                    });
                } else {
                    nonPdfFiles.push({
                        file,
                        name: file.name,
                    });
                }
            }

            // upload to Gumloop
            if (nonPdfFiles.length > 0) {
                await uploadFiles(nonPdfFiles.map((file) => file.file));
                console.log('Uploaded files to Gumloop');
            }

            if (pdfFiles.length == 0) {
                setIsUploading(false);
                return;
            }

            setProcessingPdfFiles(pdfFiles);

            const taskIds = await startOcrTask(
                pdfFiles.map((file) => file.file),
            );
            setOcrPipelineTaskIds(taskIds);
        } catch (error) {
            setIsUploading(false);
            console.error('Failed to upload files:', error);
        }
    };

    // set the selectedFiles when the pipeline run is completed
    useEffect(() => {
        // Check if taskStatuses array is empty or any queries are still loading
        if (!taskStatusQueries.length) {
            return;
        }

        // Check if any task failed
        if (
            taskStatusQueries.some(
                (query) =>
                    query.isError || query.data?.status === TaskStatus.FAILED,
            )
        ) {
            console.error('One or more OCR pipeline tasks failed');
            setIsUploading(false);
            setOcrPipelineTaskIds([]);
            setProcessingPdfFiles([]);
            return;
        }

        // Process all successful tasks
        if (
            taskStatusQueries.every(
                (query) =>
                    query.isSuccess &&
                    query.data?.status === TaskStatus.SUCCEEDED,
            )
        ) {
            // from each parsed file, construct a File object
            const markdownFiles = taskStatusQueries.map((query) => {
                const file = query.data as TaskResponse;
                let mdContents = '';
                for (const chunk of file.output.chunks) {
                    for (const segment of chunk.segments) {
                        mdContents += segment.markdown + '\n';
                    }
                    mdContents += '\n';
                }
                mdContents += '\n';
                const mdFilename = `${file.output.file_name.split('.pdf')[0]}.md`;
                const mdBlob = new Blob([mdContents], {
                    type: 'text/markdown',
                });
                return new File([mdBlob], mdFilename);
            });

            uploadFiles(markdownFiles);
            console.log('Uploaded files to Gumloop');

            for (let i = 0; i < markdownFiles.length; i++) {
                const convertedFileName = markdownFiles[i].name;
                const currentFile = processingPdfFiles[i];
                setSelectedFiles((prev) => ({
                    ...prev,
                    [currentFile.name]: {
                        ...currentFile,
                        gumloopName: convertedFileName,
                    },
                }));
            }

            setIsUploading(false);
            setOcrPipelineTaskIds([]);
            setProcessingPdfFiles([]);
        }
    }, [processingPdfFiles, setSelectedFiles, taskStatusQueries, uploadFiles]);

    const [uploadButtonText, setUploadButtonText] = useState('Upload Files');

    useEffect(() => {
        if (isUploading) {
            if (ocrPipelineTaskIds.length > 0) {
                setUploadButtonText('Converting...');
            } else setUploadButtonText('Uploading...');
        } else {
            setUploadButtonText('Upload Regulation Document');
        }
    }, [isUploading, ocrPipelineTaskIds]);

    const handleRemoveFile = async (supabaseId: string) => {
        // remove file from selectedFiles
        setSelectedFiles((prevFiles) => {
            const newFiles = { ...prevFiles };
            delete newFiles[supabaseId];
            return newFiles;
        });
    };

    return (
        <Card className="p-6">
            <h3 className="font-semibold mb-2">New Requirement</h3>
            <textarea
                className="w-full h-72 p-2 border rounded-md text-muted-foreground"
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                placeholder="Enter requirement text"
            />
            <div className="mt-4 space-y-4">
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
                </div>

                {missingReqError ||
                    (missingFilesError && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded">
                            <CircleAlert className="h-4 w-4" />
                            <span>{missingReqError || missingFilesError}</span>
                        </div>
                    ))}
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

                {Object.keys(selectedFiles).length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                            Attached Files
                        </h4>
                        <ul className="space-y-1">
                            {Object.entries(selectedFiles).map(
                                ([supabaseId, file]) => (
                                    <li
                                        key={file.name}
                                        className="text-sm text-muted-foreground flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            {file.name}
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() =>
                                                    handleRemoveFile(supabaseId)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </Card>
    );
}
