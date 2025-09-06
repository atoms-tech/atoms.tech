import { SearchIcon } from 'lucide-react';
import React, { memo, useState } from 'react';

import { useTestMatrix } from '@/components/custom/RequirementsTesting/TestMatrix/context/TestMatrixContext';
import { useTestMatrixData } from '@/components/custom/RequirementsTesting/hooks/useTestMatrixData';
import { TestCase } from '@/components/custom/RequirementsTesting/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TestCaseSectionProps {
    testCases: TestCase[];
    linkedTestCasesMap: Record<string, string[]>;
}

function TestCaseSectionComponent({
    testCases,
    linkedTestCasesMap,
}: TestCaseSectionProps) {
    const {
        testSearchTerm,
        setTestSearchTerm,
        selectedTestCaseIds,
        isTestCasesSectionExpanded,
    } = useTestMatrix();

    const { updateSelectedTestCases, isTestCaseLinkedToSelectedRequirement } =
        useTestMatrixData();

    const filteredTestCases = React.useMemo(
        () =>
            testCases.filter(
                (test) =>
                    test.title.toLowerCase().includes(testSearchTerm.toLowerCase()) ||
                    (test.test_id &&
                        test.test_id
                            .toLowerCase()
                            .includes(testSearchTerm.toLowerCase())) ||
                    (test.id &&
                        test.id.toLowerCase().includes(testSearchTerm.toLowerCase())),
            ),
        [testCases, testSearchTerm],
    );

    return (
        <div
            className={cn(
                'h-full flex flex-col border-l',
                'transition-all duration-300 ease-in-out',
                !isTestCasesSectionExpanded && 'w-0 opacity-0 overflow-hidden',
                isTestCasesSectionExpanded && 'w-full opacity-100',
            )}
        >
            {/* Header */}
            <div className="sticky top-0 p-3 border-b bg-background/80 dark:bg-background/90 backdrop-blur-sm z-10">
                <h3 className="text-xs font-medium mb-2.5 flex items-center text-muted-foreground">
                    <span className="uppercase tracking-wider">Test Cases</span>
                    <span className="ml-2 text-[10px] opacity-70">
                        ({filteredTestCases.length})
                    </span>
                </h3>
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 opacity-70" />
                    <Input
                        placeholder="Search test cases..."
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        className="pl-8 h-7 text-xs border-0 bg-muted/40 dark:bg-muted/20 focus:ring-0 focus:ring-offset-0"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredTestCases.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                        <SearchIcon className="h-4 w-4 mb-1.5 opacity-40" />
                        <p className="text-xs">No test cases found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-muted/30">
                        {filteredTestCases.map((test) => {
                            const isLinked = isTestCaseLinkedToSelectedRequirement(
                                test.id,
                                linkedTestCasesMap,
                            );
                            return (
                                <TestCaseRow
                                    key={test.id}
                                    testCase={test}
                                    isSelected={selectedTestCaseIds.includes(test.id)}
                                    isLinked={isLinked}
                                    onSelect={(isSelected) =>
                                        updateSelectedTestCases(
                                            test.id,
                                            isSelected,
                                            isLinked,
                                        )
                                    }
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

interface TestCaseRowProps {
    testCase: TestCase;
    isSelected: boolean;
    isLinked: boolean;
    onSelect: (isSelected: boolean) => void;
}

const TestCaseRow = memo(function TestCaseRow({
    testCase,
    isSelected,
    isLinked,
    onSelect,
}: TestCaseRowProps) {
    const [isHovering, setIsHovering] = useState(false);
    const titleRef = React.useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    React.useEffect(() => {
        if (titleRef.current && isHovering) {
            const isOverflowing =
                titleRef.current.scrollWidth > titleRef.current.clientWidth;
            setShouldScroll(isOverflowing);
        } else {
            setShouldScroll(false);
        }
    }, [isHovering]);

    return (
        <div
            className={cn(
                'flex items-center p-2.5 transition-colors duration-150 h-[48px]',
                'hover:bg-muted/30',
                isSelected && !isLinked && 'bg-primary/5 hover:bg-primary/10',
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Checkbox
                id={`test-${testCase.id}`}
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                disabled={isLinked}
                className={cn(
                    'transition-opacity duration-100 flex-shrink-0',
                    isLinked && 'opacity-60',
                )}
            />
            <div className="ml-3 flex-grow min-w-0">
                <div className="overflow-hidden">
                    <label
                        htmlFor={`test-${testCase.id}`}
                        className={cn(
                            'block text-sm font-medium truncate',
                            isLinked
                                ? 'cursor-not-allowed opacity-80'
                                : 'cursor-pointer hover:text-primary',
                            isSelected && !isLinked && 'text-primary',
                        )}
                    >
                        <span
                            ref={titleRef}
                            className={cn(
                                'inline-block max-w-full whitespace-nowrap',
                                shouldScroll && 'animate-marquee hover:animate-marquee',
                            )}
                            style={
                                shouldScroll
                                    ? {
                                          animationDuration: `${Math.max(5, testCase.title.length * 0.1)}s`,
                                      }
                                    : undefined
                            }
                        >
                            {testCase.title}
                            {isLinked && (
                                <span className="ml-2 text-[10px] text-amber-500 dark:text-amber-400 font-normal">
                                    (Linked)
                                </span>
                            )}
                            {/* Add extra padding for loop effect */}
                            {shouldScroll && <span className="px-4 opacity-70">•</span>}
                            {/* Duplicate text for seamless loop */}
                            {shouldScroll && (
                                <>
                                    {testCase.title}
                                    {isLinked && (
                                        <span className="ml-2 text-[10px] text-amber-500 dark:text-amber-400 font-normal">
                                            (Linked)
                                        </span>
                                    )}
                                </>
                            )}
                        </span>
                    </label>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center mt-0.5 flex-wrap gap-0.5 overflow-hidden whitespace-nowrap">
                    <span className="font-mono opacity-70 flex-shrink-0">
                        {testCase.test_id || testCase.id.substring(0, 8)}
                    </span>
                    <span className="text-[0.6rem] mx-0.5 opacity-40 flex-shrink-0">
                        •
                    </span>
                    <span className="px-1 py-0.5 rounded-full text-[10px] bg-green-100/60 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex-shrink-0">
                        {testCase.test_type}
                    </span>
                    {testCase.priority && (
                        <>
                            <span className="text-[0.6rem] mx-0.5 opacity-40 flex-shrink-0">
                                •
                            </span>
                            <span className="px-1 py-0.5 rounded-full text-[10px] bg-orange-100/60 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 flex-shrink-0">
                                {testCase.priority}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export const TestCaseSection = memo(TestCaseSectionComponent);

// Add this CSS animation safely on the client only
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation-name: marquee;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
`;
    document.head.appendChild(styleTag);
}
