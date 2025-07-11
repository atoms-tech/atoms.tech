import { ChevronRight, Save } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import {
    RequirementSection,
    SaveViewDialog,
    TestCaseSection,
    TestMatrixGrid,
    TestMatrixViews,
} from '@/components/custom/RequirementsTesting/TestMatrix/components';
import {
    TestMatrixProvider,
    useTestMatrix,
} from '@/components/custom/RequirementsTesting/TestMatrix/context/TestMatrixContext';
import {
    useProjectRequirementTests,
    useProjectTestCases,
} from '@/components/custom/RequirementsTesting/hooks/useTestReq';
import { useTestMatrixViews } from '@/components/custom/RequirementsTesting/hooks/useTestViews';
import {
    TestMatrixViewState,
    mapAPIRequirement,
    mapAPIRequirementTest,
    mapAPITestCase,
} from '@/components/custom/RequirementsTesting/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useProjectRequirements } from '@/hooks/queries/useRequirement';
import { cn } from '@/lib/utils';

interface TestMatrixProps {
    projectId: string;
}

function TestMatrixContent() {
    const { toast } = useToast();
    const {
        projectId,
        mode,
        currentView,
        selectedRequirementIds,
        selectedTestCaseIds,
        searchTerm,
        setMode,
        setCurrentView,
        setSelectedRequirementIds,
        setSelectedTestCaseIds,
        isRequirementSectionExpanded,
        isTestCasesSectionExpanded,
        setIsRequirementSectionExpanded,
        setIsTestCasesSectionExpanded,
    } = useTestMatrix();

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);

    const { createView, updateView } = useTestMatrixViews(projectId);
    const { data: apiRequirements = [] } = useProjectRequirements(projectId);
    const { data: testCasesData } = useProjectTestCases(projectId);
    const { data: apiRequirementTests = [] } =
        useProjectRequirementTests(projectId);

    const allRequirements = useMemo(
        () => apiRequirements.map(mapAPIRequirement),
        [apiRequirements],
    );

    const allTestCases = useMemo(
        () => (testCasesData?.data || []).map(mapAPITestCase),
        [testCasesData],
    );

    const requirementTests = useMemo(
        () => apiRequirementTests.map(mapAPIRequirementTest),
        [apiRequirementTests],
    );

    const linkedTestCasesMap = useMemo(() => {
        const newMap: Record<string, string[]> = {};
        requirementTests.forEach((rt) => {
            if (!newMap[rt.requirement_id]) {
                newMap[rt.requirement_id] = [];
            }
            newMap[rt.requirement_id].push(rt.test_id);
        });
        return newMap;
    }, [requirementTests]);

    const displayRequirements = useMemo(
        () =>
            allRequirements.filter((req) =>
                selectedRequirementIds.includes(req.id),
            ),
        [allRequirements, selectedRequirementIds],
    );

    const displayTestCases = useMemo(
        () =>
            selectedTestCaseIds.length > 0
                ? allTestCases.filter((test) =>
                      selectedTestCaseIds.includes(test.id),
                  )
                : [],
        [allTestCases, selectedTestCaseIds],
    );

    const handleViewSelect = (view: TestMatrixViewState) => {
        try {
            setCurrentView(view);
            setSelectedRequirementIds(
                view.configuration.selectedRequirementIds || [],
            );

            let testCaseIds = view.configuration.selectedTestCaseIds || [];
            if (
                testCaseIds.length === 0 &&
                view.configuration.selectedRequirementIds.length > 0
            ) {
                const linkedTests =
                    view.configuration.selectedRequirementIds.flatMap(
                        (reqId) => linkedTestCasesMap[reqId] || [],
                    );
                testCaseIds = Array.from(new Set(linkedTests));
            }

            setSelectedTestCaseIds(testCaseIds);

            if (
                view.configuration.uiState?.isRequirementSectionExpanded !==
                undefined
            ) {
                setIsRequirementSectionExpanded(
                    view.configuration.uiState.isRequirementSectionExpanded,
                );
            }

            setMode('edit-view');
        } catch (error) {
            console.error('Error selecting view:', error);
            toast({
                title: 'Error loading view',
                description: 'There was a problem loading the selected view.',
                variant: 'destructive',
            });
        }
    };

    const handleCreateNewView = () => {
        setCurrentView(null);
        setSelectedRequirementIds([]);
        setSelectedTestCaseIds([]);
        setIsRequirementSectionExpanded(true);
        setMode('new-view');
    };

    const handleSaveView = async (
        viewData: Omit<TestMatrixViewState, 'id'> | TestMatrixViewState,
    ) => {
        try {
            const configuration = {
                selectedRequirementIds,
                selectedTestCaseIds,
                filters: {
                    search: searchTerm,
                },
                uiState: {
                    compactView: false,
                    highlightPassing: true,
                    showEmpty: true,
                    isRequirementSectionExpanded,
                    isTestCasesSectionExpanded,
                },
            };

            const updatedViewData = {
                ...viewData,
                configuration,
                projectId,
            };

            if ('id' in updatedViewData) {
                await updateView.mutateAsync(
                    updatedViewData as TestMatrixViewState,
                );
            } else {
                await createView.mutateAsync(
                    updatedViewData as Omit<TestMatrixViewState, 'id'>,
                );
            }

            setSaveDialogOpen(false);
        } catch (err) {
            console.error('Error saving view:', err);
        }
    };

    // Add click outside handler
    const handleMainContentClick = (e: React.MouseEvent) => {
        // Only close panels if clicking directly on the main content area
        if ((e.target as HTMLElement).closest('.side-panel')) return;
        setIsRequirementSectionExpanded(false);
        setIsTestCasesSectionExpanded(false);
    };

    const renderContent = () => {
        switch (mode) {
            case 'view-list':
                return (
                    <TestMatrixViews
                        projectId={projectId}
                        onViewSelect={handleViewSelect}
                        onCreateNewView={handleCreateNewView}
                    />
                );

            case 'new-view':
            case 'edit-view':
                return (
                    <div className="h-full bg-background flex">
                        {/* Side Panels */}
                        <div
                            className={cn(
                                'fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-50 side-panel',
                                isRequirementSectionExpanded
                                    ? 'w-[350px] translate-x-0'
                                    : 'w-0 -translate-x-full',
                            )}
                        >
                            <RequirementSection
                                requirements={allRequirements}
                                linkedTestCasesMap={linkedTestCasesMap}
                            />
                        </div>

                        <div
                            className={cn(
                                'fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-50 side-panel',
                                isTestCasesSectionExpanded
                                    ? 'w-[350px] translate-x-0'
                                    : 'w-0 -translate-x-full',
                            )}
                        >
                            <TestCaseSection
                                testCases={allTestCases}
                                linkedTestCasesMap={linkedTestCasesMap}
                            />
                        </div>

                        {/* Main Content */}
                        <div
                            className="flex-1 flex flex-col min-h-0"
                            onClick={handleMainContentClick}
                        >
                            <div className="p-4 flex justify-between items-center border-b">
                                <h2 className="text-lg font-medium">
                                    {mode === 'edit-view'
                                        ? currentView?.name ||
                                          'Test Matrix View - Dummy'
                                        : 'New Test Matrix View'}
                                </h2>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            if (currentView) {
                                                await updateView.mutateAsync({
                                                    ...currentView,
                                                    configuration: {
                                                        selectedRequirementIds,
                                                        selectedTestCaseIds,
                                                        filters: {
                                                            search: searchTerm,
                                                        },
                                                        uiState: {
                                                            compactView: false,
                                                            highlightPassing:
                                                                true,
                                                            showEmpty: true,
                                                            isRequirementSectionExpanded,
                                                            isTestCasesSectionExpanded,
                                                        },
                                                    },
                                                });
                                            }
                                            setMode('view-list');
                                        }}
                                    >
                                        Back to Views
                                    </Button>
                                    {mode === 'new-view' && (
                                        <Button
                                            onClick={() =>
                                                setSaveDialogOpen(true)
                                            }
                                            variant="default"
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Save View
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {selectedRequirementIds.length > 0 ? (
                                    displayTestCases.length > 0 ? (
                                        <TestMatrixGrid
                                            requirements={displayRequirements}
                                            testCases={displayTestCases}
                                            requirementTests={requirementTests}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/5 rounded-lg border">
                                            <p className="text-muted-foreground">
                                                No test cases selected for this
                                                view
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Select test cases from the test
                                                cases section, or select
                                                requirements with linked test
                                                cases
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/5 rounded-lg border">
                                        <p className="text-muted-foreground mb-2">
                                            Select requirements to display in
                                            the matrix
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Use the requirements section to
                                            choose which requirements to include
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Button Bar */}
                            <div className="border-t p-2 flex justify-end space-x-2 bg-background">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        'flex items-center gap-2 rounded-full px-4',
                                        isRequirementSectionExpanded &&
                                            'bg-primary/10 text-primary',
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRequirementSectionExpanded(
                                            !isRequirementSectionExpanded,
                                        );
                                        if (!isRequirementSectionExpanded) {
                                            setIsTestCasesSectionExpanded(
                                                false,
                                            );
                                        }
                                    }}
                                >
                                    <ChevronRight
                                        className={cn(
                                            'h-4 w-4 transition-transform',
                                            isRequirementSectionExpanded &&
                                                'rotate-180',
                                        )}
                                    />
                                    Add Requirements
                                    {selectedRequirementIds.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 min-w-[1.5rem] text-center">
                                            {selectedRequirementIds.length}
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        'flex items-center gap-2 rounded-full px-4',
                                        isTestCasesSectionExpanded &&
                                            'bg-primary/10 text-primary',
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsTestCasesSectionExpanded(
                                            !isTestCasesSectionExpanded,
                                        );
                                        if (!isTestCasesSectionExpanded) {
                                            setIsRequirementSectionExpanded(
                                                false,
                                            );
                                        }
                                    }}
                                >
                                    <ChevronRight
                                        className={cn(
                                            'h-4 w-4 transition-transform',
                                            isTestCasesSectionExpanded &&
                                                'rotate-180',
                                        )}
                                    />
                                    Add Test Cases
                                    {selectedTestCaseIds.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 min-w-[1.5rem] text-center">
                                            {selectedTestCaseIds.length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-full bg-background flex flex-col">
            {renderContent()}

            <SaveViewDialog
                isOpen={saveDialogOpen}
                onClose={() => setSaveDialogOpen(false)}
                onSave={handleSaveView}
                currentView={currentView || undefined}
                projectId={projectId}
                configuration={
                    currentView?.configuration || {
                        selectedRequirementIds,
                        selectedTestCaseIds,
                        filters: { search: searchTerm },
                    }
                }
            />
        </div>
    );
}

export default function TestMatrix({ projectId }: TestMatrixProps) {
    return (
        <TestMatrixProvider projectId={projectId}>
            <TestMatrixContent />
        </TestMatrixProvider>
    );
}
