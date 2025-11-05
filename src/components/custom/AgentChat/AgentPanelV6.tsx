/**
 * AgentPanel V6 - Using AI SDK 6
 * 
 * Simplified chat panel using useChat hook from AI SDK 6
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/providers/user.provider';
import { cn } from '@/lib/utils';
import { DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';

import { useAgentStore } from './hooks/useAgentStore';
import { AgentPanelHeader } from './AgentPanelHeader';
import { ChatHistoryPage } from './ChatHistoryPage';
import { ModelSelector } from './ModelSelector';

interface AgentPanelV6Props {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSettingsClick?: () => void;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
}

export const AgentPanelV6: React.FC<AgentPanelV6Props> = ({
    isOpen,
    onClose,
    onSettingsClick,
    selectedModel = DEFAULT_MODEL,
    onModelChange,
}) => {
    const { user } = useUser();
    const {
        currentOrgId,
        currentPinnedOrganizationId,
        currentProjectId,
        currentDocumentId,
    } = useAgentStore();

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // View state: 'chat' | 'history'
    const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat');

    // Use AI SDK 6 useChat hook
    const [input, setInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        messages,
        sendMessage,
        error,
    } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                model: selectedModel,
                metadata: {
                    organization_id: currentOrgId,
                    session_id: currentPinnedOrganizationId,
                    user_id: user?.id,
                    project_id: currentProjectId,
                    document_id: currentDocumentId,
                },
            },
        }),
        onError: (error) => {
            console.error('Chat error:', error);
            setIsSubmitting(false);
        },
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector(
                '[data-radix-scroll-area-viewport]',
            );
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    // Focus textarea when panel opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    // Handle new chat
    const handleNewChat = () => {
        // TODO: Clear messages and start new chat
        console.log('New chat');
    };

    // Handle download
    const handleDownloadPDF = () => {
        // TODO: Export chat as PDF
        console.log('Download PDF');
    };

    const handleDownloadTXT = () => {
        // TODO: Export chat as TXT
        console.log('Download TXT');
    };

    // Handle chat history
    const handleChatHistory = () => {
        setCurrentView('history');
    };

    // Handle back to chat
    const handleBackToChat = () => {
        setCurrentView('chat');
    };

    // Handle select session
    const handleSelectSession = (sessionId: string) => {
        // TODO: Load session messages
        console.log('Load session:', sessionId);
        setCurrentView('chat');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-screen w-96 bg-background border-l shadow-lg flex flex-col z-50">
            {/* Header */}
            <AgentPanelHeader
                onNewChat={handleNewChat}
                onDownloadPDF={handleDownloadPDF}
                onDownloadTXT={handleDownloadTXT}
                onChatHistory={handleChatHistory}
                onSettings={onSettingsClick || (() => {})}
                onClose={onClose}
            />

            {/* Content - Switch between chat and history */}
            {currentView === 'chat' ? (
                <>
                    {/* Messages */}
                    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground py-8">
                                    <p>Start a conversation with the AI assistant</p>
                                </div>
                            )}

                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        'flex',
                                        message.role === 'user' ? 'justify-end' : 'justify-start',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[80%] rounded-lg p-3',
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted',
                                        )}
                                    >
                                        {message.parts.map((part, index) => {
                                            if (part.type === 'text') {
                                                return (
                                                    <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                                                        <ReactMarkdown>
                                                            {part.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            ))}

                            {isSubmitting && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Error display */}
                    {error && (
                        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
                            Error: {error.message}
                        </div>
                    )}

                    {/* Input with Model Selector */}
                    <div className="border-t">
                        {/* Model Selector Bar */}
                        <div className="px-4 py-2 border-b bg-muted/30">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={onModelChange || (() => {})}
                            />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (input.trim() && !isSubmitting) {
                                setIsSubmitting(true);
                                try {
                                    await sendMessage({ text: input });
                                    setInput('');
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }
                        }} className="p-4">
                            <div className="flex gap-2">
                                <Textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="min-h-[60px] resize-none"
                                    disabled={isSubmitting}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (input.trim() && !isSubmitting) {
                                                setIsSubmitting(true);
                                                try {
                                                    await sendMessage({ text: input });
                                                    setInput('');
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }
                                        }
                                    }}
                                />
                                <Button type="submit" size="icon" disabled={isSubmitting || !input.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                /* Chat History View */
                <ChatHistoryPage
                    onBack={handleBackToChat}
                    onSelectSession={handleSelectSession}
                />
            )}
        </div>
    );
};

