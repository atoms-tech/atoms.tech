'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useUpdateRequirement } from '@/hooks/mutations/useRequirementMutations';
import { useRequirement } from '@/hooks/queries/useRequirement';
import { useGumloop } from '@/hooks/useGumloop';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';

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
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Set requirement description when loaded
    useEffect(() => {
        if (requirement) {
            setReqText(requirement?.description || '');
        }
    }, [requirement]);

    const updateRequirementWithHistory = async (newDescription: string) => {
        if (!requirement) {
            return;
        }
        setIsSaving(true);
        try {
            const reqUpdate = {
                id: requirement.id,
                description: newDescription,
                ai_analysis: requirement.ai_analysis,
            };
            let analysis_history =
                requirement.ai_analysis as RequirementAiAnalysis;
            console.log(analysis_history);
            if (!analysis_history) {
                analysis_history = {
                    descriptionHistory: [],
                };
            }
            // check if descriptionHistory is not present
            if (!analysis_history.descriptionHistory) {
                analysis_history.descriptionHistory = [];
            }
            if (requirement.description) {
                analysis_history.descriptionHistory.push({
                    description: newDescription,
                    createdAt: new Date().toISOString(),
                });
            }
            reqUpdate.ai_analysis = analysis_history;
            await updateRequirement(reqUpdate);
            console.log('Updated requirement with new description:', reqUpdate);
        } catch (error) {
            console.error('Failed to update requirement:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        updateRequirementWithHistory(reqText);
    };

    const [missingReqError, setMissingReqError] = useState<string>('');
    const [missingFilesError, setMissingFilesError] = useState<string>('');

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
        await updateRequirementWithHistory(reqText);

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
                pipelineType: 'requirement-analysis',
                requirement: reqText,
                systemName: systemName,
                objective: objective,
                fileNames: Object.values(selectedFiles).map(
                    (file) => file.gumloopName,
                ),
                model_preference: isReasoning ? 'o1' : 'gemini-2.0-flash-001',
                temperature: isReasoning ? 1 : 0.1,
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

                try {
                    // Create a merged data object from all JSON outputs
                    const mergedData: Record<string, string> = {};

                    // Process analysisJson (main EARS data)
                    if (analysisResponse.outputs?.analysisJson) {
                        const json = analysisResponse.outputs.analysisJson;
                        if (Array.isArray(json) && json.length > 0) {
                            const parsed = JSON.parse(json[0]);
                            Object.assign(mergedData, parsed);
                        }
                    }

                    // Process analysisJson2 (regulations data)
                    if (analysisResponse.outputs?.analysisJson2) {
                        const json = analysisResponse.outputs.analysisJson2;
                        if (Array.isArray(json) && json.length > 0) {
                            const parsed = JSON.parse(json[0]);
                            Object.assign(mergedData, parsed);
                        }
                    }

                    // Process analysisJson3 (enhanced requirements data)
                    if (analysisResponse.outputs?.analysisJson3) {
                        const json = analysisResponse.outputs.analysisJson3;
                        if (Array.isArray(json) && json.length > 0) {
                            const parsed = JSON.parse(json[0]);
                            Object.assign(mergedData, parsed);
                        }
                    }

                    // some newlines might be encoded as \\n, we need to
                    // convert it back into \n
                    for (const key in mergedData) {
                        if (mergedData[key]) {
                            mergedData[key] = mergedData[key].replace(
                                '\\\\n',
                                '\\n',
                            );
                            mergedData[key] = mergedData[key].replace(
                                '\\n',
                                '\n',
                            );
                            mergedData[key] = mergedData[key].replace(
                                '\n',
                                '  \n',
                            );
                        }
                    }

                    setAnalysisData({
                        reqId: mergedData['REQ ID'],
                        originalRequirement: mergedData['Original Requirement'],
                        earsRequirement:
                            mergedData['EARS Generated Requirement'],
                        earsPattern: mergedData['EARS Pattern'],
                        earsTemplate: mergedData['EARS_SYNTAX_TEMPLATE'],
                        incoseFormat: mergedData['INCOSE_FORMAT'],
                        incoseFeedback:
                            mergedData['INCOSE_REQUIREMENT_FEEDBACK'],
                        complianceFeedback: mergedData['COMPLIANCE_FEEDBACK'],
                        enhancedReqEars:
                            mergedData['ENHANCED_REQUIREMENT_EARS'],
                        enhancedReqIncose:
                            mergedData['ENHANCED_REQUIREMENT_INCOSE'],
                        enhancedGeneralFeedback:
                            mergedData['ENHANCED_GENERAL_FEEDBACK'],
                        relevantRegulations: mergedData['RELEVANT_REGULATIONS'],
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
        navigator.clipboard.writeText(text);
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
                        origReqText={requirement?.description || ''}
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
                        handleSave={handleSave}
                        isSaving={isSaving}
                        missingReqError={missingReqError}
                        missingFilesError={missingFilesError}
                        setMissingFilesError={setMissingFilesError}
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
