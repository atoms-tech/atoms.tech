'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
    useCreateRequirementTest,
    useCreateTestReq,
    useProjectRequirementTests,
    useProjectTestCases,
} from '@/components/custom/TestBed/useTestReq';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    useProjectRequirements,
    useRequirementsByIds,
} from '@/hooks/queries/useRequirement';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { cn } from '@/lib/utils';
import { Database } from '@/types/base/database.types';

import { TestStatusIndicator } from './TestStatusIndicator';

interface TraceabilityMatrixViewProps {
    projectId: string;
}

type TestData = {
    title: string;
    description: string;
    test_type: Database['public']['Enums']['test_type'];
    method: Database['public']['Enums']['test_method'];
    priority: Database['public']['Enums']['test_priority'];
    status: Database['public']['Enums']['test_status'];
};

// Add new type for execution status
type ExecutionStatus = Database['public']['Enums']['execution_status'];

// Add this helper function at the top level
const getTypeStyle = (type: string) => {
    const styles = {
        functional:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        performance:
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        usability:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        compatibility:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        default:
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return styles[type.toLowerCase() as keyof typeof styles] || styles.default;
};

export default function TraceabilityMatrixView({
    projectId,
}: TraceabilityMatrixViewProps) {
    const [selectedRequirementIds, setSelectedRequirementIds] = useState<
        string[]
    >([]);
    const [showAddRequirementModal, setShowAddRequirementModal] =
        useState(false);
    const [showAddTestModal, setShowAddTestModal] = useState(false);
    const [currentRequirementId, _setCurrentRequirementId] = useState<
        string | null
    >(null);
    const [newTestData, setNewTestData] = useState<TestData>({
        title: '',
        description: '',
        test_type: 'unit',
        method: 'manual',
        priority: 'medium',
        status: 'draft',
    });
    const testTableRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();

    // Fetch requirements for this project
    const { data: allRequirements = [] } = useProjectRequirements(projectId);

    // Fetch requirements that should be displayed in the matrix
    const { data: requirements = [] } = useRequirementsByIds(
        selectedRequirementIds.length > 0
            ? selectedRequirementIds
            : allRequirements.slice(0, 10).map((req) => req.id),
    );

    // Fetch all test cases for this project
    const { data: testCasesData, isLoading: testCasesLoading } =
        useProjectTestCases(projectId);
    const testCases = testCasesData?.data || [];

    // Fetch all requirement-test relationships
    const { data: requirementTests = [] } =
        useProjectRequirementTests(projectId);

    // Mutations
    const createTestReq = useCreateTestReq();
    const createRequirementTest = useCreateRequirementTest();

    // Add mutation for updating test status
    const updateTestStatus = async (
        requirementId: string,
        testId: string,
        status: ExecutionStatus,
    ) => {
        try {
            const { data, error } = await supabase
                .from('requirement_tests')
                .update({ execution_status: status })
                .eq('requirement_id', requirementId)
                .eq('test_id', testId)
                .select()
                .single();

            if (error || !data) throw error;

            // Refetch requirement tests to update the UI
            await queryClient.invalidateQueries({
                queryKey: [...queryKeys.requirementTests.list, projectId],
            });
        } catch (error) {
            console.error('Error updating test status:', error);
        }
    };

    // Handle creating a new test and linking to requirement
    const handleCreateTest = async () => {
        if (!currentRequirementId) return;

        try {
            const newTest = await createTestReq.mutateAsync({
                ...newTestData,
                project_id: projectId,
                is_active: true,
            });

            await createRequirementTest.mutateAsync({
                requirement_id: currentRequirementId,
                test_id: newTest.id,
                execution_status: 'not_executed',
            });

            setShowAddTestModal(false);
            setNewTestData({
                title: '',
                description: '',
                test_type: 'unit',
                method: 'manual',
                priority: 'medium',
                status: 'draft',
            });
        } catch (error) {
            console.error('Error creating test:', error);
        }
    };

    // Handle linking an existing test to a requirement
    const handleLinkTest = async (requirementId: string, testId: string) => {
        try {
            await createRequirementTest.mutateAsync({
                requirement_id: requirementId,
                test_id: testId,
                execution_status: 'not_executed',
            });
        } catch (error) {
            console.error('Error linking test:', error);
        }
    };

    // Update selected requirements for the matrix
    const handleRequirementsSelected = (selectedIds: string[]) => {
        setSelectedRequirementIds(selectedIds);
        setShowAddRequirementModal(false);
    };

    // Handle horizontal scrolling with mouse wheel
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (testTableRef.current) {
                e.preventDefault();
                testTableRef.current.scrollLeft += e.deltaY;
            }
        };

        const tableElement = testTableRef.current;
        if (tableElement) {
            tableElement.addEventListener('wheel', handleWheel, {
                passive: false,
            });
        }

        return () => {
            if (tableElement) {
                tableElement.removeEventListener('wheel', handleWheel);
            }
        };
    }, []);

    if (testCasesLoading) {
        return (
            <div className="p-6 text-center">
                Loading traceability matrix...
            </div>
        );
    }

    return (
        <div className="bg-background">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-lg font-medium">
                    Requirements Traceability Matrix
                </h2>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setShowAddRequirementModal(true)}
                        variant="outline"
                    >
                        Manage Requirements
                    </Button>
                </div>
            </div>

            {requirements.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-gray-500 mb-4">
                        No requirements selected for the traceability matrix
                    </p>
                    <Button onClick={() => setShowAddRequirementModal(true)}>
                        Add Requirements
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex relative">
                        {/* Fixed Requirements Section */}
                        <div className="w-[40%] flex-shrink-0 border-r bg-background">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="h-14 px-4 text-center font-medium w-[25%] border-b border-r sticky top-0 bg-background">
                                            Req ID
                                        </th>
                                        <th className="h-14 px-4 text-center font-medium w-[20%] border-b border-r sticky top-0 bg-background">
                                            Type
                                        </th>
                                        <th className="h-14 px-4 text-center font-medium border-b border-r sticky top-0 bg-background">
                                            Title
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements.map((requirement, index) => (
                                        <tr
                                            key={requirement.id}
                                            data-row-index={index}
                                            className="hover:bg-muted/50 group/row"
                                            onMouseEnter={() => {
                                                const testRow =
                                                    document.querySelector(
                                                        `[data-test-row-index="${index}"]`,
                                                    );
                                                testRow?.classList.add(
                                                    'bg-muted/50',
                                                );
                                            }}
                                            onMouseLeave={() => {
                                                const testRow =
                                                    document.querySelector(
                                                        `[data-test-row-index="${index}"]`,
                                                    );
                                                testRow?.classList.remove(
                                                    'bg-muted/50',
                                                );
                                            }}
                                        >
                                            <td className="h-[60px] px-4 border-r whitespace-nowrap font-mono text-sm text-muted-foreground">
                                                {requirement.external_id ||
                                                    requirement.id.substring(
                                                        0,
                                                        8,
                                                    )}
                                            </td>
                                            <td className="h-[60px] px-4 border-r align-middle">
                                                <div
                                                    className={cn(
                                                        'px-2.5 py-1 rounded-full text-xs font-medium inline-block',
                                                        getTypeStyle(
                                                            requirement.level,
                                                        ),
                                                    )}
                                                >
                                                    {requirement.level}
                                                </div>
                                            </td>
                                            <td className="h-[60px] px-4 border-r font-medium group-hover/row:text-primary transition-colors">
                                                {requirement.name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Scrollable Test Cases Section */}
                        <div className="flex-grow relative">
                            <div className="absolute inset-0">
                                <div
                                    ref={testTableRef}
                                    className="w-full h-full overflow-x-auto scrollbar-hide"
                                >
                                    <table className="w-auto border-collapse">
                                        <thead>
                                            <tr>
                                                {testCases.map((testCase) => (
                                                    <th
                                                        key={testCase.id}
                                                        className="h-14 px-2 text-center font-medium border-b border-r min-w-[80px] w-[80px] sticky top-0 bg-background"
                                                    >
                                                        <div className="truncate text-xs text-muted-foreground font-mono">
                                                            {testCase.test_id ||
                                                                'NULL-ID'}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requirements.map(
                                                (requirement, index) => (
                                                    <tr
                                                        key={requirement.id}
                                                        data-test-row-index={
                                                            index
                                                        }
                                                        className="transition-colors"
                                                    >
                                                        {testCases.map(
                                                            (testCase) => {
                                                                const relationship =
                                                                    requirementTests.find(
                                                                        (rt) =>
                                                                            rt.requirementId ===
                                                                                requirement.id &&
                                                                            rt.testCaseId ===
                                                                                testCase.id,
                                                                    );
                                                                const executionStatus =
                                                                    relationship?.execution_status as
                                                                        | ExecutionStatus
                                                                        | undefined;

                                                                return (
                                                                    <td
                                                                        key={`${requirement.id}-${testCase.id}`}
                                                                        className="h-[60px] px-2 text-center border-r min-w-[80px] w-[80px] align-middle bg-background"
                                                                    >
                                                                        <div className="flex items-center justify-center h-full">
                                                                            {relationship ? (
                                                                                <TestStatusIndicator
                                                                                    status={
                                                                                        executionStatus ||
                                                                                        'not_executed'
                                                                                    }
                                                                                    onStatusChange={(
                                                                                        value,
                                                                                    ) =>
                                                                                        updateTestStatus(
                                                                                            requirement.id,
                                                                                            testCase.id,
                                                                                            value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleLinkTest(
                                                                                            requirement.id,
                                                                                            testCase.id,
                                                                                        )
                                                                                    }
                                                                                    className="text-xs text-blue-500 hover:underline"
                                                                                >
                                                                                    Link
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            },
                                                        )}
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Requirement Modal */}
            <Dialog
                open={showAddRequirementModal}
                onOpenChange={setShowAddRequirementModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Requirements</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="max-h-96 overflow-y-auto mb-4">
                            {allRequirements?.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex items-center space-x-2 mb-2 p-2 hover:bg-gray-100 rounded"
                                >
                                    <Checkbox
                                        id={req.id}
                                        checked={selectedRequirementIds.includes(
                                            req.id,
                                        )}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRequirementIds(
                                                    (prev) => [...prev, req.id],
                                                );
                                            } else {
                                                setSelectedRequirementIds(
                                                    (prev) =>
                                                        prev.filter(
                                                            (id) =>
                                                                id !== req.id,
                                                        ),
                                                );
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor={req.id}
                                        className="text-sm cursor-pointer flex-1"
                                    >
                                        <div className="font-medium">
                                            {req.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {req.level} •{' '}
                                            {req.id.substring(0, 8)}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setShowAddRequirementModal(false)
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() =>
                                    handleRequirementsSelected(
                                        selectedRequirementIds,
                                    )
                                }
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Test Modal */}
            <Dialog open={showAddTestModal} onOpenChange={setShowAddTestModal}>
                <DialogContent>
                    <div className="p-6">
                        <h3 className="text-lg font-medium mb-4">
                            Add Test Case
                        </h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Title
                                </label>
                                <Input
                                    value={newTestData.title}
                                    onChange={(e) =>
                                        setNewTestData({
                                            ...newTestData,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Test case title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                    value={newTestData.description}
                                    onChange={(e) =>
                                        setNewTestData({
                                            ...newTestData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Test case description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Type
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newTestData.test_type}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                test_type: e.target
                                                    .value as Database['public']['Enums']['test_type'],
                                            })
                                        }
                                    >
                                        <option value="unit">Unit</option>
                                        <option value="integration">
                                            Integration
                                        </option>
                                        <option value="system">System</option>
                                        <option value="acceptance">
                                            Acceptance
                                        </option>
                                        <option value="performance">
                                            Performance
                                        </option>
                                        <option value="security">
                                            Security
                                        </option>
                                        <option value="usability">
                                            Usability
                                        </option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Method
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newTestData.method}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                method: e.target
                                                    .value as Database['public']['Enums']['test_method'],
                                            })
                                        }
                                    >
                                        <option value="manual">Manual</option>
                                        <option value="automated">
                                            Automated
                                        </option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Priority
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newTestData.priority}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                priority: e.target
                                                    .value as Database['public']['Enums']['test_priority'],
                                            })
                                        }
                                    >
                                        <option value="critical">
                                            Critical
                                        </option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Status
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={newTestData.status}
                                        onChange={(e) =>
                                            setNewTestData({
                                                ...newTestData,
                                                status: e.target
                                                    .value as Database['public']['Enums']['test_status'],
                                            })
                                        }
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="ready">Ready</option>
                                        <option value="in_progress">
                                            In Progress
                                        </option>
                                        <option value="blocked">Blocked</option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                        <option value="obsolete">
                                            Obsolete
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">
                                Link Existing Test
                            </h4>
                            <select
                                className="w-full p-2 border rounded mb-4"
                                onChange={(e) => {
                                    if (
                                        e.target.value &&
                                        currentRequirementId
                                    ) {
                                        handleLinkTest(
                                            currentRequirementId,
                                            e.target.value,
                                        );
                                        setShowAddTestModal(false);
                                    }
                                }}
                            >
                                <option value="">
                                    Select an existing test...
                                </option>
                                {testCases
                                    .filter((test) => {
                                        // Filter out tests that are already linked to this requirement
                                        return !requirementTests.some(
                                            (rt) =>
                                                rt.requirementId ===
                                                    currentRequirementId &&
                                                rt.testCaseId === test.id,
                                        );
                                    })
                                    .map((test) => (
                                        <option key={test.id} value={test.id}>
                                            {test.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddTestModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTest}
                                disabled={
                                    !newTestData.title ||
                                    createTestReq.isPending
                                }
                            >
                                {createTestReq.isPending
                                    ? 'Creating...'
                                    : 'Create New Test'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
