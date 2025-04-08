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
    enhancedReqEars?: string;
    enhancedReqIncose?: string;
    enhancedGeneralFeedback?: string;
}

interface AnalysisJSON {
    // Original format (legacy support)
    earsReq?: string;
    incoseReq?: string;
    incoseFeedback?: string;
    relevantRegulations?: string;
    generalFeedback?: string;

    // New format from Gumloop
    'REQ ID'?: string;
    'Original Requirement'?: string;
    'EARS Generated Requirement'?: string;
    'EARS Pattern'?: string;
    EARS_SYNTAX_TEMPLATE?: string;
    INCOSE_FORMAT?: string;
    INCOSE_REQUIREMENT_FEEDBACK?: string;
    COMPLIANCE_FEEDBACK?: string;
    ENHANCED_REQUIREMENT_EARS?: string;
    ENHANCED_REQUIREMENT_INCOSE?: string;
    ENHANCED_GENERAL_FEEDBACK?: string;
    RELEVANT_REGULATIONS?: string;
}

export default function DemoPage() {
    const [reqText, setReqText] = useState<string>('');
    const [systemName, setSystemName] = useState<string>('');
    const [objective, setObjective] = useState<string>('');
    const [missingReqError, setMissingReqError] = useState<string>('');
    const [useRegulation, setUseRegulation] = useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<{
        [key: string]: DemoFile;
    }>({});
    const [isReasoning, setIsReasoning] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisPipelineRunId, setAnalysisPipelineRunId] =
        useState<string>('');
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

    const { startAnalysis, usePipelineStatus } = useDemoAnalysis();

    // State to track if the current analysis is regulated
    const [isRegulatedAnalysis, setIsRegulatedAnalysis] =
        useState<boolean>(false);

    // Effect to check localStorage for regulation flag when analysisPipelineRunId changes
    useEffect(() => {
        if (analysisPipelineRunId && typeof window !== 'undefined') {
            const isRegulated =
                localStorage.getItem(`regulation_${analysisPipelineRunId}`) ===
                'true';
            setIsRegulatedAnalysis(isRegulated);
        }
    }, [analysisPipelineRunId]);

    // Use the pipeline status with regulation flag if needed
    const { data: analysisResponse } = usePipelineStatus(
        analysisPipelineRunId,
        isRegulatedAnalysis,
    );

    const handleAnalyze = async () => {
        // check if the requirement is empty
        if (!reqText) {
            setMissingReqError('Requirement text is required');
            return;
        }

        console.log('Starting analysis pipeline...');
        console.log('Using regulation:', useRegulation);
        setMissingReqError('');
        setIsAnalysing(true);

        try {
            const response = await startAnalysis({
                requirement: reqText,
                systemName: systemName,
                objective: objective,
                files: Object.values(selectedFiles).map(
                    (demoFile) => demoFile.file,
                ),
                useRegulation: useRegulation,
            });
            setAnalysisPipelineRunId(response.run_id);

            // Store the regulation flag for later use in the GET request
            if (response.useRegulation && typeof window !== 'undefined') {
                localStorage.setItem(`regulation_${response.run_id}`, 'true');
                setIsRegulatedAnalysis(true);
            }
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

                    console.log('Parsed JSON:', parsedJSON);

                    // Check if we're using the new format or old format
                    if (
                        parsedJSON['EARS Generated Requirement'] ||
                        parsedJSON['INCOSE_FORMAT']
                    ) {
                        // New format
                        setAnalysisData({
                            earsReq:
                                parsedJSON['EARS Generated Requirement'] || '',
                            incoseReq: parsedJSON['INCOSE_FORMAT'] || '',
                            incoseFeedback:
                                parsedJSON['INCOSE_REQUIREMENT_FEEDBACK'] || '',
                            relevantRegulations:
                                parsedJSON['RELEVANT_REGULATIONS'] || '',
                            generalFeedback:
                                parsedJSON['COMPLIANCE_FEEDBACK'] || '',
                            enhancedReqEars:
                                parsedJSON['ENHANCED_REQUIREMENT_EARS'] || '',
                            enhancedReqIncose:
                                parsedJSON['ENHANCED_REQUIREMENT_INCOSE'] || '',
                            enhancedGeneralFeedback:
                                parsedJSON['ENHANCED_GENERAL_FEEDBACK'] || '',
                        });
                    } else {
                        // Legacy format
                        setAnalysisData({
                            earsReq: parsedJSON.earsReq || '',
                            incoseReq: parsedJSON.incoseReq || '',
                            incoseFeedback: parsedJSON.incoseFeedback || '',
                            relevantRegulations:
                                parsedJSON.relevantRegulations || '',
                            generalFeedback: parsedJSON.generalFeedback || '',
                        });
                    }
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
        <div className="min-h-screen bg-white dark:bg-black">
            <div className="container mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black mb-2 dark:text-white">
                        AI Requirement Analysis
                    </h1>
                    <p className="text-gray-600 dark:text-gray-200 text-lg">
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
                        <div className="bg-gray-50 dark:bg-black border-2 border-black dark:border-gray-600 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] h-[calc(100vh-12rem)] flex flex-col">
                            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black dark:border-gray-600 pb-2 flex-none dark:text-white">
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
                                    useRegulation={useRegulation}
                                    setUseRegulation={setUseRegulation}
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
                            <div className="bg-gray-50 dark:bg-black border-2 border-black dark:border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] h-[calc(100vh-12rem)] flex flex-col transition-all duration-500 ease-in-out transform translate-x-0 opacity-100">
                                <div className="p-6 border-b-2 border-black dark:border-gray-600 flex-none">
                                    <h2 className="text-2xl font-bold dark:text-white">
                                        Analysis Results
                                    </h2>
                                </div>

                                {/* Analysis Cards Grid - Scrollable Area */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Original Requirement */}
                                        <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]">
                                            <OriginalRequirementCard
                                                reqId=""
                                                originalRequirement={reqText}
                                            />
                                        </div>

                                        {/* EARS Analysis */}
                                        <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]">
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
                                        <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]">
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
                                        <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]">
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
                                        <div className="bg-white dark:bg-black border-2 border-black dark:border-gray-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(75,85,99,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,1)]">
                                            <EnhancedCard
                                                enhancedReqEars={
                                                    analysisData?.enhancedReqEars ||
                                                    ''
                                                }
                                                enhancedReqIncose={
                                                    analysisData?.enhancedReqIncose ||
                                                    ''
                                                }
                                                enhancedGeneralFeedback={
                                                    analysisData?.enhancedGeneralFeedback ||
                                                    ''
                                                }
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
