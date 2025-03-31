import {
    Brain,
    Check,
    CircleAlert,
    FilePlus,
    Upload,
    Wand,
} from 'lucide-react';
import {
    ChangeEvent,
    Dispatch,
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
    useUpdateExternalDocumentGumloopName,
    useUploadExternalDocument,
} from '@/hooks/mutations/useExternalDocumentsMutations';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useChunkr } from '@/hooks/useChunkr';
import { useGumloop } from '@/hooks/useGumloop';
import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

interface RequirementFormProps {
    organizationId: string;
    requirement: {
        id: string;
        name?: string;
    };
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
    // missingFilesError: string;
    // setMissingFilesError: Dispatch<SetStateAction<string>>;
    selectedFiles: { [key: string]: string };
    setSelectedFiles: Dispatch<SetStateAction<{ [key: string]: string }>>;
}

export function RequirementForm({
    organizationId,
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
    // missingFilesError,
    // setMissingFilesError,
    selectedFiles,
    setSelectedFiles,
}: RequirementFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setReqText(e.target.value);
    };

    const [isUploading, setIsUploading] = useState(false);
    const [processingPdfFiles, setProcessingPdfFiles] = useState<
        { name: string; supabaseId: string }[]
    >([]);

    const uploadFileToSupabase = useUploadExternalDocument();
    const updateGumloopName = useUpdateExternalDocumentGumloopName();

    const { uploadFiles } = useGumloop();
    const { startOcrTask, getTaskStatuses } = useChunkr();
    const [ocrPipelineTaskIds, setOcrPipelineTaskIds] = useState<string[]>([]);
    const taskStatusQueries = getTaskStatuses(ocrPipelineTaskIds);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);
            setIsUploading(true);
            // setMissingFilesError('');

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
                        [file.name]: file.name,
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

            const taskIds = await startOcrTask(
                pdfFiles.map((file) => file.file),
            );
            setOcrPipelineTaskIds(taskIds);
        } catch (error) {
            setIsUploading(false);
            console.error('Failed to upload files:', error);
        }
    };

    const { data: existingDocs } = useExternalDocumentsByOrg(organizationId);
    const existingDocsNameMap = useMemo(() => {
        if (!existingDocs) return {};
        return existingDocs.reduce(
            (acc, doc) => {
                acc[doc.name] = doc.gumloop_name || doc.name;
                return acc;
            },
            {} as { [key: string]: string },
        );
    }, [existingDocs]);
    const [existingDocsValue, setExistingDocsValue] = useState<string>('');

    const handleExistingDocSelect = (docName: string) => {
        // setMissingFilesError('');
        setSelectedFiles((prev) => ({
            ...prev,
            [existingDocsNameMap[docName]]: docName,
        }));
        setExistingDocsValue('');
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
                updateGumloopName.mutate({
                    documentId: currentFile.supabaseId,
                    gumloopName: convertedFileName,
                    orgId: organizationId,
                });
                console.log(
                    'Updated Gumloop name for file:',
                    convertedFileName,
                );

                setSelectedFiles((prev) => ({
                    ...prev,
                    [convertedFileName]: currentFile.name,
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
                        className="text-sm font-medium text-muted-foreground block mb-1"
                    >
                        System Name - Optional
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
                        className="text-sm font-medium text-muted-foreground block mb-1"
                    >
                        System Objective - Optional
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
                {missingReqError && (
                    // || missingFilesError
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded">
                        <CircleAlert className="h-4 w-4" />
                        <span>
                            {
                                missingReqError
                                // || missingFilesError
                            }
                        </span>
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
