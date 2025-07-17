import React, { memo } from 'react';

import { useTestMatrixData } from '@/components/custom/RequirementsTesting/hooks/useTestMatrixData';
import {
    ExecutionStatus,
    Requirement,
    RequirementTest,
    TestCase,
} from '@/components/custom/RequirementsTesting/types';

import { TestStatusIndicator } from './TestStatusIndicator';

interface TestMatrixGridProps {
    requirements: Requirement[];
    testCases: TestCase[];
    requirementTests: RequirementTest[];
}

function TestMatrixGridComponent({
    requirements,
    testCases,
    requirementTests,
}: TestMatrixGridProps) {
    const { handleLinkTest, updateTestStatus, handleDeleteTestLink } =
        useTestMatrixData();

    return (
        <div className="flex relative">
            <div className="w-[40%] flex-shrink-0 border-r border-muted bg-background">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="h-14 px-4 text-center font-medium w-[25%] border-b border-r border-muted sticky top-0 bg-background">
                                Req ID
                            </th>
                            <th className="h-14 px-4 text-center font-medium w-[20%] border-b border-r border-muted sticky top-0 bg-background">
                                Type
                            </th>
                            <th className="h-14 px-4 text-center font-medium border-b border-r border-muted sticky top-0 bg-background">
                                Title
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {requirements.map((requirement) => (
                            <tr
                                key={requirement.id}
                                className="hover:bg-muted/50 group/row transition-colors"
                            >
                                <td className="h-[60px] px-4 border-r border-muted whitespace-nowrap font-mono text-sm text-muted-foreground">
                                    {requirement.external_id ||
                                        requirement.id.substring(0, 8)}
                                </td>
                                <td className="h-[60px] px-4 border-r border-muted align-middle">
                                    <div className="px-2.5 py-1 rounded-full text-xs font-medium inline-block bg-blue-100 text-blue-800">
                                        {requirement.level}
                                    </div>
                                </td>
                                <td className="h-[60px] px-4 border-r border-muted">
                                    <div className="relative h-full">
                                        <div className="absolute inset-0 overflow-x-auto">
                                            <div className="text-sm whitespace-nowrap py-4 font-medium group-hover/row:text-primary transition-colors">
                                                {requirement.name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex-grow relative">
                <div className="absolute inset-0">
                    <div className="w-full h-full overflow-x-auto">
                        <table className="w-auto border-collapse">
                            <thead>
                                <tr>
                                    {testCases.map((testCase) => (
                                        <th
                                            key={testCase.id}
                                            className="h-14 px-2 text-center font-medium border-b border-r border-muted min-w-[80px] w-[80px] sticky top-0 bg-background"
                                        >
                                            <div className="truncate text-xs text-muted-foreground font-mono">
                                                {testCase.test_id ||
                                                    testCase.id.substring(0, 8)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {requirements.map((requirement) => (
                                    <tr key={requirement.id}>
                                        {testCases.map((testCase) => {
                                            const relationship = requirementTests.find(
                                                (rt) =>
                                                    rt.requirement_id ===
                                                        requirement.id &&
                                                    rt.test_id === testCase.id,
                                            );

                                            return (
                                                <td
                                                    key={`${requirement.id}-${testCase.id}`}
                                                    className="h-[60px] px-2 text-center border-r border-muted min-w-[80px] w-[80px] align-middle bg-background hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-center h-full">
                                                        {relationship ? (
                                                            <TestStatusIndicator
                                                                status={
                                                                    relationship.execution_status ||
                                                                    'not_executed'
                                                                }
                                                                onStatusChange={(
                                                                    value: ExecutionStatus,
                                                                ) =>
                                                                    updateTestStatus(
                                                                        requirement.id,
                                                                        testCase.id,
                                                                        value,
                                                                    )
                                                                }
                                                                onDelete={() =>
                                                                    handleDeleteTestLink(
                                                                        requirement.id,
                                                                        testCase.id,
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
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const TestMatrixGrid = memo(TestMatrixGridComponent);
