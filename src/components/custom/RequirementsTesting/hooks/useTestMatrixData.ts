import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useTestMatrix } from '@/components/custom/RequirementsTesting/TestMatrix/context/TestMatrixContext';
import { ExecutionStatus } from '@/components/custom/RequirementsTesting/types';
import { useToast } from '@/components/ui/use-toast';
import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';

import { useCreateRequirementTest } from './useTestReq';

export function useTestMatrixData() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const {
        projectId,
        selectedRequirementIds,
        selectedTestCaseIds,
        setSelectedRequirementIds,
        setSelectedTestCaseIds,
    } = useTestMatrix();

    const createRequirementTest = useCreateRequirementTest();

    const updateSelectedRequirements = useCallback(
        (
            reqId: string,
            isSelected: boolean,
            linkedTestCasesMap: Record<string, string[]>,
        ) => {
            try {
                // Update selected requirements
                const newSelectedReqIds = isSelected
                    ? [...selectedRequirementIds, reqId]
                    : selectedRequirementIds.filter((id) => id !== reqId);
                setSelectedRequirementIds(newSelectedReqIds);

                // Get all linked test cases for the new set of requirements
                const allLinkedTestIds = new Set<string>();
                newSelectedReqIds.forEach((id) => {
                    const linkedTests = linkedTestCasesMap[id] || [];
                    linkedTests.forEach((testId) => allLinkedTestIds.add(testId));
                });

                // Maintain manually selected test cases that aren't linked
                const manuallySelectedTests = selectedTestCaseIds.filter(
                    (testId) => !linkedTestCasesMap[reqId]?.includes(testId),
                );

                // Combine linked and manually selected test cases
                const newTestIds = [
                    ...new Set([...manuallySelectedTests, ...allLinkedTestIds]),
                ];
                setSelectedTestCaseIds(newTestIds);
            } catch (error) {
                console.error('Error updating requirements:', error);
                toast({
                    title: 'Error updating requirements',
                    description: 'There was a problem updating your selection.',
                    variant: 'destructive',
                });
            }
        },
        [
            selectedRequirementIds,
            selectedTestCaseIds,
            setSelectedRequirementIds,
            setSelectedTestCaseIds,
            toast,
        ],
    );

    const updateSelectedTestCases = useCallback(
        (testId: string, isSelected: boolean, isLinked: boolean) => {
            try {
                if (isLinked) {
                    // Don't allow deselection of linked test cases
                    if (!isSelected) {
                        toast({
                            title: 'Cannot deselect linked test case',
                            description:
                                'This test case is linked to one or more selected requirements.',
                            variant: 'default',
                        });
                        return;
                    }
                    return; // No need to update if it's already linked
                }

                const newTestIds = isSelected
                    ? [...selectedTestCaseIds, testId]
                    : selectedTestCaseIds.filter((id) => id !== testId);
                setSelectedTestCaseIds(newTestIds);
            } catch (error) {
                console.error('Error updating test cases:', error);
                toast({
                    title: 'Error updating test cases',
                    description: 'There was a problem updating your selection.',
                    variant: 'destructive',
                });
            }
        },
        [selectedTestCaseIds, setSelectedTestCaseIds, toast],
    );

    const isTestCaseLinkedToSelectedRequirement = useCallback(
        (testId: string, linkedTestCasesMap: Record<string, string[]>): boolean => {
            for (const reqId of selectedRequirementIds) {
                if (linkedTestCasesMap[reqId]?.includes(testId)) {
                    return true;
                }
            }
            return false;
        },
        [selectedRequirementIds],
    );

    const handleLinkTest = useCallback(
        async (requirementId: string, testId: string) => {
            try {
                await createRequirementTest.mutateAsync({
                    requirement_id: requirementId,
                    test_id: testId,
                    execution_status: 'not_executed',
                });

                toast({
                    title: 'Test linked successfully',
                    description: 'The test case has been linked to the requirement.',
                    variant: 'default',
                });
            } catch (error) {
                console.error('Error linking test:', error);
                toast({
                    title: 'Error linking test',
                    description:
                        error instanceof Error
                            ? error.message
                            : 'Failed to link test case to requirement.',
                    variant: 'destructive',
                });
            }
        },
        [createRequirementTest, toast],
    );

    // Status update mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({
            requirementId,
            testId,
            status,
        }: {
            requirementId: string;
            testId: string;
            status: ExecutionStatus;
        }) => {
            const api = atomsApiClient();
            return api.testing.updateRelation(requirementId, testId, {
                execution_status: status,
                updated_at: new Date().toISOString(),
            });
        },
        onSuccess: (data) => {
            // Invalidate all relevant queries to trigger UI updates
            queryClient.invalidateQueries({
                queryKey: [...queryKeys.requirementTests.list, projectId],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    ...queryKeys.requirements.detail(data.requirement_id),
                    'testCases',
                ],
            });
            queryClient.invalidateQueries({
                queryKey: [...queryKeys.testReq.detail(data.test_id), 'requirements'],
            });

            toast({
                title: 'Status updated',
                description: 'Test status has been updated successfully.',
                variant: 'default',
            });
        },
        onError: (error) => {
            console.error('Error updating test status:', error);
            toast({
                title: 'Error updating status',
                description: 'There was a problem updating the test status.',
                variant: 'destructive',
            });
        },
    });

    const updateTestStatus = useCallback(
        async (requirementId: string, testId: string, status: ExecutionStatus) => {
            try {
                await updateStatusMutation.mutateAsync({
                    requirementId,
                    testId,
                    status,
                });
            } catch (error) {
                console.error('Error updating test status:', error);
            }
        },
        [updateStatusMutation],
    );

    const deleteTestLink = useMutation({
        mutationFn: async ({
            requirementId,
            testId,
        }: {
            requirementId: string;
            testId: string;
        }) => {
            const api = atomsApiClient();
            await api.testing.deleteRelation(requirementId, testId);
        },
        onSuccess: (_, variables) => {
            // Invalidate all relevant queries
            queryClient.invalidateQueries({
                queryKey: [...queryKeys.requirementTests.list, projectId],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    ...queryKeys.requirements.detail(variables.requirementId),
                    'testCases',
                ],
            });
            queryClient.invalidateQueries({
                queryKey: [...queryKeys.testReq.detail(variables.testId), 'requirements'],
            });

            toast({
                title: 'Link removed',
                description: 'The test case has been unlinked from the requirement.',
                variant: 'default',
            });
        },
        onError: (error) => {
            console.error('Error deleting test link:', error);
            toast({
                title: 'Error removing link',
                description: 'There was a problem unlinking the test case.',
                variant: 'destructive',
            });
        },
    });

    const handleDeleteTestLink = useCallback(
        async (requirementId: string, testId: string) => {
            try {
                await deleteTestLink.mutateAsync({ requirementId, testId });
            } catch (error) {
                console.error('Error deleting test link:', error);
            }
        },
        [deleteTestLink],
    );

    return {
        updateSelectedRequirements,
        updateSelectedTestCases,
        isTestCaseLinkedToSelectedRequirement,
        handleLinkTest,
        updateTestStatus,
        handleDeleteTestLink,
    };
}
