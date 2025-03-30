'use client';

import { useParams, usePathname } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

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

import {
    ComplianceCard,
    EarsCard,
    EnhancedCard,
    IncoseCard,
    OriginalRequirementCard,
    RequirementForm,
} from './components';

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
    const [systemName, setSystemName] = useState<string>('');
    const [objective, setObjective] = useState<string>('');

    // Set requirement description when loaded
    useEffect(() => {
        if (requirement) {
            setReqText(requirement?.description || '');
        }
    }, [requirement]);

    const [missingReqError, setMissingReqError] = useState<string>('');
    const [missingFilesError, setMissingFilesError] = useState<string>('');

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
                systemName: systemName,
                objective: objective,
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
                    <RequirementForm
                        requirement={requirement || { id: '' }}
                        reqText={reqText || ''}
                        setReqText={setReqText}
                        systemName={systemName}
                        setSystemName={setSystemName}
                        objective={objective}
                        setObjective={setObjective}
                        isReasoning={isReasoning}
                        setIsReasoning={setIsReasoning}
                        isAnalysing={isAnalysing}
                        handleAnalyze={handleAnalyze}
                        missingReqError={missingReqError}
                        missingFilesError={missingFilesError}
                        isUploading={isUploading}
                        uploadButtonText={uploadButtonText}
                        handleFileUpload={handleFileUpload}
                        existingDocs={existingDocs}
                        existingDocsValue={existingDocsValue}
                        handleExistingDocSelect={handleExistingDocSelect}
                        selectedFiles={selectedFiles}
                    />
                </div>

                {/* Right Column - Analysis Blocks */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>

                    <OriginalRequirementCard
                        reqId={analysisData?.reqId}
                        originalRequirement={analysisData?.originalRequirement}
                    />

                    <EarsCard
                        earsPattern={analysisData?.earsPattern}
                        earsRequirement={analysisData?.earsRequirement}
                        earsTemplate={analysisData?.earsTemplate}
                        onAccept={handleAcceptChange}
                    />

                    <IncoseCard
                        incoseFormat={analysisData?.incoseFormat}
                        incoseFeedback={analysisData?.incoseFeedback}
                        onAccept={handleAcceptChange}
                    />

                    <ComplianceCard
                        complianceFeedback={analysisData?.complianceFeedback}
                        relevantRegulations={analysisData?.relevantRegulations}
                    />

                    <EnhancedCard
                        enhancedReqEars={analysisData?.enhancedReqEars}
                        enhancedReqIncose={analysisData?.enhancedReqIncose}
                        enhancedGeneralFeedback={
                            analysisData?.enhancedGeneralFeedback
                        }
                        onAccept={handleAcceptChange}
                    />
                </div>
            </div>
        </div>
    );
}
