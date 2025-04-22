import React, { createContext, useCallback, useContext, useMemo } from 'react';

import {
    TestMatrixMode,
    TestMatrixViewConfiguration,
    TestMatrixViewState,
} from '@/components/custom/RequirementsTesting/types';

interface TestMatrixContextType {
    projectId: string;
    mode: TestMatrixMode;
    currentView: TestMatrixViewState | null;
    selectedRequirementIds: string[];
    selectedTestCaseIds: string[];
    searchTerm: string;
    testSearchTerm: string;
    isRequirementSectionExpanded: boolean;
    isTestCasesSectionExpanded: boolean;
    setMode: (mode: TestMatrixMode) => void;
    setCurrentView: (view: TestMatrixViewState | null) => void;
    setSelectedRequirementIds: (ids: string[]) => void;
    setSelectedTestCaseIds: (ids: string[]) => void;
    setSearchTerm: (term: string) => void;
    setTestSearchTerm: (term: string) => void;
    setIsRequirementSectionExpanded: (expanded: boolean) => void;
    setIsTestCasesSectionExpanded: (expanded: boolean) => void;
    updateConfiguration: (config: Partial<TestMatrixViewConfiguration>) => void;
}

const TestMatrixContext = createContext<TestMatrixContextType | undefined>(
    undefined,
);

interface TestMatrixProviderProps {
    children: React.ReactNode;
    projectId: string;
}

export function TestMatrixProvider({
    children,
    projectId,
}: TestMatrixProviderProps) {
    const [mode, setMode] = React.useState<TestMatrixMode>('view-list');
    const [currentView, setCurrentView] =
        React.useState<TestMatrixViewState | null>(null);
    const [selectedRequirementIds, setSelectedRequirementIds] = React.useState<
        string[]
    >([]);
    const [selectedTestCaseIds, setSelectedTestCaseIds] = React.useState<
        string[]
    >([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [testSearchTerm, setTestSearchTerm] = React.useState('');
    const [isRequirementSectionExpanded, setIsRequirementSectionExpanded] =
        React.useState(false);
    const [isTestCasesSectionExpanded, setIsTestCasesSectionExpanded] =
        React.useState(false);

    const updateConfiguration = useCallback(
        (config: Partial<TestMatrixViewConfiguration>) => {
            if (!currentView) return;

            setCurrentView({
                ...currentView,
                configuration: {
                    ...currentView.configuration,
                    ...config,
                },
            });
        },
        [currentView],
    );

    const value = useMemo(
        () => ({
            projectId,
            mode,
            currentView,
            selectedRequirementIds,
            selectedTestCaseIds,
            searchTerm,
            testSearchTerm,
            isRequirementSectionExpanded,
            isTestCasesSectionExpanded,
            setMode,
            setCurrentView,
            setSelectedRequirementIds,
            setSelectedTestCaseIds,
            setSearchTerm,
            setTestSearchTerm,
            setIsRequirementSectionExpanded,
            setIsTestCasesSectionExpanded,
            updateConfiguration,
        }),
        [
            projectId,
            mode,
            currentView,
            selectedRequirementIds,
            selectedTestCaseIds,
            searchTerm,
            testSearchTerm,
            isRequirementSectionExpanded,
            isTestCasesSectionExpanded,
            updateConfiguration,
        ],
    );

    return (
        <TestMatrixContext.Provider value={value}>
            {children}
        </TestMatrixContext.Provider>
    );
}

export function useTestMatrix() {
    const context = useContext(TestMatrixContext);
    if (context === undefined) {
        throw new Error(
            'useTestMatrix must be used within a TestMatrixProvider',
        );
    }
    return context;
}
