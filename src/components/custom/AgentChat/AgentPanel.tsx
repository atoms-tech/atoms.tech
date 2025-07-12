'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import {
    Download,
    FileText,
    MessageSquare,
    Mic,
    MicOff,
    Send,
    Settings,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

// import jsPDF from 'jspdf'; // Commented out due to missing dependency
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/providers/user.provider';
import { cn } from '@/lib/utils';

import { useAgentStore } from './hooks/useAgentStore';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

interface AgentPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSettingsClick?: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
    isOpen,
    onToggle: _onToggle,
    onClose,
    onSettingsClick,
}) => {
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [showPinGuide, setShowPinGuide] = useState(false);

    // Resizable panel state
    const [isResizing, setIsResizing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        addMessage,
        clearMessages: _clearMessages,
        sendToN8n,
        n8nWebhookUrl,
        currentUserId,
        currentOrgId,
        currentProjectId,
        currentDocumentId,
        currentPinnedOrganizationId,
        currentUsername,
        setUserContext,
        panelWidth,
        setPanelWidth,
    } = useAgentStore();

    const { user, profile } = useUser();

    // Load saved panel width from localStorage
    useEffect(() => {
        const savedWidth = localStorage.getItem('agentPanelWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (width >= 300 && width <= 800) {
                setPanelWidth(width);
            }
        }
    }, [setPanelWidth]);

    // Save panel width to localStorage
    useEffect(() => {
        localStorage.setItem('agentPanelWidth', panelWidth.toString());
    }, [panelWidth]);

    // Resize handlers
    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            setIsResizing(true);
            setStartX(e.clientX);
            setStartWidth(panelWidth);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [panelWidth],
    );

    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = startX - e.clientX;
            const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
            setPanelWidth(newWidth);
        },
        [isResizing, startX, startWidth, setPanelWidth],
    );

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Mouse event listeners for resize
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // Set user context when component mounts
    useEffect(() => {
        if (user && profile) {
            setUserContext({
                userId: user.id,
                orgId: profile.current_organization_id || '',
                pinnedOrganizationId: profile.pinned_organization_id || '',
                username: profile.full_name || user.email?.split('@')[0] || '',
            });
        }
    }, [user, profile, setUserContext]);

    // Remove guide message if pinned organization is set
    useEffect(() => {
        if (showPinGuide && currentPinnedOrganizationId) {
            setShowPinGuide(false);
        }
    }, [currentPinnedOrganizationId, showPinGuide]);

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [message]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop =
                scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Web Speech API initialization
    useEffect(() => {
        if (
            'webkitSpeechRecognition' in window ||
            'SpeechRecognition' in window
        ) {
            const SpeechRecognition =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).SpeechRecognition ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US'; // Set to English

            recognitionRef.current.onstart = () => setIsListening(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionRef.current.onresult = (event: any) => {
                const lastResultIndex = event.results.length - 1;
                const transcript = event.results[lastResultIndex][0].transcript;
                if (event.results[lastResultIndex].isFinal) {
                    setMessage((prev) => prev + (prev ? ' ' : '') + transcript);
                }
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
            setSpeechSupported(true);
        } else {
            setSpeechSupported(false);
        }
    }, []);

    // Function to start/stop voice input
    const toggleVoiceInput = () => {
        if (!speechSupported) return;
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
            } catch {
                setIsListening(false);
            }
        }
    };

    const handleSendMessage = async () => {
        // Check for pinned organization before sending
        if (!currentPinnedOrganizationId) {
            setShowPinGuide(true);
            return;
        }
        if (!message.trim() || isLoading) return;
        const userMessage: Message = {
            id: Date.now().toString(),
            content: message.trim(),
            role: 'user',
            timestamp: new Date(),
            type: 'text',
        };
        addMessage(userMessage);
        const currentMessage = message;
        setMessage('');
        try {
            setIsLoading(true);
            let reply: string;
            // Send to N8N if configured, otherwise use local AI
            if (n8nWebhookUrl) {
                try {
                    const n8nResponse = await sendToN8n({
                        type: 'chat',
                        message: currentMessage,
                        conversationHistory: messages,
                        timestamp: new Date().toISOString(),
                    });
                    // Try different possible response fields from N8N
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const response = n8nResponse as any;
                    console.log(
                        'AgentPanel - N8N Response received:',
                        JSON.stringify(response, null, 2),
                    );

                    // Check each possible field and log what we find
                    console.log(
                        'AgentPanel - response.reply:',
                        `"${response.reply}"`,
                    );
                    console.log(
                        'AgentPanel - response.message:',
                        `"${response.message}"`,
                    );
                    console.log(
                        'AgentPanel - response.output:',
                        `"${response.output}"`,
                    );

                    reply =
                        (response.reply && response.reply.trim()) ||
                        (response.message && response.message.trim()) ||
                        (response.output && response.output.trim()) ||
                        (response.response && response.response.trim()) ||
                        (response.data &&
                            response.data.output &&
                            response.data.output.trim()) ||
                        (response.data &&
                            response.data.reply &&
                            response.data.reply.trim()) ||
                        (response.data &&
                            response.data.message &&
                            response.data.message.trim()) ||
                        (() => {
                            console.log(
                                'AgentPanel - No valid reply found, using fallback',
                            );
                            return 'N8N workflow completed but returned an empty response. Please check your N8N workflow configuration.';
                        })();
                } catch (n8nError) {
                    console.error('N8N error:', n8nError);
                    // If N8N fails, fall back to local AI
                    const response = await fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: currentMessage,
                            conversationHistory: messages.slice(-10),
                            context: {
                                userId: currentUserId,
                                orgId: currentOrgId,
                                projectId: currentProjectId,
                                documentId: currentDocumentId,
                            },
                        }),
                    });
                    const data = await response.json();
                    reply = data.reply;
                }
            } else {
                // Use local AI if N8N is not configured
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: currentMessage,
                        conversationHistory: messages.slice(-10),
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    reply = data.reply;
                } else {
                    throw new Error('API request failed');
                }
            }
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: reply,
                role: 'assistant',
                timestamp: new Date(),
                type: 'text',
            };
            addMessage(assistantMessage);
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content:
                    'Sorry, I encountered an error while processing your request. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
                type: 'text',
            };
            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const downloadChatHistory = () => {
        if (messages.length === 0) {
            return;
        }

        // Format messages as text
        const chatText = messages
            .map((msg) => {
                const timestamp = msg.timestamp.toLocaleString();
                const sender = msg.role === 'user' ? 'User' : 'AI Agent';
                const voiceIndicator = msg.type === 'voice' ? ' (Voice)' : '';

                // Clean markdown formatting for plain text
                const cleanContent = msg.content
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
                    .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
                    .replace(/`(.*?)`/g, '$1') // Remove code formatting
                    .replace(/#{1,6}\s?(.*)/g, '$1') // Remove headers
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
                    .replace(/^\s*[-*+]\s+/gm, '• ') // Convert markdown bullets to bullets
                    .replace(/^\s*\d+\.\s+/gm, (match, offset, string) => {
                        const lineStart = string.lastIndexOf('\n', offset) + 1;
                        const linePrefix = string.substring(lineStart, offset);
                        const _indentLevel = linePrefix.length;
                        const number =
                            string
                                .substring(offset, offset + match.length)
                                .match(/\d+/)?.[0] || '1';
                        return `${number}. `;
                    });

                return `[${timestamp}] ${sender}${voiceIndicator}:\n${cleanContent}\n`;
            })
            .join('\n');

        // Add header information
        const header = `Chat History Export
Generated: ${new Date().toLocaleString()}
Total Messages: ${messages.length}
${currentUsername ? `User: ${currentUsername}` : ''}

${'='.repeat(50)}

`;

        const fullContent = header + chatText;

        // Create and download file
        const blob = new Blob([fullContent], {
            type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Generate filename with timestamp
        const filename = `chat-history-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadChatHistoryPDF = () => {
        // PDF functionality removed due to missing jsPDF dependency
        alert(
            'PDF download functionality is currently disabled. Please use the TXT download option instead.',
        );
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}
            {/* Panel */}
            <div
                ref={panelRef}
                className={cn(
                    'fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl z-50 transition-all duration-300 ease-out flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full',
                )}
                style={{ width: `${panelWidth}px` }}
            >
                {/* Resize Handle */}
                <div
                    className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:w-2 transition-all z-10 group bg-zinc-300 dark:bg-zinc-600 hover:bg-blue-500 dark:hover:bg-blue-400"
                    onMouseDown={handleResizeStart}
                >
                    {/* Visual indicator for resize */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-400 dark:bg-zinc-500 rounded-full group-hover:bg-blue-600 dark:group-hover:bg-blue-300 transition-colors" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                        <div>
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Agent Chat
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                AI Assistant
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadChatHistory}
                            disabled={messages.length === 0}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Download as TXT"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadChatHistoryPDF}
                            disabled={messages.length === 0}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Download as PDF"
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                        {onSettingsClick && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSettingsClick}
                                className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 bg-zinc-50 dark:bg-zinc-900/50">
                    <ScrollAreaPrimitive.Viewport
                        ref={scrollAreaRef}
                        className="h-full w-full rounded-[inherit]"
                    >
                        <div className="p-4 space-y-4">
                            {showPinGuide && (
                                <div className="flex justify-center">
                                    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 p-3">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            Please pin an organization in your
                                            profile settings before using the
                                            agent.
                                        </p>
                                    </Card>
                                </div>
                            )}
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-500" />
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Start a conversation
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                        Type a message below to get started
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={msg.id}
                                        ref={
                                            idx === messages.length - 1
                                                ? lastMessageRef
                                                : undefined
                                        }
                                        className={cn(
                                            'flex',
                                            msg.role === 'user'
                                                ? 'justify-end'
                                                : 'justify-start',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'max-w-[80%] p-3 rounded-lg',
                                                msg.role === 'user'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
                                            )}
                                        >
                                            {msg.role === 'user' ? (
                                                <p className="text-sm">
                                                    {msg.content}
                                                </p>
                                            ) : (
                                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({
                                                                children,
                                                            }) => (
                                                                <p className="mb-2 last:mb-0 text-zinc-700 dark:text-zinc-300">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            strong: ({
                                                                children,
                                                            }) => (
                                                                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            code: ({
                                                                children,
                                                            }) => (
                                                                <code className="bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded text-xs">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            ul: ({
                                                                children,
                                                            }) => (
                                                                <ul className="list-disc ml-4 space-y-1">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({
                                                                children,
                                                            }) => (
                                                                <ol className="list-decimal ml-4 space-y-1">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                                {msg.timestamp.toLocaleTimeString()}
                                                {msg.type === 'voice' && ' 🎤'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500"></div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                Thinking...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollAreaPrimitive.Viewport>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                {...({ ref: textareaRef } as any)}
                                value={message}
                                onChange={(e) =>
                                    setMessage(
                                        (e.target as HTMLTextAreaElement).value,
                                    )
                                }
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message..."
                                className="min-h-[40px] max-h-[120px] resize-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
                                disabled={isLoading}
                            />
                            {speechSupported && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className={cn(
                                        'absolute right-2 top-2 h-6 w-6 rounded-md',
                                        isListening
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-700',
                                    )}
                                    onClick={toggleVoiceInput}
                                    disabled={isLoading}
                                >
                                    {isListening ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isLoading}
                            className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        {isListening
                            ? 'Listening...'
                            : 'Press Enter to send, Shift+Enter for new line'}
                    </p>
                </div>
            </div>
        </>
    );
};
