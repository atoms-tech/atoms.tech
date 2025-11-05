'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StreamingCursorProps {
    className?: string;
}

/**
 * Streaming cursor component that shows a blinking cursor
 * to indicate active token-by-token streaming
 */
export const StreamingCursor: React.FC<StreamingCursorProps> = ({ className }) => {
    return (
        <span
            className={cn(
                'inline-block w-0.5 h-4 ml-1 bg-primary align-middle',
                'animate-[blink_1s_ease-in-out_infinite]',
                className
            )}
            aria-label="Streaming"
            role="status"
        >
            <style jsx>{`
                @keyframes blink {
                    0%, 50% {
                        opacity: 1;
                    }
                    51%, 100% {
                        opacity: 0;
                    }
                }
            `}</style>
        </span>
    );
};
