'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { memo } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';
import { useLayout } from '@/lib/providers/layout.provider';

export const LayoutViewToggle = memo(() => {
    const { layoutViewMode, setLayoutViewMode } = useLayout();

    const isWideMode = layoutViewMode === 'wide';

    const cycleLayoutViewMode = () => {
        setLayoutViewMode(isWideMode ? 'standard' : 'wide');
    };

    const tooltip = isWideMode
        ? 'Switch to Standard View'
        : 'Switch to Wide View';

    return (
        <BaseToggle
            icon={<Maximize2 className="h-[1.2rem] w-[1.2rem]" />}
            activeIcon={<Minimize2 className="h-[1.2rem] w-[1.2rem]" />}
            tooltip={tooltip}
            isActive={isWideMode}
            onClick={cycleLayoutViewMode}
        />
    );
});

// Display name for debugging
LayoutViewToggle.displayName = 'LayoutViewToggle';

export default LayoutViewToggle;
