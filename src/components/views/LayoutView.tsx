'use client';

import { motion } from 'framer-motion';
import { ReactNode, memo } from 'react';

import { useLayout } from '@/lib/providers/layout.provider';
import { cn } from '@/lib/utils';

interface LayoutViewProps {
    children: ReactNode;
    className?: string;
}

// Define animation variants
const layoutVariants = {
    standard: {
        width: '100%',
        maxWidth: '50rem', // Approximately 50% of a typical wide screen
    },
    wide: {
        width: '100%',
        maxWidth: '100%',
    },
};

// Use React.memo to prevent unnecessary re-renders
const LayoutView = memo(({ children, className }: LayoutViewProps) => {
    const { layoutViewMode, isMobile } = useLayout();

    // Always use wide layout on mobile regardless of setting
    const effectiveLayoutMode = isMobile ? 'wide' : layoutViewMode;

    return (
        <motion.div
            initial={false} // Prevents animation on initial render
            animate={effectiveLayoutMode}
            variants={layoutVariants}
            transition={{
                duration: 0.3, // Shortened for better UX
                ease: 'easeInOut', // More natural feeling easing
            }}
            className={cn(
                'flex flex-col bg-background text-foreground mx-auto',
                // Add responsive padding that scales with viewport
                'px-4 sm:px-6 md:px-8',
                className,
            )}
        >
            {children}
        </motion.div>
    );
});

// Display name for debugging
LayoutView.displayName = 'LayoutView';

export default LayoutView;
