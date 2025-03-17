'use client';

import { motion } from 'framer-motion';
import { Filter, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { TableSideMenuProps } from './types';

export const TableSideMenu = ({
    showFilter,
    filterComponent,
    onNewRow,
    onEnterEditMode,
}: TableSideMenuProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: -42 }}
            exit={{ opacity: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute left-0 top-0 h-full flex items-center"
        >
            <TooltipProvider delayDuration={0}>
                <div className="flex flex-col gap-0.5 bg-background border-y border-l rounded-l-md shadow-lg">
                    {showFilter && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-none"
                                    >
                                        <Filter className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" sideOffset={5}>
                                    <p>Filter table</p>
                                </TooltipContent>
                            </Tooltip>
                            {filterComponent && (
                                <div className="p-2">{filterComponent}</div>
                            )}
                        </>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => {
                                    onEnterEditMode();
                                    onNewRow();
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={5}>
                            <p>Add new row</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </motion.div>
    );
};
