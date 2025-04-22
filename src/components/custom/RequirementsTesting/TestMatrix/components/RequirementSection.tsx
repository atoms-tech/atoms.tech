import { SearchIcon } from 'lucide-react';
import React, { memo, useState } from 'react';

import { useTestMatrix } from '@/components/custom/RequirementsTesting/TestMatrix/context/TestMatrixContext';
import { useTestMatrixData } from '@/components/custom/RequirementsTesting/hooks/useTestMatrixData';
import { Requirement } from '@/components/custom/RequirementsTesting/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RequirementSectionProps {
    requirements: Requirement[];
    linkedTestCasesMap: Record<string, string[]>;
}

function RequirementSectionComponent({
    requirements,
    linkedTestCasesMap,
}: RequirementSectionProps) {
    const {
        searchTerm,
        setSearchTerm,
        selectedRequirementIds,
        isRequirementSectionExpanded,
    } = useTestMatrix();

    const { updateSelectedRequirements } = useTestMatrixData();

    const filteredRequirements = React.useMemo(
        () =>
            requirements.filter(
                (req) =>
                    req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (req.external_id &&
                        req.external_id
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())),
            ),
        [requirements, searchTerm],
    );

    return (
        <div
            className={cn(
                'h-full flex flex-col border-r',
                'transition-all duration-300 ease-in-out',
                !isRequirementSectionExpanded &&
                    'w-0 opacity-0 overflow-hidden',
                isRequirementSectionExpanded && 'w-full opacity-100',
            )}
        >
            {/* Header */}
            <div className="sticky top-0 p-3 border-b bg-background/80 dark:bg-background/90 backdrop-blur-sm z-10">
                <h3 className="text-xs font-medium mb-2.5 flex items-center text-muted-foreground">
                    <span className="uppercase tracking-wider">
                        Requirements
                    </span>
                    <span className="ml-2 text-[10px] opacity-70">
                        ({filteredRequirements.length})
                    </span>
                </h3>
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 opacity-70" />
                    <Input
                        placeholder="Search requirements..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-7 text-xs border-0 bg-muted/40 dark:bg-muted/20 focus:ring-0 focus:ring-offset-0"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredRequirements.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                        <SearchIcon className="h-4 w-4 mb-1.5 opacity-40" />
                        <p className="text-xs">No requirements found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-muted/30">
                        {filteredRequirements.map((req) => (
                            <RequirementRow
                                key={req.id}
                                requirement={req}
                                isSelected={selectedRequirementIds.includes(
                                    req.id,
                                )}
                                linkedTestCount={
                                    linkedTestCasesMap[req.id]?.length || 0
                                }
                                onSelect={(isSelected) =>
                                    updateSelectedRequirements(
                                        req.id,
                                        isSelected,
                                        linkedTestCasesMap,
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface RequirementRowProps {
    requirement: Requirement;
    isSelected: boolean;
    linkedTestCount: number;
    onSelect: (isSelected: boolean) => void;
}

const RequirementRow = memo(function RequirementRow({
    requirement,
    isSelected,
    linkedTestCount,
    onSelect,
}: RequirementRowProps) {
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
                isSelected && 'bg-primary/5 hover:bg-primary/10',
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Checkbox
                id={`req-${requirement.id}`}
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="transition-opacity duration-100 flex-shrink-0"
            />
            <div className="ml-3 flex-grow min-w-0">
                <div className="overflow-hidden">
                    <label
                        htmlFor={`req-${requirement.id}`}
                        className={cn(
                            'block text-sm font-medium cursor-pointer hover:text-primary truncate',
                            isSelected && 'text-primary',
                        )}
                    >
                        <span
                            ref={titleRef}
                            className={cn(
                                'inline-block max-w-full whitespace-nowrap',
                                shouldScroll &&
                                    'animate-marquee hover:animate-marquee',
                            )}
                            style={
                                shouldScroll
                                    ? {
                                          animationDuration: `${Math.max(5, requirement.name.length * 0.1)}s`,
                                      }
                                    : undefined
                            }
                        >
                            {requirement.name}
                            {/* Add extra padding for loop effect */}
                            {shouldScroll && (
                                <span className="px-4 opacity-70">•</span>
                            )}
                            {/* Duplicate text for seamless loop */}
                            {shouldScroll && <>{requirement.name}</>}
                        </span>
                    </label>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center mt-0.5 flex-wrap gap-0.5 overflow-hidden whitespace-nowrap">
                    <span className="font-mono opacity-70 flex-shrink-0">
                        {requirement.external_id ||
                            requirement.id.substring(0, 8)}
                    </span>
                    <span className="text-[0.6rem] mx-0.5 opacity-40 flex-shrink-0">
                        •
                    </span>
                    <span className="px-1 py-0.5 rounded-full text-[10px] bg-blue-100/60 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex-shrink-0">
                        {requirement.level}
                    </span>
                    {linkedTestCount > 0 && (
                        <>
                            <span className="text-[0.6rem] mx-0.5 opacity-40 flex-shrink-0">
                                •
                            </span>
                            <span className="px-1 py-0.5 rounded-full text-[10px] bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex-shrink-0">
                                {linkedTestCount} linked
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export const RequirementSection = memo(RequirementSectionComponent);
