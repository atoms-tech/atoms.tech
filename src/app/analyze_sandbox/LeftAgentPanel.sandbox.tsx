'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import jsPDF from 'jspdf';
import { Download, FileText, Mic, MicOff, Send, X } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/lib/providers/user.provider';
import { cn } from '@/lib/utils';

import { useLeftAgentStore } from './useLeftAgentStore';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

export const LeftAgentPanel: React.FC = () => {
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // Minimal Web Speech typings to avoid any
    type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
    type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
    type WebSpeechRecognition = {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: (() => void) | null;
        onresult: ((event: RecognitionEvent) => void) | null;
        onerror: ((ev: unknown) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
    };
    const recognitionRef = useRef<WebSpeechRecognition | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // positioned the new chatbot to the left of existing chatbot
    const { isOpen: isRightPanelOpen, panelWidth: rightPanelWidth } = useAgentStore();

    const {
        isOpen,
        setIsOpen,
        panelWidth,
        setPanelWidth,
        addMessage,
        organizationMessages,
        currentPinnedOrganizationId,
        setUserContext,
        _hasHydrated,
        setHasHydrated,
        n8nWebhookUrl,
        sendToN8n,
        getQueueForCurrentOrg,
        addToQueue,
        popFromQueue,
        removeFromQueue,
        currentUserId,
        currentOrgId,
        currentProjectId,
        currentDocumentId,
        currentUsername,
    } = useLeftAgentStore();

    const messages = React.useMemo(() => {
        if (!currentPinnedOrganizationId) return [] as Message[];
        return organizationMessages[currentPinnedOrganizationId] || [];
    }, [currentPinnedOrganizationId, organizationMessages]);

    useEffect(() => {
        if (lastMessageRef.current)
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
        if (scrollAreaRef.current)
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }, [messages]);

    const { user, profile } = useUser();
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

    useEffect(() => {
        const savedWidth = localStorage.getItem('leftAgentPanelWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (width >= 300 && width <= 800) setPanelWidth(width);
        }
    }, [setPanelWidth]);
    useEffect(() => {
        localStorage.setItem('leftAgentPanelWidth', panelWidth.toString());
    }, [panelWidth]);

    const handleResizeStart = useCallback(
        (e: React.MouseEvent) => {
            const startX = e.clientX;
            const startW = panelWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            const onMove = (ev: MouseEvent) => {
                const deltaX = ev.clientX - startX;
                const newWidth = Math.max(300, Math.min(800, startW + deltaX));
                setPanelWidth(newWidth);
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
        [panelWidth, setPanelWidth],
    );

    useEffect(() => {
        if (!_hasHydrated) {
            const t = setTimeout(() => setHasHydrated(true), 100);
            return () => clearTimeout(t);
        }
    }, [_hasHydrated, setHasHydrated]);

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
        ) {
            const globalAny = window as unknown as {
                SpeechRecognition?: new () => WebSpeechRecognition;
                webkitSpeechRecognition?: new () => WebSpeechRecognition;
            };
            const SpeechRecognition =
                globalAny.SpeechRecognition || globalAny.webkitSpeechRecognition;
            recognitionRef.current = SpeechRecognition ? new SpeechRecognition() : null;
            const rec = recognitionRef.current;
            if (rec) {
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = 'en-US';
                rec.onstart = () => setIsListening(true);
                rec.onresult = (event: RecognitionEvent) => {
                    const lastResultIndex = event.results.length - 1;
                    const transcript = event.results[lastResultIndex][0].transcript;
                    if (event.results[lastResultIndex].isFinal) {
                        setMessage((prev) => prev + (prev ? ' ' : '') + transcript);
                    }
                };
                rec.onerror = () => setIsListening(false);
                rec.onend = () => setIsListening(false);
                setSpeechSupported(true);
            } else {
                setSpeechSupported(false);
            }
        } else {
            setSpeechSupported(false);
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!speechSupported) return;
        if (isListening) recognitionRef.current?.stop();
        else {
            try {
                recognitionRef.current?.start();
            } catch {
                setIsListening(false);
            }
        }
    };

    type N8nResponse = Partial<{
        reply: string;
        message: string;
        output: string;
        response: string;
        data: { output?: string; reply?: string; message?: string };
    }>;

    const sendToN8nWithRetry = async (
        data: Record<string, unknown>,
        maxRetries = 3,
        delayMs = 800,
    ): Promise<N8nResponse> => {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const n8nResponse = await sendToN8n(data as never);
                if (
                    n8nResponse &&
                    (n8nResponse as unknown as { status?: number }).status === 500
                ) {
                    throw new Error('500');
                }
                return n8nResponse;
            } catch (err: unknown) {
                attempt++;
                const maybeHttp = err as { response?: { status?: number } };
                if (
                    (err as Error)?.message === '500' ||
                    maybeHttp?.response?.status === 500
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
        if (!currentPinnedOrganizationId) return;
        const msg = (typeof messageToSend === 'string' ? messageToSend : message).trim();
        if (!msg) return;
        if (isLoading) {
            if (getQueueForCurrentOrg().length < 5) {
                addToQueue(msg);
                if (!messageToSend) setMessage('');
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
        if (!messageToSend) setMessage('');
        try {
            setIsLoading(true);
            let reply: string;
            if (n8nWebhookUrl) {
                try {
                    const llmFriendlyHistory = messages.slice(-5).map((m) => ({
                        role: m.role === 'assistant' ? 'you' : m.role,
                        content: m.content,
                    }));
                    const response = await sendToN8nWithRetry({
                        type: 'chat',
                        message: msg,
                        conversationHistory: llmFriendlyHistory,
                        timestamp: new Date().toISOString(),
                    });
                    reply =
                        response.reply?.trim() ||
                        response.message?.trim() ||
                        response.output?.trim() ||
                        response.response?.trim() ||
                        response.data?.output?.trim() ||
                        response.data?.reply?.trim() ||
                        response.data?.message?.trim() ||
                        'N8N workflow completed but returned an empty response. Please check your N8N workflow configuration.';
                } catch (n8nError) {
                    console.error('LeftAgent N8N error:', n8nError);
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
            const next = popFromQueue();
            if (next) {
                setTimeout(() => {
                    handleSendMessage(next);
                }, 100);
            } else {
                setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.focus();
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

    const queue = getQueueForCurrentOrg();

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className={cn(
                'fixed top-0 h-full bg-white dark:bg-zinc-900 shadow-xl transition-all duration-300 ease-out flex flex-col z-50 md:z-30 rounded-l-lg border-l-2 border-zinc-300 dark:border-zinc-600',
            )}
            style={{
                width: `${panelWidth}px`,
                right: isRightPanelOpen ? rightPanelWidth : 0,
            }}
        >
            {/* Resize Handle (right edge adjacent to AgentPanel) */}
            <div
                className="absolute right-0 top-0 w-[1px] h-full cursor-col-resize hover:w-1.5 transition-all z-10 group bg-border hover:bg-accent"
                onMouseDown={handleResizeStart}
            />

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
                        onClick={() => {
                            // TXT export similar to AgentPanel
                            if (messages.length === 0) return;
                            const chatText = messages
                                .map((msg) => {
                                    const timestamp = msg.timestamp.toLocaleString();
                                    const sender =
                                        msg.role === 'user' ? 'User' : 'AI Agent';
                                    const voiceIndicator =
                                        msg.type === 'voice' ? ' (Voice)' : '';
                                    const cleanContent = msg.content
                                        .replace(/\*\*(.*?)\*\*/g, '$1')
                                        .replace(/\*(.*?)\*/g, '$1')
                                        .replace(/`(.*?)`/g, '$1')
                                        .replace(/#{1,6}\s?(.*)/g, '$1')
                                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                                        .replace(/^\s*[-*+]\s+/gm, '\u2022 ')
                                        .replace(/^\s*\d+\.\s+/gm, (match) => {
                                            const number = match.match(/\d+/)?.[0] || '1';
                                            return `${number}. `;
                                        });
                                    return `[${timestamp}] ${sender}${voiceIndicator}:\n${cleanContent}\n`;
                                })
                                .join('\n');
                            const header = `Chat History Export\nGenerated: ${new Date().toLocaleString()}\nTotal Messages: ${messages.length}\n${currentUsername ? `User: ${currentUsername}` : ''}\n\n${'='.repeat(50)}\n\n`;
                            const fullContent = header + chatText;
                            const blob = new Blob([fullContent], {
                                type: 'text/plain;charset=utf-8',
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            const filename = `left-chat-history-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }}
                        className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Download as TXT"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (messages.length === 0) return;
                            const pdf = new jsPDF();
                            pdf.setFont('helvetica');
                            let y = 20;
                            const pageH = 280;
                            const margin = 20;
                            const lineH = 7;
                            pdf.setFontSize(16);
                            pdf.setFont('helvetica', 'bold');
                            pdf.text('Chat History Export', margin, y);
                            y += 15;
                            pdf.setFontSize(10);
                            pdf.setFont('helvetica', 'normal');
                            pdf.text(
                                `Generated: ${new Date().toLocaleString()}`,
                                margin,
                                y,
                            );
                            y += 8;
                            pdf.text(`Total Messages: ${messages.length}`, margin, y);
                            y += 8;
                            if (currentUsername) {
                                pdf.text(`User: ${currentUsername}`, margin, y);
                                y += 8;
                            }
                            y += 10;
                            pdf.line(margin, y, 190, y);
                            y += 10;
                            messages.forEach((msg) => {
                                const timestamp = msg.timestamp.toLocaleString();
                                const sender = msg.role === 'user' ? 'User' : 'AI Agent';
                                if (y > pageH) {
                                    pdf.addPage();
                                    y = 20;
                                }
                                pdf.setFontSize(9);
                                pdf.setFont('helvetica', 'bold');
                                pdf.text(`[${timestamp}] ${sender}:`, margin, y);
                                y += 6;
                                const cleanContent = msg.content
                                    .replace(/\*\*(.*?)\*\*/g, '$1')
                                    .replace(/\*(.*?)\*/g, '$1')
                                    .replace(/`(.*?)`/g, '$1')
                                    .replace(/#{1,6}\s?(.*)/g, '$1')
                                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                                    .replace(/^\s*[-*+]\s+/gm, '\u2022 ')
                                    .replace(/^\s*\d+\.\s+/gm, (match) => {
                                        const number = match.match(/\d+/)?.[0] || '1';
                                        return `${number}. `;
                                    });
                                const lines = pdf.splitTextToSize(cleanContent, 170);
                                pdf.setFont('helvetica', 'normal');
                                lines.forEach((line: string) => {
                                    if (y > pageH) {
                                        pdf.addPage();
                                        y = 20;
                                    }
                                    pdf.text(line, margin, y);
                                    y += lineH;
                                });
                                y += 5;
                            });
                            const filename = `left-chat-history-${new Date().toISOString().split('T')[0]}.pdf`;
                            pdf.save(filename);
                        }}
                        className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Download as PDF"
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
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
                        {!_hasHydrated ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 mx-auto mb-3" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Loading conversation...
                                </p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-8">
                                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 p-3">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Click &quot;Analyze with AI&quot; to view results
                                        here.
                                    </p>
                                </Card>
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
                                                <ReactMarkdown>
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
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-zinc-300 dark:border-white border-t-transparent" />
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
                        {(() => {
                            const TextareaWithRef =
                                Textarea as unknown as React.ForwardRefExoticComponent<
                                    React.ComponentProps<typeof Textarea> &
                                        React.RefAttributes<HTMLTextAreaElement>
                                >;
                            return (
                                <TextareaWithRef
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) =>
                                        setMessage(
                                            (e.target as HTMLTextAreaElement).value,
                                        )
                                    }
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="min-h-[40px] max-h-[120px] resize-none border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg text-lg"
                                    disabled={queue.length >= 5}
                                />
                            );
                        })()}
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

            {queue.length > 0 && (
                <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Queued Messages ({queue.length}/5):
                    </p>
                    <ul className="text-xs text-zinc-700 dark:text-zinc-200 space-y-1">
                        {queue.map((q, i) => (
                            <li
                                key={i}
                                className="flex items-center justify-between group"
                            >
                                <span className="flex-1 truncate">
                                    {i + 1}. {q}
                                </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 ml-2 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                                    onClick={() => removeFromQueue(i)}
                                    title="Cancel this message"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LeftAgentPanel;
