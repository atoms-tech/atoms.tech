'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConversationMessage } from '@/components/ui/ai-elements';
import { ArtifactRenderer } from './ArtifactRenderer';
import { extractArtifacts } from '@/lib/utils/artifacts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface MessageWithArtifactsProps {
    message: {
        id: string;
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
        createdAt?: Date;
        isStreaming?: boolean;
    };
    editable?: boolean;
    onEdit?: () => void;
    isEditing?: boolean;
    branchCount?: number;
    activeBranchIndex?: number;
    onSwitchBranch?: (direction: 'prev' | 'next') => void;
    showRetry?: boolean;
    onRetry?: () => void;
    showBranchNav?: boolean;
    className?: string;
}

export const MessageWithArtifacts: React.FC<MessageWithArtifactsProps> = ({
    message,
    editable,
    onEdit,
    isEditing = false,
    branchCount = 1,
    activeBranchIndex = 0,
    onSwitchBranch,
    showRetry = false,
    onRetry,
    showBranchNav = false,
    className,
}) => {
    // Extract artifacts from message content
    const { cleanedText, artifacts } = useMemo(() => {
        if (message.role === 'assistant') {
            return extractArtifacts(message.content);
        }
        return { cleanedText: message.content, artifacts: [] };
    }, [message.content, message.role]);

    return (
        <div className={cn('group', className)}>
            <ConversationMessage
                role={message.role}
                isStreaming={message.isStreaming}
                timestamp={message.createdAt}
                editable={editable && !isEditing}
                onEdit={onEdit}
                isEditing={isEditing}
                branchCount={branchCount}
                activeBranchIndex={activeBranchIndex}
                onSwitchBranch={onSwitchBranch}
                className={cn(
                    message.role === 'system' && 'bg-secondary text-secondary-foreground',
                    message.role === 'tool' && 'bg-muted/70 text-muted-foreground',
                )}
            >
                {/* Message Content */}
                {message.role === 'assistant' ? (
                    <div className="space-y-4">
                        {/* Text content - always show container during streaming to display cursor */}
                        {(cleanedText || message.isStreaming) && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {message.isStreaming ? (
                                    // Render plain text during streaming for smoother token-by-token updates
                                    <div className="whitespace-pre-wrap break-words min-h-[1em]">
                                        {cleanedText || ''}
                                    </div>
                                ) : (
                                    // Render markdown only when streaming is complete
                                    <ReactMarkdown>{cleanedText}</ReactMarkdown>
                                )}
                            </div>
                        )}

                        {/* Artifacts */}
                        {artifacts.length > 0 && (
                            <div className="space-y-3">
                                {artifacts.map((artifact) => (
                                    <ArtifactRenderer
                                        key={artifact.id}
                                        artifact={artifact}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : message.role === 'tool' ? (
                    <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">
                        {message.content}
                    </pre>
                ) : (
                    <div
                        key={`${message.id}-${message.content.length}`}
                        className="break-words whitespace-pre-wrap text-left"
                    >
                        {message.content.trimEnd()}
                    </div>
                )}
            </ConversationMessage>
            
            {/* Branch navigation below message where branch occurred */}
            {showBranchNav && branchCount > 1 && onSwitchBranch && (
                <div className="flex justify-end mt-2 px-1">
                    <div className="flex items-center gap-1 bg-background/90 shadow-sm border border-border rounded px-2 py-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => onSwitchBranch('prev')}
                        >
                            <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-[10px] leading-none px-1 text-center min-w-[2rem]">
                            {activeBranchIndex + 1} / {branchCount}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => onSwitchBranch('next')}
                        >
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}
            
            {/* Retry button under last user message */}
            {showRetry && onRetry && (
                <div className="flex justify-end mt-2 px-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2 text-xs"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Retry
                    </Button>
                </div>
            )}
        </div>
    );
};
