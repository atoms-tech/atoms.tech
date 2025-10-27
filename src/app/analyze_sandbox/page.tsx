'use client';

import { useEffect, useState } from 'react';

import LayoutView from '@/components/views/LayoutView';
import { SandboxRequirementForm } from './SandboxRequirementForm';
import {
    ComplianceCard,
    EarsCard,
    EnhancedCard,
    IncoseCard,
    OriginalRequirementCard,
} from '@/app/(protected)/org/[orgId]/project/[projectId]/requirements/[requirementSlug]/components';
import { handleAnalyzeAPI } from './handleAnalyzeAPI.sandbox';

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

export default function AnalyzeSandboxPage() {
    // Mirror the protected page state shape
    const [reqText, setReqText] = useState<string>('The system shall authenticate users in under 500ms using email and password.');
    const [isReasoning, setIsReasoning] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: { file?: File } }>({});
    const [isAnalysing, setIsAnalysing] = useState(false);
    useEffect(() => {
        // keep local analysisData in sync with hook result
        // we avoid double state by using onResult below
    }, []);

    return (
        <LayoutView>
            <div className="container sm:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4">Requirement</h2>
                        <SandboxRequirementForm
                            reqText={reqText}
                            setReqText={setReqText}
                            isReasoning={isReasoning}
                            setIsReasoning={setIsReasoning}
                            isAnalysing={isAnalysing}
                            onAnalyze={async () => {
                                await handleAnalyzeAPI({
                                    reqText,
                                    selectedFiles,
                                    setAnalysisData,
                                    setIsAnalysing,
                                    apiUrl: '/analyze_sandbox/api/ai',
                                });
                            }}
                            onFilesChanged={setSelectedFiles}
                        />
                    </div>

                    {/* Right Column - AI Analysis cards; identical to protected page */}
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
                            onAccept={() => {}}
                        />
                        <IncoseCard
                            incoseFormat={analysisData?.incoseFormat}
                            incoseFeedback={analysisData?.incoseFeedback}
                            onAccept={() => {}}
                        />
                        <ComplianceCard
                            complianceFeedback={analysisData?.complianceFeedback}
                            relevantRegulations={analysisData?.relevantRegulations}
                        />
                        <EnhancedCard
                            enhancedReqEars={analysisData?.enhancedReqEars}
                            enhancedReqIncose={analysisData?.enhancedReqIncose}
                            onAccept={() => {}}
                        />
                    </div>
                </div>
            </div>
        </LayoutView>
    );
}
