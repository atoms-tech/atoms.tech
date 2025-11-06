'use client';

import { History } from 'lucide-react';
import React, { useState } from 'react';

// import { Badge } from '@/components/ui/badge'; // Will be used when implementing badge
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { ChatHistoryV6 } from './ChatHistoryV6';

interface ChatHistoryButtonProps {
    className?: string;
    onLoadSession?: (sessionId: string) => void;
}

export const ChatHistoryButton: React.FC<ChatHistoryButtonProps> = ({
    className = '',
    onLoadSession,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`relative ${className}`}
                    title="View chat history"
                >
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Chat History</DialogTitle>
                </DialogHeader>
                <ChatHistoryV6 onLoadSession={onLoadSession} />
            </DialogContent>
        </Dialog>
    );
};
