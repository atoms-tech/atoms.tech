'use client';

import { Table, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/store/settings.store';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export function ViewModeToggle() {
    const { viewMode, setViewMode } = useSettingsStore();

    const cycleViewMode = () => {
        const modes = ['normal', 'compact'] as const;
        const currentIndex = modes.indexOf(viewMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setViewMode(modes[nextIndex]);
    };

    const getIcon = () => {
        switch (viewMode) {
            case 'normal':
                return (
                    <Table className="h-[1.2rem] w-[1.2rem] transition-transform duration-200 hover:scale-110" />
                );
            case 'compact':
                return (
                    <LayoutGrid className="h-[1.2rem] w-[1.2rem] transition-transform duration-200 hover:scale-110" />
                );
        }
    };

    const getTooltipText = () => {
        const nextMode = {
            normal: 'Compact',
            compact: 'Normal',
        }[viewMode];
        return `Switch to ${nextMode} View`;
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cycleViewMode}
                        className="h-9 w-9 transition-colors"
                    >
                        {getIcon()}
                        <span className="sr-only">Toggle view mode</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipText()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
