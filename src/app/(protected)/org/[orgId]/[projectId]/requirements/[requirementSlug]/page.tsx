'use client';

import {
    Brain,
    Check,
    CircleAlert,
    FilePlus,
    Scale,
    Target,
    Upload,
    Wand,
} from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FoldingCard } from '@/components/ui/folding-card';
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
import { useUpdateRequirement } from '@/hooks/mutations/useRequirementMutations';
import { useExternalDocumentsByOrg } from '@/hooks/queries/useExternalDocuments';
import { useRequirement } from '@/hooks/queries/useRequirement';
import { useChunkr } from '@/hooks/useChunkr';
import { useGumloop } from '@/hooks/useGumloop';
import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

interface AnalysisData {
    reqId: string;
    originalRequirement: string;
    earsRequirement: string;
    earsPattern: string;
    earsTemplate: string;
    incoseFormat: string;
    incoseFeedback: string;
    complianceFeedback: string;
    enhancedReqEars: string;
    enhancedReqIncose: string;
    enhancedGeneralFeedback: string;
    relevantRegulations: string;
}

export default function RequirementPage() {
    const organizationId = usePathname().split('/')[2];
    const { requirementSlug } = useParams<{
        requirementSlug: string;
    }>();
    const { data: requirement, isLoading: isReqLoading } =
        useRequirement(requirementSlug);
    const [reqText, setReqText] = useState<string>();

    // Set requirement description when loaded
    useEffect(() => {
        if (requirement) {
            setReqText(requirement?.description || '');
        }
    }, [requirement]);

    const [missingReqError, setMissingReqError] = useState<string>('');
    const [missingFilesError, setMissingFilesError] = useState<string>('');

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setReqText(e.target.value);
        if (missingReqError) {
            setMissingReqError('');
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

    const [selectedFiles, setSelectedFiles] = useState<{
        [key: string]: string;
    }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [processingPdfFiles, setProcessingPdfFiles] = useState<
        { name: string; supabaseId: string }[]
    >([]);

    const uploadFileToSupabase = useUploadExternalDocument();
    const updateGumloopName = useUpdateExternalDocumentGumloopName();

    const { startPipeline, getPipelineRun, uploadFiles } = useGumloop();
    const { startOcrTask, getTaskStatuses } = useChunkr();
    const [ocrPipelineTaskIds, setOcrPipelineTaskIds] = useState<string[]>([]);
    const taskStatusQueries = getTaskStatuses(ocrPipelineTaskIds);

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);
            setIsUploading(true);

            if (missingFilesError) {
                setMissingFilesError('');
            }

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

    const handleExistingDocSelect = (docName: string) => {
        if (missingFilesError) {
            setMissingFilesError('');
        }
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
            setUploadButtonText('Upload Files');
        }
    }, [isUploading, ocrPipelineTaskIds]);

    const [isReasoning, setIsReasoning] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisPipelineRunId, setAnalysisPipelineRunId] =
        useState<string>('');
    const { data: analysisResponse } = getPipelineRun(
        analysisPipelineRunId,
        organizationId,
    );
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const { mutateAsync: updateRequirement } = useUpdateRequirement();

    const handleAnalyze = async () => {
        if (!requirement) {
            setMissingReqError("Requirement hasn't loaded yet");
            return;
        }

        setAnalysisData(null);
        await updateRequirement({
            id: requirement.id,
            description: reqText,
        });

        // check if the requirement is empty
        if (!reqText) {
            setMissingReqError('Requirement text is required');
            return;
        }
        // or if no files are uploaded
        if (Object.keys(selectedFiles).length === 0) {
            setMissingFilesError('At least one file is required');
            return;
        }
        console.log('Starting analysis pipeline...');
        setMissingReqError('');
        setMissingFilesError('');
        setIsAnalysing(true);

        try {
            const { run_id } = await startPipeline({
                pipelineType: isReasoning
                    ? 'reasoning-requirement-analysis'
                    : 'requirement-analysis',
                requirement: reqText,
                systemName: 'Backup Camera',
                fileNames: Object.keys(selectedFiles),
            });
            setAnalysisPipelineRunId(run_id);
        } catch (error) {
            console.error('Failed to start analysis pipeline:', error);
        }
    };

    useEffect(() => {
        switch (analysisResponse?.state) {
            case 'DONE': {
                console.log('Analysis response:', analysisResponse);

                let analysisJSON = analysisResponse.outputs?.analysisJson;

                if (!analysisJSON) {
                    console.error('No analysis JSON found in response');
                    break;
                }

                if (Array.isArray(analysisJSON)) {
                    if (analysisJSON.length > 1) {
                        console.error(
                            'Multiple analysis JSONs found in response',
                        );
                        break;
                    }
                    analysisJSON = analysisJSON[0];
                }

                try {
                    // if ```json``` is present in the string, remove it
                    analysisJSON = analysisJSON.replace('```json\n', '');
                    analysisJSON = analysisJSON.replace('```', '');

                    const parsedData = JSON.parse(analysisJSON);
                    setAnalysisData({
                        reqId: parsedData['REQ ID'],
                        originalRequirement: parsedData['Original Requirement'],
                        earsRequirement:
                            parsedData['EARS Generated Requirement'],
                        earsPattern: parsedData['EARS Pattern'],
                        earsTemplate: parsedData['EARS_SYNTAX_TEMPLATE'],
                        incoseFormat: parsedData['INCOSE_FORMAT'],
                        incoseFeedback:
                            parsedData['INCOSE_REQUIREMENT_FEEDBACK'],
                        complianceFeedback: parsedData['COMPLIANCE_FEEDBACK'],
                        enhancedReqEars:
                            parsedData['ENHANCED_REQUIREMENT_EARS'],
                        enhancedReqIncose:
                            parsedData['ENHANCED_REQUIREMENT_INCOSE'],
                        enhancedGeneralFeedback:
                            parsedData['ENHANCED_GENERAL_FEEDBACK'],
                        relevantRegulations: parsedData['RELEVANT_REGULATIONS'],
                    });
                } catch (error) {
                    console.error('Failed to parse analysis JSON:', error);
                }
                break;
            }
            case 'FAILED': {
                console.error('Analysis pipeline failed');
                break;
            }
            default:
                return;
        }
        setAnalysisPipelineRunId('');
        setIsAnalysing(false);
    }, [analysisResponse]);

    const handleAcceptChange = async (text: string | undefined) => {
        if (!text || !requirement) {
            return;
        }
        setReqText(text);
        await updateRequirement({
            id: requirement.id,
            description: text,
        });
    };

    if (isReqLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="space-y-4 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-muted-foreground">
                            Loading requirement details...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Requirement</h2>
                    <Card className="p-6">
                        <h3 className="font-semibold mb-2">
                            {requirement?.name}
                        </h3>
                        <textarea
                            className="w-full h-32 p-2 border rounded-md text-muted-foreground"
                            value={reqText}
                            onChange={handleInputChange}
                        />
                        <div className="mt-4 space-y-2">
                            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 sm:gap-0">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    <Checkbox
                                        checked={isReasoning}
                                        onChange={() =>
                                            setIsReasoning(!isReasoning)
                                        }
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
                                    <span>
                                        {missingReqError || missingFilesError}
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
                                                <SelectItem
                                                    key={doc.id}
                                                    value={doc.name}
                                                >
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
                                        {Object.values(selectedFiles).map(
                                            (fileName) => (
                                                <li
                                                    key={fileName}
                                                    className="text-sm text-muted-foreground flex items-center"
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    {fileName}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column - Analysis Blocks */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>

                    {/* Original Requirement */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">
                                    Original Requirement
                                </h3>
                                {analysisData ? (
                                    <div className="text-muted-foreground text-sm">
                                        <p>
                                            <strong>ID:</strong>{' '}
                                            {analysisData.reqId}
                                        </p>
                                        <p>
                                            {analysisData.originalRequirement}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Upload files and analyze the requirement
                                        to get AI feedback
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* EARS */}
                    <FoldingCard
                        icon={<Target />}
                        title="EARS"
                        disabled={!analysisData}
                        defaultOpen={false}
                    >
                        <div className="text-muted-foreground text-sm">
                            <p>
                                <strong>Pattern:</strong>{' '}
                                {analysisData?.earsPattern}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                                <p>
                                    <strong>Requirement:</strong>{' '}
                                    {analysisData?.earsRequirement}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleAcceptChange(
                                            analysisData?.earsRequirement,
                                        )
                                    }
                                    disabled={!analysisData?.earsRequirement}
                                >
                                    Accept Pattern
                                </Button>
                            </div>
                            <p>
                                <strong>Template:</strong>{' '}
                                {analysisData?.earsTemplate}
                            </p>
                        </div>
                    </FoldingCard>

                    {/* INCOSE */}
                    <FoldingCard
                        icon={<Check />}
                        title="INCOSE"
                        disabled={!analysisData}
                        defaultOpen={false}
                    >
                        <div className="text-muted-foreground text-sm">
                            <div className="flex justify-between items-start mt-2">
                                <div>
                                    <p>
                                        <strong>Format:</strong>
                                    </p>
                                    <ReactMarkdown>
                                        {analysisData?.incoseFormat}
                                    </ReactMarkdown>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleAcceptChange(
                                            analysisData?.incoseFormat,
                                        )
                                    }
                                    disabled={!analysisData?.incoseFormat}
                                >
                                    Accept Format
                                </Button>
                            </div>
                            <p className="mt-2">
                                <strong>Feedback:</strong>
                            </p>
                            <ReactMarkdown>
                                {analysisData?.incoseFeedback}
                            </ReactMarkdown>
                        </div>
                    </FoldingCard>

                    {/* Compliance */}
                    <FoldingCard
                        icon={<Scale />}
                        title="Compliance"
                        disabled={!analysisData}
                        defaultOpen={false}
                    >
                        <div className="text-muted-foreground text-sm">
                            <ReactMarkdown>
                                {analysisData?.complianceFeedback}
                            </ReactMarkdown>
                            {analysisData?.relevantRegulations && (
                                <div className="mt-2">
                                    <p>
                                        <strong>Relevant Regulations:</strong>
                                    </p>
                                    <ReactMarkdown>
                                        {analysisData.relevantRegulations}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </FoldingCard>

                    {/* Enhanced */}
                    <FoldingCard
                        icon={<Wand />}
                        title="Enhanced"
                        disabled={!analysisData}
                        defaultOpen={false}
                    >
                        <div className="text-muted-foreground text-sm">
                            <div className="flex justify-between items-start mt-2">
                                <div>
                                    <p>
                                        <strong>Enhanced EARS:</strong>
                                    </p>
                                    <ReactMarkdown>
                                        {analysisData?.enhancedReqEars}
                                    </ReactMarkdown>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleAcceptChange(
                                            analysisData?.enhancedReqEars,
                                        )
                                    }
                                    disabled={!analysisData?.enhancedReqEars}
                                >
                                    Accept EARS
                                </Button>
                            </div>

                            <div className="flex justify-between items-start mt-2">
                                <div>
                                    <p>
                                        <strong>Enhanced INCOSE:</strong>
                                    </p>
                                    <ReactMarkdown>
                                        {analysisData?.enhancedReqIncose}
                                    </ReactMarkdown>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleAcceptChange(
                                            analysisData?.enhancedReqIncose,
                                        )
                                    }
                                    disabled={!analysisData?.enhancedReqIncose}
                                >
                                    Accept INCOSE
                                </Button>
                            </div>

                            <p className="mt-2">
                                <strong>General Feedback:</strong>
                            </p>
                            <ReactMarkdown>
                                {analysisData?.enhancedGeneralFeedback}
                            </ReactMarkdown>
                        </div>
                    </FoldingCard>
                </div>
            </div>
        </div>
    );
}
