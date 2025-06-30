'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
    ComplianceCard,
    EarsCard,
    EnhancedCard,
    IncoseCard,
    OriginalRequirementCard,
    RegulationFile,
    RequirementForm,
} from '@/app/(protected)/org/[orgId]/project/[projectId]/requirements/[requirementSlug]/components';
import { useGumloop } from '@/hooks/useGumloop';

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
    const [reqText, setReqText] = useState<string>('');
    const [systemName, setSystemName] = useState<string>('');
    const [objective, setObjective] = useState<string>('');

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

    const handleAnalyze = async () => {
        setAnalysisData(null);
        console.log('Starting analysis pipeline...');
        setIsAnalysing(true);

        try {
            const { run_id } = await startPipeline({
                pipelineType: isReasoning
                    ? 'requirement-analysis-reasoning'
                    : 'requirement-analysis',
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
        if (!text) {
            return;
        }
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="container sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Requirement</h2>
                    <RequirementForm
                        organizationId={organizationId}
                        requirement={{ id: '' }}
                        origReqText=""
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
                        isPersistent={false}
                        handleSave={() => {}}
                        isSaving={false}
                        missingReqError={''}
                        missingFilesError={''}
                        setMissingFilesError={() => {}}
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
