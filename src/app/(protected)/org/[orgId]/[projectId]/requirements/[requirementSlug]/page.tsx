'use client';

import {
    Brain,
    Check,
    CircleAlert,
    FileSpreadsheet,
    Scale,
    Target,
    Upload,
    Wand,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FoldingCard } from '@/components/ui/folding-card';
import { useRequirement } from '@/hooks/queries/useRequirement';
import { useGumloop } from '@/hooks/useGumloop';

interface AnalysisData {
    earsReq: string;
    incoseReq: string;
    incoseFeedback: string;
    generalFeedback: string;
    relevantRegulations: string;
}

export default function RequirementPage() {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReqText(e.target.value);
        if (missingReqError) {
            setMissingReqError('');
        }
    };

    const [currentFile, setCurrentFile] = useState<string>('');
    // uploaded files maps processed file name to original file name
    const [uploadedFiles, setUploadedFiles] = useState<{
        [key: string]: string;
    }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { startPipeline, getPipelineRun, uploadFiles } = useGumloop();
    const [convertPipelineRunId, setConvertPipelineRunId] =
        useState<string>('');
    const { data: convertResponse } = getPipelineRun(convertPipelineRunId);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        try {
            const files = Array.from(e.target.files);
            setCurrentFile(files[0].name);
            setIsUploading(true);

            if (missingFilesError) {
                setMissingFilesError('');
            }

            const uploadedFileNames = await uploadFiles(files);
            console.log('Files uploaded successfully:', uploadedFileNames);

            // Start pipeline for file processing
            const { run_id } = await startPipeline({
                fileNames: uploadedFileNames,
                pipelineType: 'file-processing',
            });
            setConvertPipelineRunId(run_id);
        } catch (error) {
            setIsUploading(false);
            console.error('Failed to upload files:', error);
        }
    };

    // set the uploadedFiles when the pipeline run is completed
    useEffect(() => {
        switch (convertResponse?.state) {
            case 'DONE': {
                // check that the response has the expected outputs
                const convertedFileNames =
                    convertResponse.outputs?.convertedFileNames;

                console.log('Converted file names:', convertedFileNames);

                // append the converted file name to the uploaded files
                if (!convertedFileNames) {
                    console.error('No converted file names found in response');
                    break;
                }

                // assert that it is an array
                if (!Array.isArray(convertedFileNames)) {
                    console.error('Converted file names is not an array');
                    break;
                }

                for (const fileName of convertedFileNames) {
                    setUploadedFiles((prevFiles) => ({
                        ...prevFiles,
                        [fileName]: currentFile,
                    }));
                }

                break;
            }
            case 'FAILED': {
                console.error('File processing pipeline failed');
                break;
            }
            default:
                return;
        }
        setIsUploading(false);
        setConvertPipelineRunId('');
        setCurrentFile('');
    }, [convertResponse, currentFile]);

    const [uploadButtonText, setUploadButtonText] = useState('Upload Files');

    useEffect(() => {
        if (isUploading) {
            if (convertPipelineRunId) {
                setUploadButtonText('Converting...');
            } else setUploadButtonText('Uploading...');
        } else {
            setUploadButtonText('Upload Files');
        }
    }, [isUploading, convertPipelineRunId]);

    const [isReasoning, setIsReasoning] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisPipelineRunId, setAnalysisPipelineRunId] =
        useState<string>('');
    const { data: analysisResponse } = getPipelineRun(analysisPipelineRunId);
    const [analysisResultLink, setAnalysisResultLink] = useState<string>('');
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

    const handleAnalyze = async () => {
        setAnalysisResultLink('');
        setAnalysisData(null);

        // check if the requirement is empty
        if (!reqText) {
            setMissingReqError('Requirement text is required');
            return;
        }
        // or if no files are uploaded
        if (Object.keys(uploadedFiles).length === 0) {
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
                fileNames: Object.keys(uploadedFiles),
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
                const analysisResultLink =
                    analysisResponse.outputs?.googleSheetLink;

                if (!analysisResultLink) {
                    console.error('No analysis result link found in response');
                    break;
                }

                if (Array.isArray(analysisResultLink)) {
                    console.error(
                        'Multiple analysis result links found in response',
                    );
                    break;
                }

                setAnalysisResultLink(analysisResultLink);

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
                    const parsedData = JSON.parse(analysisJSON);
                    setAnalysisData(parsedData);
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
                            {analysisResultLink && (
                                <div className="flex items-center gap-2 text-green-500 bg-green-50 p-2 rounded">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <a
                                        href={analysisResultLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        View Analysis Results
                                    </a>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf"
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
                            {Object.keys(uploadedFiles).length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2">
                                        Attached Files
                                    </h4>
                                    <ul className="space-y-1">
                                        {Object.values(uploadedFiles).map(
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

                    {/* General Feedback */}
                    <Card className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">
                                    General Feedback
                                </h3>
                                {analysisData ? (
                                    <div className="text-muted-foreground text-sm">
                                        <ReactMarkdown>
                                            {analysisData.generalFeedback}
                                        </ReactMarkdown>
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

                    {/* EARS Analysis */}
                    <FoldingCard
                        icon={<Target />}
                        title="EARS Analysis"
                        disabled={!analysisData}
                    >
                        <div className="text-muted-foreground text-sm">
                            <ReactMarkdown>
                                {analysisData?.earsReq}
                            </ReactMarkdown>
                        </div>
                    </FoldingCard>

                    {/* INCOSE Analysis */}
                    <FoldingCard
                        icon={<Check />}
                        title="INCOSE Analysis"
                        disabled={!analysisData}
                    >
                        <div className="text-muted-foreground text-sm">
                            <ReactMarkdown>
                                {analysisData?.incoseReq}
                            </ReactMarkdown>
                        </div>
                        <div className="text-muted-foreground text-sm mt-2">
                            <ReactMarkdown>
                                {analysisData?.incoseFeedback}
                            </ReactMarkdown>
                        </div>
                    </FoldingCard>

                    {/* Regulations */}
                    <FoldingCard
                        icon={<Scale />}
                        title="Relevant Regulations"
                        disabled={!analysisData}
                    >
                        <div className="text-muted-foreground text-sm">
                            <ReactMarkdown>
                                {analysisData?.relevantRegulations}
                            </ReactMarkdown>
                        </div>
                    </FoldingCard>
                </div>
            </div>
        </div>
    );
}
