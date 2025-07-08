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
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Badge } from '@/components/ui/badge';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        addMessage,
        clearMessages: _clearMessages,
        isConnected,
        connectionStatus,
        sendToN8n,
        n8nWebhookUrl,
        currentUserId,
        currentOrgId,
        currentProjectId,
        currentDocumentId,
        currentPinnedOrganizationId,
        currentUsername,
        setUserContext,
    } = useAgentStore();

    const { user, profile } = useUser();

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    reply =
                        response.reply ||
                        response.message ||
                        response.output ||
                        response.response ||
                        (response.data && response.data.output) ||
                        (response.data && response.data.reply) ||
                        (response.data && response.data.message) ||
                        JSON.stringify(n8nResponse) ||
                        'N8N workflow completed successfully.';
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
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}
            {/* Panel */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 transition-all duration-300 ease-out flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full',
                    'w-[450px] md:w-[500px] lg:w-[550px]',
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                                AI Agent
                            </h2>
                            <Badge
                                variant={isConnected ? 'default' : 'secondary'}
                                className={cn(
                                    'text-xs font-medium px-2 py-1 rounded-full',
                                    isConnected
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                                )}
                            >
                                {connectionStatus}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={downloadChatHistory}
                            disabled={messages.length === 0}
                            className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Download as TXT"
                        >
                            <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={downloadChatHistoryPDF}
                            disabled={messages.length === 0}
                            className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Download as PDF"
                        >
                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        {onSettingsClick && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSettingsClick}
                                className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-9 w-9 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <X className="h-4 w-4 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400" />
                        </Button>
                    </div>
                </div>
                {/* Messages */}
                <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <ScrollAreaPrimitive.Viewport
                        ref={scrollAreaRef}
                        className="h-full w-full rounded-[inherit]"
                    >
                        <div className="space-y-6">
                            {showPinGuide && (
                                <div className="flex justify-center">
                                    <Card className="bg-yellow-100 text-yellow-900 p-3 border border-yellow-300">
                                        <p className="text-sm">
                                            Please pin an organization in your
                                            profile settings before using the
                                            agent. After pinning, try sending
                                            your message again.
                                        </p>
                                    </Card>
                                </div>
                            )}
                            {messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">
                                        Start a conversation with the AI agent
                                    </p>
                                    <p className="text-xs mt-1">
                                        Type a message or use voice input
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
                                            'flex gap-3',
                                            msg.role === 'user'
                                                ? 'justify-end'
                                                : 'justify-start',
                                        )}
                                    >
                                        <Card
                                            className={cn(
                                                'max-w-[85%] p-4 shadow-lg border-0 transition-all duration-200',
                                                msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md ml-auto'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-700',
                                            )}
                                        >
                                            {msg.role === 'user' ? (
                                                // User message - clean and simple
                                                <div className="text-sm leading-relaxed font-medium">
                                                    <p className="whitespace-pre-wrap">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                            ) : (
                                                // Agent message - professional and readable
                                                <div className="text-sm font-mono prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({
                                                                children,
                                                            }) => (
                                                                <p className="mb-3 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            strong: ({
                                                                children,
                                                            }) => (
                                                                <strong className="font-bold text-slate-900 dark:text-slate-100">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            em: ({
                                                                children,
                                                            }) => (
                                                                <em className="italic text-slate-600 dark:text-slate-400">
                                                                    {children}
                                                                </em>
                                                            ),
                                                            ul: ({
                                                                children,
                                                            }) => (
                                                                <ul className="list-disc ml-5 mb-3 space-y-1 text-slate-700 dark:text-slate-300">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({
                                                                children,
                                                            }) => (
                                                                <ol className="list-decimal ml-5 mb-3 space-y-1 text-slate-700 dark:text-slate-300">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({
                                                                children,
                                                            }) => (
                                                                <li className="mb-1 leading-relaxed">
                                                                    {children}
                                                                </li>
                                                            ),
                                                            code: ({
                                                                children,
                                                            }) => (
                                                                <code className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md text-xs font-mono">
                                                                    {children}
                                                                </code>
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                            <p
                                                className={cn(
                                                    'text-xs mt-3 pt-3 border-t font-medium',
                                                    msg.role === 'user'
                                                        ? 'text-blue-100 border-blue-400/30'
                                                        : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
                                                )}
                                            >
                                                {msg.timestamp.toLocaleTimeString()}
                                                {msg.type === 'voice' && ' 🎤'}
                                            </p>
                                        </Card>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-700 p-4 max-w-[85%]">
                                        <div className="flex items-center gap-3 font-mono">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400"></div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                AI is thinking...
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </ScrollAreaPrimitive.Viewport>
                </ScrollArea>
                {/* Input Area */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <div className="flex gap-3">
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
                                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                                className="min-h-[48px] max-h-[200px] resize-none pr-10 rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                disabled={isLoading}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant={isListening ? 'destructive' : 'ghost'}
                                className={cn(
                                    'absolute right-6 top-2 h-8 w-8 rounded-lg transition-colors',
                                    isListening
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-600',
                                )}
                                onClick={toggleVoiceInput}
                                disabled={isLoading || !speechSupported}
                            >
                                {isListening ? (
                                    <MicOff className="h-4 w-4" />
                                ) : (
                                    <Mic className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                )}
                            </Button>
                        </div>
                        <Button
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isLoading}
                            className="h-[48px] px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 px-1">
                        {speechSupported
                            ? isListening
                                ? '🎤 Listening... Click the microphone again to stop.'
                                : '💬 Type or click the microphone for voice input.'
                            : '⚠️ Voice input not supported in this browser.'}
                    </p>
                </div>
            </div>
        </>
    );
};
