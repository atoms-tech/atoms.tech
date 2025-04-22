import { Trash2 } from 'lucide-react';
import React, { memo } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Database } from '@/types/base/database.types';

type ExecutionStatus = Database['public']['Enums']['execution_status'];

interface TestStatusIndicatorProps {
    status: ExecutionStatus;
    onStatusChange: (status: ExecutionStatus) => void;
    onDelete?: () => void;
}

const getStatusStyles = (status: ExecutionStatus) => {
    switch (status) {
        case 'passed':
            return {
                bg: 'bg-green-500',
                text: 'text-green-50',
                tooltipBg: 'bg-green-500',
            };
        case 'failed':
            return {
                bg: 'bg-red-500',
                text: 'text-red-50',
                tooltipBg: 'bg-red-500',
            };
        case 'blocked':
            return {
                bg: 'bg-yellow-500',
                text: 'text-yellow-50',
                tooltipBg: 'bg-yellow-500',
            };
        case 'in_progress':
            return {
                bg: 'bg-blue-500',
                text: 'text-blue-50',
                tooltipBg: 'bg-blue-500',
            };
        case 'skipped':
            return {
                bg: 'bg-black',
                text: 'text-gray-50',
                tooltipBg: 'bg-black',
            };
        default:
            return {
                bg: 'bg-gray-300',
                text: 'text-gray-50',
                tooltipBg: 'bg-gray-300',
            };
    }
};

const formatStatus = (status: ExecutionStatus): string => {
    return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

function TestStatusIndicatorComponent({
    status,
    onStatusChange,
    onDelete,
}: TestStatusIndicatorProps) {
    const styles = getStatusStyles(status);

    const handleValueChange = (value: string) => {
        if (value === 'delete') {
            onDelete?.();
        } else {
            onStatusChange(value as ExecutionStatus);
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center justify-center w-full h-full">
                <Tooltip delayDuration={50}>
                    <TooltipTrigger asChild>
                        <div>
                            <Select
                                value={status}
                                onValueChange={handleValueChange}
                            >
                                <SelectTrigger className="flex items-center justify-center w-5 h-5 min-w-0 min-h-0 border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 [&>svg]:hidden">
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full ${styles.bg} transition-colors duration-200`}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_executed">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-300" />
                                            <span>Not Executed</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <span>In Progress</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="passed">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span>Passed</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="failed">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <span>Failed</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="blocked">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <span>Blocked</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="skipped">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-black" />
                                            <span>Skipped</span>
                                        </div>
                                    </SelectItem>
                                    {onDelete && (
                                        <>
                                            <SelectSeparator />
                                            <SelectItem
                                                value="delete"
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Trash2 className="h-3 w-3" />
                                                    <span>Remove Link</span>
                                                </div>
                                            </SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent
                        className={cn(
                            styles.tooltipBg,
                            styles.text,
                            'font-medium border-none',
                        )}
                    >
                        {formatStatus(status)}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}

export const TestStatusIndicator = memo(TestStatusIndicatorComponent);
