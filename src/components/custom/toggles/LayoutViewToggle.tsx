'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';
import { LayoutViewMode, useLayout } from '@/lib/providers/layout.provider';

export const LayoutViewToggle = memo(() => {
    const [mounted, setMounted] = useState(false);
    const { layoutViewMode, setLayoutViewMode } = useLayout();

    useEffect(() => {
        // Ensure component is mounted for SSR
        setMounted(true);

        // Load initial state from localStorage
        const savedMode = localStorage.getItem('layoutViewMode');
        if (savedMode === 'wide' || savedMode === 'standard') {
            setLayoutViewMode(savedMode as LayoutViewMode);
        }
    }, [setLayoutViewMode]);

    const isWideMode = layoutViewMode === 'wide';

    const cycleLayoutViewMode = () => {
        const newMode = isWideMode ? 'standard' : 'wide';
        setLayoutViewMode(newMode);
        localStorage.setItem('layoutViewMode', newMode); // Persist state
    };

    const tooltip = isWideMode
        ? 'Switch to Standard View'
        : 'Switch to Wide View';

    // For SSR, show a placeholder until mounted
    if (!mounted) {
        return (
            <div className="h-9 w-9 flex items-center justify-center">
                <span className="h-[1.2rem] w-[1.2rem]" />
            </div>
        );
    }

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
