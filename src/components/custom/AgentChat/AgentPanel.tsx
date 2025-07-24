'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import jsPDF from 'jspdf';
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
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/providers/user.provider';
import { cn } from '@/lib/utils';

import { debugAgentStore, useAgentStore } from './hooks/useAgentStore';

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
        _hasHydrated,
        setHasHydrated,
        organizationMessages,
        // queue logic
        addToQueue,
        popFromQueue,
        getQueueForCurrentOrg,
    } = useAgentStore();

    // Get messages for current organization (reactive to currentPinnedOrganizationId changes)
    const messages = React.useMemo(() => {
        if (!currentPinnedOrganizationId) {
            console.log('AgentPanel - No pinned organization ID available');
            return [];
        }
        const orgMessages = organizationMessages[currentPinnedOrganizationId] || [];
        console.log(
            `AgentPanel - Loading ${orgMessages.length} messages for organization ${currentPinnedOrganizationId}`,
        );
        return orgMessages;
    }, [currentPinnedOrganizationId, organizationMessages]);

    // Debug: Log when pinned organization changes
    useEffect(() => {
        console.log(
            'AgentPanel - Pinned organization changed to:',
            currentPinnedOrganizationId,
        );
    }, [currentPinnedOrganizationId]);

    // Auto-scroll to bottom when messages change or organization changes
    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentPinnedOrganizationId]);

    // Auto-focus textarea when new assistant message is added
    useEffect(() => {
        if (messages.length > 0 && !isLoading) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                // Small delay to ensure the message is rendered
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                    }
                }, 200);
            }
        }
    }, [messages, isLoading]);

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

    // Ensure hydration is completed on mount
    useEffect(() => {
        console.log('AgentPanel - Hydration status on mount:', _hasHydrated);
        console.log('AgentPanel - Messages on mount:', messages.length);

        // Debug localStorage state
        debugAgentStore();

        // Force hydration check after component mounts
        const timer = setTimeout(() => {
            if (!_hasHydrated) {
                console.log('AgentPanel - Forcing hydration completion after timeout');
                setHasHydrated(true);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [_hasHydrated, setHasHydrated, messages.length]);

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
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // This useEffect is now merged with the one above

    // Web Speech API initialization
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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

    const sendToN8nWithRetry = async (
        data: Record<string, unknown>,
        maxRetries = 3,
        delayMs = 800,
    ): Promise<Record<string, unknown>> => {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const n8nResponse = await sendToN8n(data as any);
                // If response contains error code 500, throw to trigger retry
                if (
                    n8nResponse &&
                    (n8nResponse as Record<string, unknown>).status === 500
                ) {
                    throw new Error('500');
                }
                return n8nResponse;
            } catch (err: unknown) {
                attempt++;
                // Only retry on 500 error
                if (
                    (err as Error)?.message === '500' ||
                    ((err as Record<string, unknown>)?.response &&
                        (
                            (err as Record<string, unknown>).response as Record<
                                string,
                                unknown
                            >
                        )?.status === 500)
                ) {
                    if (attempt < maxRetries) {
                        await new Promise((res) => setTimeout(res, delayMs * attempt));
                        continue;
                    }
                }
                throw err;
            }
        }
        throw new Error('N8N request failed after retries');
    };

    const handleSendMessage = async (messageToSend?: string) => {
        if (!currentPinnedOrganizationId) {
            setShowPinGuide(true);
            return;
        }
        const msg = (typeof messageToSend === 'string' ? messageToSend : message).trim();
        if (!msg) return;
        if (isLoading) {
            // If already thinking, queue the message if queue < 5
            if (getQueueForCurrentOrg().length < 5) {
                addToQueue(msg);
                if (!messageToSend) setMessage(''); // Only clear if user sent the message
            }
            return;
        }
        const userMessage: Message = {
            id: Date.now().toString(),
            content: msg,
            role: 'user',
            timestamp: new Date(),
            type: 'text',
        };
        addMessage(userMessage);
        if (!messageToSend) setMessage(''); // Only clear if user sent the message
        try {
            setIsLoading(true);
            let reply: string;
            // Send to N8N if configured, otherwise use local AI
            if (n8nWebhookUrl) {
                try {
                    // Convert messages to LLM-friendly format (role and content only)
                    const llmFriendlyHistory = messages.slice(-5).map((msg) => ({
                        role: msg.role === 'assistant' ? 'you' : msg.role,
                        content: msg.content,
                    }));

                    const n8nResponse = await sendToN8nWithRetry({
                        type: 'chat',
                        message: msg,
                        conversationHistory: llmFriendlyHistory,
                        timestamp: new Date().toISOString(),
                    });
                    // Try different possible response fields from N8N
                    const response = n8nResponse as Record<string, unknown>;
                    console.log(
                        'AgentPanel - N8N Response received:',
                        JSON.stringify(response, null, 2),
                    );

                    // Check each possible field and log what we find
                    console.log('AgentPanel - response.reply:', `"${response.reply}"`);
                    console.log(
                        'AgentPanel - response.message:',
                        `"${response.message}"`,
                    );
                    console.log('AgentPanel - response.output:', `"${response.output}"`);

                    reply = ((response.reply && (response.reply as string).trim()) ||
                        (response.message && (response.message as string).trim()) ||
                        (response.output && (response.output as string).trim()) ||
                        (response.response && (response.response as string).trim()) ||
                        (response.data &&
                            (response.data as Record<string, unknown>).output &&
                            (
                                (response.data as Record<string, unknown>)
                                    .output as string
                            ).trim()) ||
                        (response.data &&
                            (response.data as Record<string, unknown>).reply &&
                            (
                                (response.data as Record<string, unknown>).reply as string
                            ).trim()) ||
                        (response.data &&
                            (response.data as Record<string, unknown>).message &&
                            (
                                (response.data as Record<string, unknown>)
                                    .message as string
                            ).trim()) ||
                        (() => {
                            console.log(
                                'AgentPanel - No valid reply found, using fallback',
                            );
                            return 'N8N workflow completed but returned an empty response. Please check your N8N workflow configuration.';
                        })()) as string;
                } catch (n8nError) {
                    console.error('N8N error:', n8nError);
                    // If N8N fails, fall back to local AI
                    const response = await fetch('/api/ai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: msg,
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
                    reply = data.reply as string;
                }
            } else {
                // Use local AI if N8N is not configured
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        conversationHistory: messages.slice(-10),
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    reply = data.reply as string;
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
            console.log(
                'AgentPanel - Adding assistant message:',
                assistantMessage.content.substring(0, 100) + '...',
            );
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
            // If queue has messages, send next automatically
            const next = popFromQueue();
            if (next) {
                setTimeout(() => {
                    handleSendMessage(next);
                }, 100);
            } else {
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                    }
                }, 100);
            }
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
        if (messages.length === 0) {
            return;
        }

        // Create new PDF document
        const pdf = new jsPDF();

        // Set font for Korean characters
        pdf.setFont('helvetica');

        // Set initial position
        let yPosition = 20;
        const pageHeight = 280;
        const margin = 20;
        const lineHeight = 7;

        // Add title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Chat History Export', margin, yPosition);
        yPosition += 15;

        // Add metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
        yPosition += 8;
        pdf.text(`Total Messages: ${messages.length}`, margin, yPosition);
        yPosition += 8;
        if (currentUsername) {
            pdf.text(`User: ${currentUsername}`, margin, yPosition);
            yPosition += 8;
        }
        yPosition += 10;

        // Add separator line
        pdf.line(margin, yPosition, 190, yPosition);
        yPosition += 10;

        // Process messages
        messages.forEach((msg, _index) => {
            const timestamp = msg.timestamp.toLocaleString();
            const sender = msg.role === 'user' ? 'User' : 'AI Agent';
            const voiceIndicator = msg.type === 'voice' ? ' (Voice)' : '';

            // Check if we need a new page
            if (yPosition > pageHeight) {
                pdf.addPage();
                yPosition = 20;
            }

            // Add message header
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`[${timestamp}] ${sender}${voiceIndicator}:`, margin, yPosition);
            yPosition += 6;

            // Clean markdown formatting for plain text
            const cleanContent = msg.content
                .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
                .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
                .replace(/`(.*?)`/g, '$1') // Remove code formatting
                .replace(/#{1,6}\s?(.*)/g, '$1') // Remove headers
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
                .replace(/^\s*[-*+]\s+/gm, '• ') // Convert markdown bullets to bullets
                .replace(/^\s*\d+\.\s+/gm, (match) => {
                    const number = match.match(/\d+/)?.[0] || '1';
                    return `${number}. `;
                });

            // Split content into lines that fit the page width
            const maxWidth = 170; // 190 - 20 (margin)
            const lines = pdf.splitTextToSize(cleanContent, maxWidth);

            // Add content lines
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            lines.forEach((line: string) => {
                // Check if we need a new page
                if (yPosition > pageHeight) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, margin, yPosition);
                yPosition += lineHeight;
            });

            // Add space between messages
            yPosition += 5;
        });

        // Save the PDF
        const filename = `chat-history-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);
    };

    const queue = getQueueForCurrentOrg();

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
                    'fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 shadow-xl z-50 transition-all duration-300 ease-out flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full',
                )}
                style={{ width: `${panelWidth}px` }}
            >
                {/* Resize Handle */}
                <div
                    className="absolute left-0 top-0 w-[3px] h-full cursor-col-resize hover:w-1.5 transition-all z-10 group bg-border hover:bg-accent"
                    onMouseDown={handleResizeStart}
                >
                    {/* Visual indicator for resize */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-border/60 rounded-full group-hover:bg-accent/80 transition-colors" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <Image
                                src="/atom.png"
                                alt="Atoms logo"
                                width={32}
                                height={32}
                                className="object-contain dark:invert"
                            />
                        </div>
                        <div>
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-wide">
                                ATOMS
                            </h2>
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
                                            Please pin an organization in your profile
                                            settings before using the agent.
                                        </p>
                                    </Card>
                                </div>
                            )}
                            {!_hasHydrated ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 mx-auto mb-3"></div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        Loading conversation...
                                    </p>
                                </div>
                            ) : messages.length === 0 ? (
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
                                                : 'justify-center',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'p-3 rounded-lg break-words',
                                                msg.role === 'user'
                                                    ? 'max-w-[85%] bg-zinc-600 text-white dark:bg-purple-600 dark:text-white'
                                                    : 'max-w-[95%] bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600',
                                            )}
                                        >
                                            {msg.role === 'user' ? (
                                                <p className="text-base">{msg.content}</p>
                                            ) : (
                                                <div className="text-base w-full overflow-hidden">
                                                    {/* ATOMS name and character for the latest assistant message */}
                                                    {idx === messages.length - 1 && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 flex items-center justify-center">
                                                                <Image
                                                                    src="/atom.png"
                                                                    alt="Atoms logo"
                                                                    width={24}
                                                                    height={24}
                                                                    className="object-contain dark:invert"
                                                                />
                                                            </div>
                                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                                ATOMS
                                                            </span>
                                                        </div>
                                                    )}
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => (
                                                                <p className="mb-2 last:mb-0 text-zinc-700 dark:text-zinc-300 break-words whitespace-pre-wrap text-base">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            em: ({ children }) => (
                                                                <em className="italic text-zinc-700 dark:text-zinc-300">
                                                                    {children}
                                                                </em>
                                                            ),
                                                            code: ({ children }) => (
                                                                <code className="bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded text-sm font-mono text-zinc-800 dark:text-zinc-200 break-all">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            pre: ({ children }) => (
                                                                <pre className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto mb-2 break-words whitespace-pre-wrap">
                                                                    {children}
                                                                </pre>
                                                            ),
                                                            ul: ({ children }) => (
                                                                <ul className="list-disc ml-4 space-y-1 mb-2">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({ children }) => (
                                                                <ol className="list-decimal ml-4 space-y-1 mb-2">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({ children }) => (
                                                                <li className="text-zinc-700 dark:text-zinc-300 break-words text-base">
                                                                    {children}
                                                                </li>
                                                            ),
                                                            blockquote: ({
                                                                children,
                                                            }) => (
                                                                <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-600 dark:text-zinc-400 mb-2 break-words text-base">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                            h1: ({ children }) => (
                                                                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-4 first:mt-0">
                                                                    {children}
                                                                </h1>
                                                            ),
                                                            h2: ({ children }) => (
                                                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h2>
                                                            ),
                                                            h3: ({ children }) => (
                                                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h3>
                                                            ),
                                                            h4: ({ children }) => (
                                                                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h4>
                                                            ),
                                                            h5: ({ children }) => (
                                                                <h5 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h5>
                                                            ),
                                                            h6: ({ children }) => (
                                                                <h6 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                                                                    {children}
                                                                </h6>
                                                            ),
                                                            a: ({ children, href }) => (
                                                                <a
                                                                    href={href}
                                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),
                                                            table: ({ children }) => (
                                                                <div className="overflow-x-auto mb-2 max-w-full">
                                                                    <table className="min-w-full border border-zinc-300 dark:border-zinc-600 table-fixed">
                                                                        {children}
                                                                    </table>
                                                                </div>
                                                            ),
                                                            th: ({ children }) => (
                                                                <th className="border border-zinc-300 dark:border-zinc-600 px-2 py-1 bg-zinc-50 dark:bg-zinc-700 text-left font-semibold text-zinc-900 dark:text-zinc-100 break-words text-sm">
                                                                    {children}
                                                                </th>
                                                            ),
                                                            td: ({ children }) => (
                                                                <td className="border border-zinc-300 dark:border-zinc-600 px-2 py-1 text-zinc-700 dark:text-zinc-300 break-words text-sm">
                                                                    {children}
                                                                </td>
                                                            ),
                                                            hr: () => (
                                                                <hr className="border-t border-zinc-300 dark:border-zinc-600 my-4" />
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                            {msg.type === 'voice' && (
                                                <p
                                                    className={cn(
                                                        'text-xs mt-2',
                                                        msg.role === 'user'
                                                            ? 'text-zinc-200 dark:text-zinc-200'
                                                            : 'text-zinc-500 dark:text-zinc-300',
                                                    )}
                                                >
                                                    🎤
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-zinc-300 dark:border-white border-t-transparent"></div>
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
                <div className="px-8 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex gap-2 items-stretch">
                        <div className="flex-1 relative">
                            <Textarea
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                {...({ ref: textareaRef } as any)}
                                value={message}
                                onChange={(e) =>
                                    setMessage((e.target as HTMLTextAreaElement).value)
                                }
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message..."
                                // Thicker border for more visible input box
                                className="min-h-[40px] max-h-[120px] resize-none border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg text-lg"
                                disabled={queue.length >= 5}
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
                                    disabled={queue.length >= 5}
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
                            onClick={() => handleSendMessage()}
                            disabled={!message.trim() || queue.length >= 5}
                            // Make button height match Textarea exactly
                            className="h-auto py-2 border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-600 text-white hover:bg-zinc-700 dark:bg-purple-600 dark:text-white dark:hover:bg-purple-700 rounded-lg flex items-center justify-center"
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
                {/* Add minimal UI for queued messages */}
                {queue.length > 0 && (
                    <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            Queued Messages ({queue.length}/5):
                        </p>
                        <ul className="text-xs text-zinc-700 dark:text-zinc-200 list-decimal ml-4">
                            {queue.map((q, i) => (
                                <li key={i}>{q}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
};
