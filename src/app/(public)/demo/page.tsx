'use client';

import { useEffect, useState } from 'react';

import {
    ComplianceCard,
    DemoFile,
    EarsCard,
    EnhancedCard,
    IncoseCard,
    OriginalRequirementCard,
    RequirementForm,
} from '@/app/(public)/demo/components';
import { useDemoAnalysis } from '@/hooks/useDemoAnalysis';

interface AnalysisData {
    earsReq: string;
    incoseReq: string;
    incoseFeedback: string;
    relevantRegulations: string;
    generalFeedback: string;
}

interface AnalysisJSON {
    earsReq: string;
    incoseReq: string;
    incoseFeedback: string;
    relevantRegulations: string;
    generalFeedback: string;
}

export default function DemoPage() {
    const [reqText, setReqText] = useState<string>('');
    const [systemName, setSystemName] = useState<string>('');
    const [objective, setObjective] = useState<string>('');
    const [missingReqError, setMissingReqError] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<{
        [key: string]: DemoFile;
    }>({});

    const { startAnalysis, usePipelineStatus } = useDemoAnalysis();

    const [isReasoning, setIsReasoning] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisPipelineRunId, setAnalysisPipelineRunId] =
        useState<string>('');
    const { data: analysisResponse } = usePipelineStatus(analysisPipelineRunId);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

    const handleAnalyze = async () => {
        // check if the requirement is empty
        if (!reqText) {
            setMissingReqError('Requirement text is required');
            return;
        }

        console.log('Starting analysis pipeline...');
        setMissingReqError('');
        setIsAnalysing(true);

        try {
            const { run_id } = await startAnalysis({
                requirement: reqText,
                systemName: systemName,
                objective: objective,
                files: Object.values(selectedFiles).map(
                    (demoFile) => demoFile.file,
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

                try {
                    // If analysisJSON is an array, take the first element
                    if (Array.isArray(analysisJSON)) {
                        analysisJSON = analysisJSON[0];
                    }

                    // if the content is a string and contains ```json```, clean it
                    let parsedJSON: AnalysisJSON;
                    if (typeof analysisJSON === 'string') {
                        analysisJSON = analysisJSON
                            .replace(/```json\n?/g, '')
                            .replace(/```/g, '');
                        parsedJSON = JSON.parse(analysisJSON);
                    } else {
                        parsedJSON = analysisJSON as AnalysisJSON;
                    }

                    setAnalysisData({
                        earsReq: parsedJSON.earsReq,
                        incoseReq: parsedJSON.incoseReq,
                        incoseFeedback: parsedJSON.incoseFeedback,
                        relevantRegulations: parsedJSON.relevantRegulations,
                        generalFeedback: parsedJSON.generalFeedback,
                    });
                } catch (error) {
                    console.error(
                        'Failed to parse analysis JSON:',
                        error,
                        analysisJSON,
                    );
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

    const handleAcceptChange = (text: string | undefined) => {
        if (!text) return;
        setReqText(text);
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black mb-2">
                        AI Requirement Analysis
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Transform your requirements into precise, actionable
                        specifications
                    </p>
                </div>

                <div
                    className={`grid grid-cols-1 xl:grid-cols-12 gap-8 ${!analysisData ? 'justify-items-center' : ''}`}
                >
                    {/* Input Section - Takes 5 columns, centered when no analysis */}
                    <div
                        className={`${analysisData ? 'xl:col-span-5' : 'xl:col-span-6 xl:col-start-4'} w-full`}
                    >
                        <div className="bg-gray-50 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-[calc(100vh-12rem)] flex flex-col">
                            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2 flex-none">
                                Input Requirement
                            </h2>
                            <div className="overflow-y-auto flex-1 pr-2">
                                <RequirementForm
                                    _organizationId="demo"
                                    _requirement={{ id: 'demo' }}
                                    reqText={reqText}
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
                                    selectedFiles={selectedFiles}
                                    setSelectedFiles={setSelectedFiles}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Analysis Section - Takes 7 columns, only shown after analysis */}
                    {analysisData && (
                        <div className="xl:col-span-7">
                            <div className="bg-gray-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-[calc(100vh-12rem)] flex flex-col transition-all duration-500 ease-in-out transform translate-x-0 opacity-100">
                                <div className="p-6 border-b-2 border-black flex-none">
                                    <h2 className="text-2xl font-bold">
                                        Analysis Results
                                    </h2>
                                </div>

                                {/* Analysis Cards Grid - Scrollable Area */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Original Requirement */}
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <OriginalRequirementCard
                                                reqId=""
                                                originalRequirement={reqText}
                                            />
                                        </div>

                                        {/* EARS Analysis */}
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <EarsCard
                                                earsPattern=""
                                                earsRequirement={
                                                    analysisData?.earsReq
                                                }
                                                earsTemplate=""
                                                onAccept={handleAcceptChange}
                                            />
                                        </div>

                                        {/* INCOSE Analysis */}
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <IncoseCard
                                                incoseFormat={
                                                    analysisData?.incoseReq
                                                }
                                                incoseFeedback={
                                                    analysisData?.incoseFeedback
                                                }
                                                onAccept={handleAcceptChange}
                                            />
                                        </div>

                                        {/* Compliance Analysis */}
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <ComplianceCard
                                                complianceFeedback={
                                                    analysisData?.generalFeedback
                                                }
                                                relevantRegulations={
                                                    analysisData?.relevantRegulations
                                                }
                                            />
                                        </div>

                                        {/* Enhanced Analysis */}
                                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <EnhancedCard
                                                enhancedReqEars=""
                                                enhancedReqIncose=""
                                                enhancedGeneralFeedback=""
                                                onAccept={handleAcceptChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
