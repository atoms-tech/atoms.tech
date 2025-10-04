import {
    Brain,
    Check,
    CircleAlert,
    FilePlus,
    Pencil,
    Save,
    Trash,
    Upload,
    Wand,
    X,
} from 'lucide-react';
import {
    ChangeEvent,
    Dispatch,
    KeyboardEvent,
    SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

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
import {
    useUpdateExternalDocument,
    useUploadExternalDocument,
} from '@/hooks/mutations/useExternalDocumentsMutations';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useChunkr } from '@/hooks/useChunkr';
import { useGumloop } from '@/hooks/useGumloop';
import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

export interface RegulationFile {
    name: string;
    gumloopName: string;
    supabaseId: string;
}

interface RequirementFormProps {
    organizationId: string;
    requirement: {
        id: string;
        name?: string;
    };
    origReqText: string;
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
    isPersistent: boolean;
    handleSave: () => void;
    isSaving: boolean;
    missingReqError: string;
    missingFilesError: string;
    setMissingFilesError: Dispatch<SetStateAction<string>>;
    selectedFiles: { [key: string]: RegulationFile };
    setSelectedFiles: Dispatch<SetStateAction<{ [key: string]: RegulationFile }>>;
}

export function RequirementForm({
    organizationId,
    requirement,
    origReqText,
    reqText,
    setReqText,
    // systemName,
    // setSystemName,
    // objective,
    // setObjective,
    isReasoning,
    setIsReasoning,
    isAnalysing,
    handleAnalyze,
    isPersistent,
    handleSave,
    isSaving,
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
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editingFileName, setEditingFileName] = useState<string>('');

    const uploadFileToSupabase = useUploadExternalDocument();
    const updateGumloopName = useUpdateExternalDocument();

    const { uploadFiles } = useGumloop();
    const { startOcrTask, getTaskStatuses } = useChunkr();
    const [ocrPipelineTaskIds, setOcrPipelineTaskIds] = useState<string[]>([]);
    const taskStatusQueries = getTaskStatuses(ocrPipelineTaskIds);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        return origReqText !== reqText && reqText !== '';
    }, [origReqText, reqText]);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);
            setIsUploading(true);
            setMissingFilesError('');

            // upload to Supabase
            const uploadPromises = files.map((file) =>
                uploadFileToSupabase.mutateAsync({
                    file,
                    orgId: organizationId,
                }),
            );
            const supabaseUploads = await Promise.all(uploadPromises);
            console.log('Uploaded files to Supabase');

            const nonPdfFiles = [];
            const pdfFiles = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const supabaseId = supabaseUploads[i].id;
                if (file.name.toLowerCase().endsWith('.pdf')) {
                    pdfFiles.push({
                        file,
                        supabaseId,
                        name: file.name,
                    });
                } else {
                    nonPdfFiles.push({
                        file,
                        supabaseId,
                        name: file.name,
                    });
                }
            }

            // upload to Gumloop
            if (nonPdfFiles.length > 0) {
                await uploadFiles(nonPdfFiles.map((file) => file.file));
                console.log('Uploaded files to Gumloop');

                // Add non-PDF files directly to selectedFiles
                nonPdfFiles.forEach((file) => {
                    setSelectedFiles((prev) => ({
                        ...prev,
                        [file.supabaseId]: {
                            name: file.name,
                            gumloopName: file.name,
                            supabaseId: file.supabaseId,
                        },
                    }));
                });

                const gumloopNamePromises = nonPdfFiles.map((file) => {
                    updateGumloopName.mutateAsync({
                        documentId: file.supabaseId,
                        gumloopName: file.name,
                        orgId: organizationId,
                    });
                });
                await Promise.all(gumloopNamePromises);
                console.log('Updated gumloop names in Supabase');
            }

            if (pdfFiles.length == 0) {
                setIsUploading(false);
                return;
            }

            setProcessingPdfFiles(pdfFiles);

            const taskIds = await startOcrTask(pdfFiles.map((file) => file.file));
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
                (query) => query.isError || query.data?.status === TaskStatus.FAILED,
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
                (query) => query.isSuccess && query.data?.status === TaskStatus.SUCCEEDED,
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
                updateGumloopName.mutate({
                    documentId: currentFile.supabaseId,
                    gumloopName: convertedFileName,
                    orgId: organizationId,
                });
                console.log('Updated Gumloop name for file:', convertedFileName);

                setSelectedFiles((prev) => ({
                    ...prev,
                    [currentFile.supabaseId]: {
                        ...currentFile,
                        gumloopName: convertedFileName,
                    },
                }));
            }

            setIsUploading(false);
            setOcrPipelineTaskIds([]);
            setProcessingPdfFiles([]);
        }
    }, [
        organizationId,
        processingPdfFiles,
        setSelectedFiles,
        taskStatusQueries,
        updateGumloopName,
        uploadFiles,
    ]);

    const { data: existingDocs } = useExternalDocumentsByOrg(organizationId);
    const unusedDocsNameMap = useMemo(() => {
        if (!existingDocs) return {};
        return existingDocs
            .filter((doc) => !(doc.id in selectedFiles))
            .reduce(
                (acc, doc) => {
                    if (!doc.gumloop_name) return acc;
                    acc[doc.id] = {
                        name: doc.name,
                        supabaseId: doc.id,
                        gumloopName: doc.gumloop_name,
                    };
                    return acc;
                },
                {} as { [key: string]: RegulationFile },
            );
    }, [existingDocs, selectedFiles]);
    const [existingDocsValue, setExistingDocsValue] = useState<string>('');

    const handleExistingDocSelect = (supabaseId: string) => {
        setMissingFilesError('');
        setSelectedFiles((prev) => ({
            ...prev,
            [supabaseId]: unusedDocsNameMap[supabaseId],
        }));
        setExistingDocsValue('');
    };

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

        // Update in Supabase
        updateGumloopName.mutate({
            documentId: fileToUpdate.supabaseId,
            name: editingFileName,
            orgId: organizationId,
        });
        console.log('Updated document name in Supabase');

        // Update in local state
        setSelectedFiles((prev) => {
            const updatedFiles = { ...prev };
            delete updatedFiles[supabaseId];
            updatedFiles[supabaseId] = {
                ...fileToUpdate,
                name: editingFileName,
            };
            return updatedFiles;
        });

        setEditingFile(null);
    };

    const handleCancelEdit = () => {
        setEditingFile(null);
        setEditingFileName('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, supabaseId: string) => {
        if (e.key === 'Enter') {
            handleSaveFileName(supabaseId);
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

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
            <h3 className="font-semibold mb-2">{requirement?.name}</h3>
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
                        {isPersistent && (
                            <Button
                                className="gap-2"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {hasUnsavedChanges ? 'Save*' : 'Save'}
                            </Button>
                        )}
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

                {/* {hasUnsavedChanges && (
                    <div className="flex items-center gap-2 text-amber-500 bg-amber-50 p-2 rounded">
                        <Info className="h-4 w-4" />
                        <span>You have unsaved changes</span>
                    </div>
                )} */}

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
                    //accept other than pdf
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
                                <li
                                    key={supabaseId}
                                    className="text-sm text-muted-foreground flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <Check className="h-3 w-3 mr-1" />
                                        {editingFile === supabaseId ? (
                                            <input
                                                type="text"
                                                value={editingFileName}
                                                onChange={(e) =>
                                                    setEditingFileName(e.target.value)
                                                }
                                                onKeyDown={(e) =>
                                                    handleKeyDown(e, supabaseId)
                                                }
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
                                                    onClick={() =>
                                                        handleSaveFileName(supabaseId)
                                                    }
                                                    className="text-green-500 hover:text-green-700 mr-1"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        handleEditFile(supabaseId)
                                                    }
                                                    className="text-gray-500 hover:text-gray-700 mr-1"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleRemoveFile(supabaseId)
                                                    }
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
        </Card>
    );
}