'use client';

import { useState } from 'react';
import { InProgressModal } from './in-progress-modal';

interface InProgressContainerProps {
    children: React.ReactNode;
    title: string;
    description: string;
    requiresModal?: boolean;
    onModalOpen?: () => void;
    estimatedCompletion?: string;
    features?: string[];
}

export function InProgressContainer({
    children,
    title,
    description,
    requiresModal = false,
    onModalOpen,
    estimatedCompletion = 'Coming Soon',
    features = [],
}: InProgressContainerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => {
        if (requiresModal) {
            setIsModalOpen(true);
            onModalOpen?.();
        }
    };

    const testId = `in-progress-${title.toLowerCase().replace(/\s+/g, '-')}`;
    const triggerTestId = `trigger-${title.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <>
            <div data-testid={testId}>
                <div
                    role={requiresModal ? 'button' : undefined}
                    onClick={handleClick}
                    data-testid={triggerTestId}
                    className={requiresModal ? 'cursor-pointer' : ''}
                >
                    {children}
                </div>
            </div>
            {requiresModal && (
                <InProgressModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={title}
                    description={description}
                    features={features}
                    estimatedCompletion={estimatedCompletion}
                />
            )}
        </>
    );
}