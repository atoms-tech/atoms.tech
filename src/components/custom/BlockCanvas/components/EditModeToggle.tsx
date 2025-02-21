'use client';

import { motion } from 'framer-motion';
import { Check, Edit2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface EditModeToggleProps {
    isEditMode: boolean;
    onToggle: () => void;
}

export const EditModeToggle: React.FC<EditModeToggleProps> = ({
    isEditMode,
    onToggle,
}) => {
    return (
        <motion.div
            className="fixed bottom-8 right-8 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
        >
            <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg"
                onClick={onToggle}
                variant={isEditMode ? 'secondary' : 'default'}
            >
                {isEditMode ? (
                    <Check className="h-6 w-6" />
                ) : (
                    <Edit2 className="h-6 w-6" />
                )}
            </Button>
        </motion.div>
    );
};
