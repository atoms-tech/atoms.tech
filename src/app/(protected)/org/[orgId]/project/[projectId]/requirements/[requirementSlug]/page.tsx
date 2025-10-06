'use client';

import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/use-toast';
import LayoutView from '@/components/views/LayoutView';
import { useUpdateRequirement } from '@/hooks/mutations/useRequirementMutations';
import { useProfile } from '@/hooks/queries/useProfile';
import { useRequirement } from '@/hooks/queries/useRequirement';
import { useGumloop } from '@/hooks/useGumloop';
import { useUser } from '@/lib/providers/user.provider';
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
    const pathname = usePathname();
    const organizationId = pathname ? pathname.split('/')[2] : '';
    const params = useParams<{ requirementSlug: string }>();
    const requirementSlug = params?.requirementSlug || '';
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

    const { user } = useUser();
    const { data: profile } = useProfile(user!.id);
    const { toast } = useToast();

    const updateRequirementWithHistory = async (newDescription: string) => {
        if (!requirement || !profile) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Unable to save: Requirement or profile data not loaded',
            });
            return;
        }

        if (!requirement.id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Unable to save: Invalid requirement ID',
            });
            return;
        }

        setIsSaving(true);
        try {
            const reqUpdate = {
                id: requirement.id,
                description: newDescription,
                ai_analysis: requirement.ai_analysis,
            };

            let analysis_history = requirement.ai_analysis as RequirementAiAnalysis;
            console.log('Current analysis history:', analysis_history);

            if (!analysis_history) {
                analysis_history = {
                    descriptionHistory: [],
                };
            }

            // Ensure descriptionHistory array exists
            if (!analysis_history.descriptionHistory) {
                analysis_history.descriptionHistory = [];
            }

            // Always add to history when saving (not just when requirement.description exists)
            analysis_history.descriptionHistory.push({
                description: newDescription,
                createdAt: new Date().toISOString(),
                createdBy: profile.full_name || 'Unknown User',
            });

            reqUpdate.ai_analysis = analysis_history;

            await updateRequirement(reqUpdate);

            console.log('Successfully updated requirement:', reqUpdate);
            toast({
                variant: 'default',
                title: 'Success',
                description: 'Requirement saved successfully',
            });
        } catch (error) {
            console.error('Failed to update requirement:', error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred while saving';

            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        updateRequirementWithHistory(reqText);
    };

    const [missingReqError, setMissingReqError] = useState<string>('');

    const [selectedFiles, setSelectedFiles] = useState<{
        [key: string]: RegulationFile;
    }>({});

    const { startPipeline, getPipelineRun } = useGumloop();

    const [isReasoning, setIsReasoning] = useState(false);
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysisPipelineRunId, setAnalysisPipelineRunId] = useState<string>('');
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
        console.log('Starting analysis pipeline...');
        setMissingReqError('');
        setIsAnalysing(true);

        try {
            const { run_id } = await startPipeline({
                pipelineType: isReasoning
                    ? 'requirement-analysis-reasoning'
                    : 'requirement-analysis',
                requirement: reqText,
                systemName: systemName,
                objective: objective,
                fileNames: Object.values(selectedFiles).map((file) => file.gumloopName),
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
                            mergedData[key] = mergedData[key].replace('\\\\n', '\\n');
                            mergedData[key] = mergedData[key].replace('\\n', '\n');
                            mergedData[key] = mergedData[key].replace('\n', '  \n');
                        }
                    }

                    setAnalysisData({
                        reqId: requirement?.name || 'No Requirement ID',
                        originalRequirement: mergedData['Original Requirement'],
                        earsRequirement: mergedData['EARS Generated Requirement'],
                        earsPattern: mergedData['EARS Pattern'],
                        earsTemplate: mergedData['EARS_SYNTAX_TEMPLATE'],
                        incoseFormat: mergedData['INCOSE_FORMAT'],
                        incoseFeedback: mergedData['INCOSE_REQUIREMENT_FEEDBACK'],
                        complianceFeedback: mergedData['COMPLIANCE_FEEDBACK'],
                        enhancedReqEars: mergedData['ENHANCED_REQUIREMENT_EARS'],
                        enhancedReqIncose: mergedData['ENHANCED_REQUIREMENT_INCOSE'],
                        enhancedGeneralFeedback: mergedData['ENHANCED_GENERAL_FEEDBACK'],
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
    }, [analysisResponse, requirement?.name]);

    // Create a ref for the textarea to focus it when needed
    // const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleAcceptChange = async (text: string | undefined, autosave: boolean) => {
        if (!text || !requirement) {
            return;
        }
        if (autosave) {
            await updateRequirementWithHistory(text);
            setReqText(text);
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
        <LayoutView>
            <div className="container sm:p-6">
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
                            isPersistent={true}
                            handleSave={handleSave}
                            isSaving={isSaving}
                            missingReqError={missingReqError}
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
        </LayoutView>
    );
}
