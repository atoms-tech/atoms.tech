'use client';

import { motion } from 'framer-motion';
import { Check, Edit2, Lock, Unlock } from 'lucide-react';
import React, { memo } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';
import { useLayout } from '@/lib/providers/layout.provider';

// Create two versions of the toggle: a floating action button version and a toolbar version

// Floating action button version
export const EditModeFloatingToggle = memo(() => {
    const { isEditMode, setIsEditMode } = useLayout();

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <motion.div
            className="fixed bottom-8 right-8 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
        >
            <BaseToggle
                icon={<Edit2 className="h-6 w-6" />}
                activeIcon={<Check className="h-6 w-6" />}
                tooltip={isEditMode ? 'Save Changes' : 'Edit Content'}
                isActive={isEditMode}
                onClick={toggleEditMode}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-primary text-primary-foreground"
                variant={isEditMode ? 'outline' : 'destructive'}
            />
        </motion.div>
    );
});

// Toolbar version
export const EditModeToggle = memo(() => {
    const { isEditMode, setIsEditMode } = useLayout();

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <BaseToggle
            icon={<Lock className="h-5 w-5" />}
            activeIcon={<Unlock className="h-5 w-5" />}
            tooltip={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            isActive={isEditMode}
            onClick={toggleEditMode}
            className={
                isEditMode
                    ? 'text-destructive-foreground bg-destructive/80 hover:bg-destructive/90'
                    : ''
            }
        />
    );
});

// Display names for debugging
EditModeFloatingToggle.displayName = 'EditModeFloatingToggle';
EditModeToggle.displayName = 'EditModeToggle';

export default EditModeToggle;
