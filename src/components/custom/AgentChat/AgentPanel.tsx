'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import jsPDF from 'jspdf';
import {
    Download,
    FileText,
    MessageSquare,
    PanelLeft,
    Maximize2,
    Minimize2,
    Mic,
    MicOff,
    Send,
    Settings,
    Trash,
    X,
    Folder,
    FolderOpen,
    ChevronDown,
    ChevronRight,
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
    category?: 'chat' | 'analysis' | 'system'; // [New Added]
    threadId?: string; // [New Added]
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
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [analysisExpanded, setAnalysisExpanded] = useState(true);
    // Tabs removed; unified chat view

    // Resizable panel state
    const [isResizing, setIsResizing] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startWidth, setStartWidth] = useState(0);
    // Resizable sidebar state
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [sidebarStartX, setSidebarStartX] = useState(0);
    const [sidebarStartWidth, setSidebarStartWidth] = useState(260);
    const [sidebarWidth, setSidebarWidth] = useState(260);

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
        removeFromQueue,
    // threads [New Added]
        listThreadsForCurrentOrg,
        newThread,
        setActiveThread,
    // getActiveThreadId, // removed unused selector
        deleteThread,
    } = useAgentStore();

    // Track active thread reactively to avoid stale reads from a selector function
    const activeThreadId = useAgentStore((s) =>
        s.currentPinnedOrganizationId
            ? s.currentThreadIdByOrg[s.currentPinnedOrganizationId]
            : undefined,
    );

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
        // Unified view: use active thread; include undefined or 'chat' categories
        return orgMessages.filter(
            (m) => (!m.category || m.category === 'chat') && m.threadId === activeThreadId,
        );
    }, [currentPinnedOrganizationId, organizationMessages, activeThreadId]);

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

    // Tabs removed; no need to listen for tab-switch events

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
        const savedSidebarWidth = localStorage.getItem('agentSidebarWidth');
        if (savedSidebarWidth) {
            const w = parseInt(savedSidebarWidth, 10);
            if (w >= 220 && w <= 420) setSidebarWidth(w);
        }
        const savedShowSidebar = localStorage.getItem('agentShowSidebar');
        if (savedShowSidebar === 'false') setShowSidebar(false);
        const savedFull = localStorage.getItem('agentPanelFull');
        if (savedFull === 'true') setIsFullScreen(true);
        const savedAnalysisExpanded = localStorage.getItem('agentAnalysisExpanded');
        if (savedAnalysisExpanded === 'false') setAnalysisExpanded(false);
    }, [setPanelWidth]);

    // Save panel width to localStorage
    useEffect(() => {
        localStorage.setItem('agentPanelWidth', panelWidth.toString());
    }, [panelWidth]);

    // Save sidebar width to localStorage
    useEffect(() => {
        localStorage.setItem('agentSidebarWidth', sidebarWidth.toString());
    }, [sidebarWidth]);

    // Save fullscreen to localStorage
    useEffect(() => {
        localStorage.setItem('agentPanelFull', isFullScreen ? 'true' : 'false');
    }, [isFullScreen]);

    // Save sidebar visibility
    useEffect(() => {
        localStorage.setItem('agentShowSidebar', showSidebar ? 'true' : 'false');
    }, [showSidebar]);

    // Save analysis folder expand state
    useEffect(() => {
        localStorage.setItem('agentAnalysisExpanded', analysisExpanded ? 'true' : 'false');
    }, [analysisExpanded]);
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

    // Sidebar resize handlers
    const handleSidebarResizeStart = useCallback(
        (e: React.MouseEvent) => {
            setIsResizingSidebar(true);
            setSidebarStartX(e.clientX);
            setSidebarStartWidth(sidebarWidth);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [sidebarWidth],
    );

    const handleSidebarResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizingSidebar) return;
            const deltaX = e.clientX - sidebarStartX;
            const newWidth = Math.max(220, Math.min(420, sidebarStartWidth + deltaX));
            setSidebarWidth(newWidth);
        },
        [isResizingSidebar, sidebarStartX, sidebarStartWidth],
    );

    const handleSidebarResizeEnd = useCallback(() => {
        setIsResizingSidebar(false);
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

    // Mouse event listeners for sidebar resize
    useEffect(() => {
        if (isResizingSidebar) {
            document.addEventListener('mousemove', handleSidebarResizeMove);
            document.addEventListener('mouseup', handleSidebarResizeEnd);
            return () => {
                document.removeEventListener('mousemove', handleSidebarResizeMove);
                document.removeEventListener('mouseup', handleSidebarResizeEnd);
            };
        }
    }, [isResizingSidebar, handleSidebarResizeMove, handleSidebarResizeEnd]);

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
            category: 'chat',
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
                category: 'chat',
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

    // Shared Markdown component mapping to keep consistent styling
    const markdownComponents = React.useMemo(
        () => ({
            p: ({ children }: { children: React.ReactNode }) => (
                <p className="mb-2 last:mb-0 text-zinc-700 dark:text-zinc-300 break-words whitespace-pre-wrap text-base">
                    {children}
                </p>
            ),
            strong: ({ children }: { children: React.ReactNode }) => (
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {children}
                </strong>
            ),
            em: ({ children }: { children: React.ReactNode }) => (
                <em className="italic text-zinc-700 dark:text-zinc-300">{children}</em>
            ),
            code: ({ children }: { children: React.ReactNode }) => (
                <code className="bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 rounded text-sm font-mono text-zinc-800 dark:text-zinc-200 break-all">
                    {children}
                </code>
            ),
            pre: ({ children }: { children: React.ReactNode }) => (
                <pre className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto mb-2 break-words whitespace-pre-wrap">
                    {children}
                </pre>
            ),
            ul: ({ children }: { children: React.ReactNode }) => (
                <ul className="list-disc ml-4 space-y-1 mb-2">{children}</ul>
            ),
            ol: ({ children }: { children: React.ReactNode }) => (
                <ol className="list-decimal ml-4 space-y-1 mb-2">{children}</ol>
            ),
            li: ({ children }: { children: React.ReactNode }) => (
                <li className="text-zinc-700 dark:text-zinc-300 break-words text-base">
                    {children}
                </li>
            ),
            blockquote: ({ children }: { children: React.ReactNode }) => (
                <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-600 dark:text-zinc-400 mb-2 break-words text-base">
                    {children}
                </blockquote>
            ),
            h1: ({ children }: { children: React.ReactNode }) => (
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-4 first:mt-0">
                    {children}
                </h1>
            ),
            h2: ({ children }: { children: React.ReactNode }) => (
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                    {children}
                </h2>
            ),
            h3: ({ children }: { children: React.ReactNode }) => (
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                    {children}
                </h3>
            ),
            h4: ({ children }: { children: React.ReactNode }) => (
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                    {children}
                </h4>
            ),
            h5: ({ children }: { children: React.ReactNode }) => (
                <h5 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                    {children}
                </h5>
            ),
            h6: ({ children }: { children: React.ReactNode }) => (
                <h6 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 mt-3 first:mt-0">
                    {children}
                </h6>
            ),
            a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
                <a
                    href={href}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            ),
            table: ({ children }: { children: React.ReactNode }) => (
                <div className="overflow-x-auto mb-2 max-w-full">
                    <table className="min-w-full border border-zinc-300 dark:border-zinc-600 table-fixed">
                        {children}
                    </table>
                </div>
            ),
            th: ({ children }: { children: React.ReactNode }) => (
                <th className="border border-zinc-300 dark:border-zinc-600 px-2 py-1 bg-zinc-50 dark:bg-zinc-700 text-left font-semibold text-zinc-900 dark:text-zinc-100 break-words text-sm">
                    {children}
                </th>
            ),
            td: ({ children }: { children: React.ReactNode }) => (
                <td className="border border-zinc-300 dark:border-zinc-600 px-2 py-1 text-zinc-700 dark:text-zinc-300 break-words text-sm">
                    {children}
                </td>
            ),
            hr: () => <hr className="border-t border-zinc-300 dark:border-zinc-600 my-4" />,
        }),
        [],
    );

    // Split markdown by level-2 headings into sections
    const splitSections = (md: string) => {
        const lines = md.split(/\r?\n/);
        const sections: { title: string; body: string }[] = [];
        let currentTitle: string | null = null;
        let currentBody: string[] = [];

        const push = () => {
            if (currentTitle || currentBody.length) {
                sections.push({ title: currentTitle || 'Overview', body: currentBody.join('\n').trim() });
            }
        };

        for (const line of lines) {
            const m = line.match(/^##\s+(.+)/);
            if (m) {
                // new section
                push();
                currentTitle = m[1].trim();
                currentBody = [];
            } else {
                currentBody.push(line);
            }
        }
        push();
        return sections.filter((s) => s.body.trim().length > 0 || s.title);
    };

    return (
        <>
            {/* Backdrop - only on mobile/tablet */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Panel with responsive positioning */}
            <div
                ref={panelRef}
                className={cn(
                    'fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 shadow-xl transition-all duration-300 ease-out flex flex-col',
                    // Mobile/tablet: overlay with high z-index
                    'z-50 md:z-30',
                    // Transform based on open state
                    isOpen ? 'translate-x-0' : 'translate-x-full',
                )}
                style={{ width: isFullScreen ? '100vw' : `${panelWidth}px` }}
            >
                {/* Resize Handle */}
                {!isFullScreen && (
                    <div
                        className="absolute left-0 top-0 w-[1px] h-full cursor-col-resize hover:w-1.5 transition-all z-10 group bg-border hover:bg-accent"
                        onMouseDown={handleResizeStart}
                    />
                )}

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
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-wide">
                                ATOMS
                            </h2>
                            {/* Tabs removed */}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSidebar((v) => !v)}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                        >
                            <PanelLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullScreen((v) => !v)}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
                        >
                            {isFullScreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
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

                {/* Body with sidebar (threads) + main chat [New Added] */}
                <div className="flex flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-900/50 relative">
                    {/* Sidebar - chat history [New Added] */}
                    {showSidebar && (
                    <div
                        className="hidden md:flex md:flex-col border-r border-zinc-200 dark:border-zinc-800 p-3 gap-3 relative min-w-[220px] max-w-[420px]"
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                                const id = newThread('New chat');
                                if (id) setActiveThread(id);
                                setTimeout(() => textareaRef.current?.focus(), 50);
                            }}
                        >
                            + New chat
                        </Button>
                        {(() => {
                            const threads = listThreadsForCurrentOrg();
                            const chatThreads = threads.filter((t) => t.threadType !== 'analysis');
                            const analysisThreads = threads.filter((t) => t.threadType === 'analysis');
                            return (
                                <div className="flex-1 overflow-auto">
                                    {/* Chats section */}
                                    <div className="text-xs text-zinc-500">Chats</div>
                                    <ul className="space-y-1 mb-3">
                                        {chatThreads.map((t) => {
                                            const isActive = activeThreadId === t.id;
                                            return (
                                                <li key={t.id} className="group">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className={cn(
                                                                'flex-1 min-w-0 text-left px-2 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                                                isActive && 'bg-zinc-200 dark:bg-zinc-700',
                                                            )}
                                                            onClick={() => {
                                                                setActiveThread(t.id);
                                                            }}
                                                            title={t.title || 'Untitled'}
                                                        >
                                                            <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                                {t.title || 'Untitled'}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500">
                                                                {new Date(t.updatedAt).toLocaleDateString()}
                                                            </div>
                                                        </button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 p-0 ml-1 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                                                            title="Delete chat"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const confirmed = window.confirm('Delete this chat? This will remove all messages in the thread.');
                                                                if (confirmed) deleteThread(t.id);
                                                            }}
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Analysis section - renders when threads exist */}
                                    {analysisThreads.length > 0 && (
                                        <>
                                            <button
                                                type="button"
                                                className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-1 py-1 rounded"
                                                onClick={() => setAnalysisExpanded((v) => !v)}
                                                title={analysisExpanded ? 'Collapse Analysis' : 'Expand Analysis'}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {analysisExpanded ? (
                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    )}
                                                    {analysisExpanded ? (
                                                        <FolderOpen className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Folder className="h-3.5 w-3.5" />
                                                    )}
                                                    <span>Analysis</span>
                                                </span>
                                                <span className="text-[10px] text-zinc-400">{analysisThreads.length}</span>
                                            </button>
                                            {analysisExpanded && (
                                            <ul className="space-y-1">
                                                {analysisThreads.map((t) => {
                                                    const isActive = activeThreadId === t.id;
                                                    return (
                                                        <li key={t.id} className="group">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    className={cn(
                                                                        'flex-1 min-w-0 text-left px-2 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                                                        isActive && 'bg-zinc-200 dark:bg-zinc-700',
                                                                    )}
                                                                    onClick={() => {
                                                                        setActiveThread(t.id);
                                                                    }}
                                                                    title={t.title || 'Untitled'}
                                                                >
                                                                    <div className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                                                        {t.title || 'Untitled'}
                                                                    </div>
                                                                    <div className="text-[10px] text-zinc-500">
                                                                        {new Date(t.updatedAt).toLocaleDateString()}
                                                                    </div>
                                                                </button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 p-0 ml-1 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                                                                    title="Delete chat"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const confirmed = window.confirm('Delete this chat? This will remove all messages in the thread.');
                                                                        if (confirmed) deleteThread(t.id);
                                                                    }}
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })()}
                        {/* Sidebar Resize Handle */}
                        <div
                            className="absolute right-0 top-0 h-full w-[3px] cursor-col-resize hover:w-1.5 bg-transparent hover:bg-accent"
                            onMouseDown={handleSidebarResizeStart}
                            title="Drag to resize sidebar"
                        />
                    </div>
                    )}

                    {/* Sidebar show button when hidden: now toggled via header */}

                    {/* Main column: messages + input [New Added] */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Messages */}
                        <ScrollArea className="flex-1">
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
                                                : isFullScreen
                                                    ? 'justify-center'
                                                    : 'justify-center',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'p-3 rounded-lg break-words',
                                                msg.role === 'user'
                                                    ? 'max-w-[85%] bg-zinc-600 text-white dark:bg-purple-600 dark:text-white'
                                                    : isFullScreen
                                                        ? 'w-full max-w-3xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600'
                                                        : 'max-w-[95%] bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600',
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
                                                    {/* Collapsible analysis sections when headings are present */}
                                                    {/^#?#?\s*Analysis|\n##\s+/.test(msg.content) ? (
                                                        <div className="space-y-2">
                                                            {splitSections(msg.content).map((section, sIdx) => (
                                                                <details
                                                                    key={sIdx}
                                                                    className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 open:shadow-sm"
                                                                    open={sIdx === 0}
                                                                >
                                                                    <summary className="cursor-pointer select-none px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                                                                        {section.title}
                                                                    </summary>
                                                                    <div className="px-3 pb-3 text-sm">
                                                                        <ReactMarkdown components={markdownComponents as unknown as never}>
                                                                            {section.body}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </details>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <ReactMarkdown components={markdownComponents as unknown as never}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    )}
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
                        <div className={cn(
                            "px-8 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                            isFullScreen && "flex justify-center"
                        )}>
                    <div className={cn("w-full", isFullScreen ? "max-w-3xl" : undefined)}>
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
                                className="min-h-[32px] max-h-[160px] resize-y border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg text-lg"
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
                        </div>
                        {/* Add minimal UI for queued messages */}
                        {queue.length > 0 && (
                            <div className={cn("mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded", isFullScreen && "mx-auto max-w-3xl") }>
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
                </div>
            </div>
        </>
    );
};