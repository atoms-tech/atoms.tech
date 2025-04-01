'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useUpdateRequirement } from '@/hooks/mutations/useRequirementMutations';
import { useRequirement } from '@/hooks/queries/useRequirement';
import { useGumloop } from '@/hooks/useGumloop';

import {
    ComplianceCard,
    EarsCard,
    EnhancedCard,
    IncoseCard,
    OriginalRequirementCard,
    RegulationFile,
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
    const [reqText, setReqText] = useState<string>('');
    const [systemName, setSystemName] = useState<string>('');
    const [objective, setObjective] = useState<string>('');

    // Set requirement description when loaded
    useEffect(() => {
        if (requirement) {
            setReqText(requirement?.description || '');
        }
    }, [requirement]);

    const [missingReqError, setMissingReqError] = useState<string>('');
    // const [missingFilesError, setMissingFilesError] = useState<string>('');

    const [selectedFiles, setSelectedFiles] = useState<{
        [key: string]: RegulationFile;
    }>({});

    const { startPipeline, getPipelineRun } = useGumloop();

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
        // if (Object.keys(selectedFiles).length === 0) {
        //     setMissingFilesError('At least one file is required');
        //     return;
        // }
        console.log('Starting analysis pipeline...');
        setMissingReqError('');
        // setMissingFilesError('');
        setIsAnalysing(true);

        try {
            const { run_id } = await startPipeline({
                pipelineType: isReasoning
                    ? 'reasoning-requirement-analysis'
                    : 'requirement-analysis',
                requirement: reqText,
                systemName: systemName,
                objective: objective,
                fileNames: Object.values(selectedFiles).map(
                    (file) => file.gumloopName,
                ),
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
                        organizationId={organizationId}
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
                        // missingFilesError={missingFilesError}
                        // setMissingFilesError={setMissingFilesError}
                        // isUploading={isUploading}
                        // uploadButtonText={uploadButtonText}
                        // handleFileUpload={handleFileUpload}
                        // existingDocs={existingDocs}
                        // existingDocsValue={existingDocsValue}
                        // handleExistingDocSelect={handleExistingDocSelect}
                        selectedFiles={selectedFiles}
                        setSelectedFiles={setSelectedFiles}
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
