'use client';

import { Profiler, ProfilerOnRenderCallback } from 'react';

interface ProfilerWrapperProps {
    children: React.ReactNode;
    id: string;
}

// Simple profiler wrapper without memo to avoid potential issues
export function ProfilerWrapper({ children, id }: ProfilerWrapperProps) {
    // Basic callback that just logs the duration
    const onRenderCallback: ProfilerOnRenderCallback = (
        id,
        phase,
        actualDuration,
    ) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(
                `[Profiler] ${id} - ${phase}: ${actualDuration.toFixed(1)}ms`,
            );
        }
    };

    return (
        <Profiler id={id} onRender={onRenderCallback}>
            {children}
        </Profiler>
    );
}
