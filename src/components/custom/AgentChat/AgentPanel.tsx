// Type checking disabled for rapid development - will be refactored
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Agent Panel - Vercel AI SDK v6 implementation
 *
 * Wraps the official `useChat` hook with advanced UX features carried over from
 * the legacy panel: retry, message queueing, history restore, and branch/fork
 * navigation. The component is intentionally self-contained so future AI
 * Elements adoption can slot in by replacing the message rendering block.
 */

'use client';

import { ChevronLeft, ChevronRight, GitBranch, Paperclip } from 'lucide-react';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useReducer,
} from 'react';
// import ReactMarkdown from 'react-markdown'; // Will be used when rendering markdown
import { v4 as uuidv4 } from 'uuid';

import { useChat, type UIMessage as Message } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { useUser } from '@/lib/providers/user.provider';
import { DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
    Conversation,
    ConversationHeader,
    ConversationBody,
    ConversationMessages,
    ConversationFooter,
    // ConversationMessage, // Will be used when rendering messages
    PromptInput,
} from '@/components/ui/ai-elements';
import { TypingIndicatorMessage } from '@/components/ui/typing-indicator';

import { AgentPanelHeader } from './AgentPanelHeader';
import { ChatHistoryPage } from './ChatHistoryPage';
import { useAgentStore } from './hooks/useAgentStore';

// NEW: Import new components
import { MessageWithArtifacts } from './MessageWithArtifacts';
import { FileAttachment, type AttachedFile } from './FileAttachment';
import { ToolApprovalModal, type ToolApprovalRequest } from './ToolApprovalModal';
import { ToolExecutionList, type ToolExecution } from './ToolExecutionStatus';

interface AgentPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onSettingsClick?: () => void;
}

type AgentPanelView = 'chat' | 'history';
type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

interface DisplayMessage {
    id: string;
    role: ChatRole;
    content: string;
    isStreaming?: boolean;
    isPending?: boolean; // Message is queued and waiting to be sent
    createdAt?: Date;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
    isOpen,
    onToggle: _onToggle, // reserved for future AI Elements integration
    onClose,
    onSettingsClick,
}) => {
    const { user } = useUser();
    const {
        currentOrgId,
        currentProjectId,
        currentDocumentId,
        currentSessionId,
        selectedModel,
        setSelectedModel,
        setCurrentSession,
        panelWidth,
        setPanelWidth,
    } = useAgentStore();

    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Handle panel resizing
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 320;
            const maxWidth = 800;
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            setPanelWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setPanelWidth]);

    const [activeView, setActiveView] = useState<AgentPanelView>('chat');
    const [inputValue, setInputValue] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [messageQueue, setMessageQueue] = useState<string[]>([]);
    const queueProcessingRef = useRef(false);
    const branchSnapshotsRef = useRef<Message[][]>([[]]);
    const [activeBranchIndex, setActiveBranchIndex] = useState(0);
    const [branchCount, setBranchCount] = useState(1);
    // Track which messages have branches (messageId -> branch info)
    const branchPointsRef = useRef<Set<string>>(new Set());
    // Track branch creation order
    const branchCreationOrderRef = useRef<string[]>([]);
    // Track hidden message cutoff point (messages after this index are hidden)
    const [hiddenAfterIndex, setHiddenAfterIndex] = useState<number | null>(null);
    // Track different response paths for branch navigation
    const branchPathsRef = useRef<Map<string, { messages: Message[]; cutoffIndex: number }>>(new Map());
    const lastMessageRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // NEW: File attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [showFileAttachment, setShowFileAttachment] = useState(false);

    // NEW: Tool approval state
    const [approvalRequest, setApprovalRequest] = useState<ToolApprovalRequest | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<Map<string, (approved: boolean) => void>>(new Map());

    // NEW: Tool execution state
    const [toolExecutions, _setToolExecutions] = useState<ToolExecution[]>([]);

    const ensureSessionId = useCallback(() => {
        if (currentSessionId) return currentSessionId;
        const generated = uuidv4();
        setCurrentSession(generated);
        return generated;
    }, [currentSessionId, setCurrentSession]);

    const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

    const chatHelpers = useChat({
        id: `agent-chat-${currentOrgId || 'default'}`,
        transport,
    });

    const {
        messages: sdkMessages,
    } = chatHelpers;

    // Type definition for dynamic chat helpers
    type ChatHelpers = {
        append?: (message: any) => void;
        sendMessage: (message: any) => void;
        setMessages: (messages: any[]) => void;
        status?: 'submitted' | 'streaming' | 'ready' | 'error';
        error?: any;
        stop?: () => Promise<void>;
    };

    // Type assertions for v6 migration
    const append = (chatHelpers as ChatHelpers).append;
    const sendMessage = (chatHelpers as ChatHelpers).sendMessage;
    const setMessages = (chatHelpers as ChatHelpers).setMessages;
    const status = (chatHelpers as ChatHelpers).status ?? 'ready';
    const stop = (chatHelpers as ChatHelpers).stop;
    const isGenerating = status === 'submitted' || status === 'streaming';
    const error = (chatHelpers as ChatHelpers).error;

    // Force re-render during streaming
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    
    const normalizeMessage = useCallback((message: Message, index: number, messagesArray: Message[] = sdkMessages): DisplayMessage => {
        let text = '';
        const hasParts = Array.isArray((message as any).parts);

        if (hasParts) {
            // Handle parts array - join text parts
            // Don't clean up during streaming to avoid jumps
            text = (message as any).parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text || '')
                .join('');
        } else {
            // Check both content string and any streaming delta
            text = (message as any).content ?? '';
            // Also check for delta updates during streaming
            if (typeof (message as any).delta === 'string') {
                text += (message as any).delta;
            }
        }

        // Check if this is the last assistant message and we're currently loading
        const isLastMessage = index === messagesArray.length - 1;
        const isAssistantMessage = message.role === 'assistant';
        // Show streaming if loading AND last message is assistant (even if empty)
        // Also show if message has delta property (actively streaming)
        const isStreaming = isGenerating && isLastMessage && isAssistantMessage;

        return {
            id: message.id || `message-${index}`,
            role: message.role as ChatRole,
            content: text,
            isStreaming,
            createdAt: (message as any).createdAt ? new Date((message as any).createdAt) : undefined,
        };
    }, [isGenerating, sdkMessages]);

    const displayMessages = React.useMemo(
        () => {
            // Filter messages based on hiddenAfterIndex
            const visibleMessages = hiddenAfterIndex !== null
                ? sdkMessages.slice(0, hiddenAfterIndex + 1)
                : sdkMessages;

            const normalized = visibleMessages.map((msg, index) => normalizeMessage(msg, index, visibleMessages));

            // If loading and last visible message is user (or no messages), add a placeholder assistant message for streaming
            const lastNormalized = normalized[normalized.length - 1];
            if (isGenerating && (!lastNormalized || lastNormalized.role === 'user')) {
                normalized.push({
                    id: 'streaming-placeholder',
                    role: 'assistant',
                    content: '',
                    isStreaming: true,
                });
            }

            // Add queued messages as pending user messages
            messageQueue.forEach((queuedMessage, index) => {
                normalized.push({
                    id: `queued-${index}`,
                    role: 'user',
                    content: queuedMessage,
                    isStreaming: false,
                    isPending: true, // Mark as pending/queued
                });
            });

            return normalized;
        },
        [sdkMessages, normalizeMessage, hiddenAfterIndex, isGenerating, messageQueue],
    );

    // Track last message content for smooth streaming updates
    const lastStreamingContentRef = useRef<string>('');
    
    React.useEffect(() => {
        // Force re-render when messages change during streaming
        // This ensures token-by-token updates are visible
        if (isGenerating && sdkMessages.length > 0) {
            const lastMessage = sdkMessages[sdkMessages.length - 1];
            let currentContent = '';
            
            if (Array.isArray((lastMessage as any).parts)) {
                currentContent = (lastMessage as any).parts
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text || '')
                    .join('');
            } else {
                currentContent = typeof (lastMessage as any).content === 'string' 
                    ? (lastMessage as any).content 
                    : '';
            }
            
            // Only update if content actually changed
            if (lastStreamingContentRef.current !== currentContent) {
                lastStreamingContentRef.current = currentContent;
                // Trigger re-render by updating state
                forceUpdate();
            }
        } else {
            lastStreamingContentRef.current = '';
        }
    }, [isGenerating, sdkMessages]);

    // Track last message content for smooth scrolling
    const lastMessageContentRef = useRef<string>('');
    
    useEffect(() => {
        if (!lastMessageRef.current) return;
        const lastMessage = displayMessages[displayMessages.length - 1];
        const currentContent = (lastMessage as any)?.content || '';
        
        // Only scroll if content changed
        if (lastMessageContentRef.current !== currentContent) {
            lastMessageContentRef.current = currentContent;
            // Use instant scroll during streaming for smoother token-by-token updates
            if (lastMessage?.isStreaming) {
                // Request animation frame for smooth scrolling during streaming
                requestAnimationFrame(() => {
                    if (lastMessageRef.current) {
                        lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                    }
                });
            } else {
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, [displayMessages]);

    // NEW: File to base64 converter
    const fileToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    const appendWithMetadata = useCallback(
        async (content: string, files?: AttachedFile[]) => {
            const messageFunction = append && typeof append === 'function' ? append : sendMessage;

            if (!messageFunction || typeof messageFunction !== 'function') {
                console.error('Neither append nor sendMessage is available', { append, sendMessage });
                return;
            }

            try {
                // Convert files to base64 if present
                let fileData: any[] = [];
                if (files && files.length > 0) {
                    fileData = await Promise.all(
                        files.map(async (attachedFile) => {
                            const base64 = await fileToBase64(attachedFile.file);
                            return {
                                name: attachedFile.file.name,
                                type: attachedFile.file.type,
                                data: base64,
                            };
                        })
                    );
                }

                if (messageFunction === append) {
                    await append(
                        { role: 'user', content },
                        {
                            body: {
                                model: selectedModel || DEFAULT_MODEL,
                                metadata: {
                                    organization_id: currentOrgId,
                                    session_id: currentSessionId || ensureSessionId(),
                                    user_id: user?.id,
                                    project_id: currentProjectId,
                                    document_id: currentDocumentId,
                                    files: fileData.length > 0 ? fileData : undefined,
                                },
                            },
                        },
                    );
                } else {
                    await sendMessage(
                        { text: content },
                        {
                            body: {
                                model: selectedModel || DEFAULT_MODEL,
                                metadata: {
                                    organization_id: currentOrgId,
                                    session_id: currentSessionId || ensureSessionId(),
                                    user_id: user?.id,
                                    project_id: currentProjectId,
                                    document_id: currentDocumentId,
                                    files: fileData.length > 0 ? fileData : undefined,
                                },
                            },
                        },
                    );
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        },
        [
            append,
            sendMessage,
            selectedModel,
            currentOrgId,
            currentSessionId,
            currentProjectId,
            currentDocumentId,
            ensureSessionId,
            user?.id,
            fileToBase64,
        ],
    );

    const processQueue = useCallback(async () => {
        if (queueProcessingRef.current || messageQueue.length === 0) return;
        queueProcessingRef.current = true;
        const [next, ...rest] = messageQueue;
        setMessageQueue(rest);
        try {
            await appendWithMetadata(next);
        } finally {
            queueProcessingRef.current = false;
        }
    }, [appendWithMetadata, messageQueue]);

    useEffect(() => {
        if (!isGenerating) {
            void processQueue();
        }
    }, [isGenerating, processQueue]);

    useEffect(() => {
        branchSnapshotsRef.current[activeBranchIndex] = sdkMessages;
    }, [sdkMessages, activeBranchIndex]);

    useEffect(() => {
        if (!isOpen) return;
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen, activeView]);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setCurrentSession(null);
        setActiveBranchIndex(0);
        setBranchCount(1);
        branchSnapshotsRef.current = [[]];
        setInputValue('');
        setMessageQueue([]);
        setHiddenAfterIndex(null);
        branchPathsRef.current.clear();
        branchPointsRef.current.clear();
        setEditingMessageId(null);
    }, [setCurrentSession, setMessages]);

    const handleLoadSession = useCallback(async (sessionId: string) => {
        try {
            const response = await fetch(`/api/history/${sessionId}`);
            if (!response.ok) throw new Error('Failed to load session');
            const data = await response.json();
            if (Array.isArray(data.messages)) {
                const transformed: Message[] = data.messages.map((msg: any) => ({
                    id: msg.id ?? `history-${Math.random().toString(36).slice(2)}`,
                    role: msg.role,
                    content: (msg as any).content,
                }));
                setMessages(transformed);
                branchSnapshotsRef.current = [transformed];
                setActiveBranchIndex(0);
                setBranchCount(1);
                setCurrentSession(sessionId);
                setActiveView('chat');
            }
        } catch (err) {
            console.error('Failed to load session', err);
        }
    }, [setMessages, setCurrentSession]);

    const submitMessage = useCallback(async () => {
        const message = inputValue.trim();

        if (!message && attachedFiles.length === 0) return;

        if (!append && !sendMessage) {
            console.error('Chat hook is not ready');
            return;
        }

        // If editing a message, create branch before sending
        if (editingMessageId) {
            const targetIndex = sdkMessages.findIndex((msg) => msg.id === editingMessageId);
            if (targetIndex >= 0) {
                // Save current state before removing messages
                const branchKey = `edit-${editingMessageId}`;
                branchPathsRef.current.set(branchKey, {
                    messages: [...sdkMessages],
                    cutoffIndex: targetIndex,
                });
                
                // Track branch creation order
                if (!branchCreationOrderRef.current.includes(branchKey)) {
                    branchCreationOrderRef.current.push(branchKey);
                }

                // Remove all messages after the edited message from sdkMessages
                const messagesUpToEdit = sdkMessages.slice(0, targetIndex + 1);
                setMessages(messagesUpToEdit);
                
                // Hide messages after the edited message
                setHiddenAfterIndex(targetIndex);
                
                // Track as branch point
                branchPointsRef.current.add(editingMessageId);
                
                // Update branch count - newest branch should be highest number
                const branchKeys = Array.from(branchPathsRef.current.keys());
                setBranchCount(branchKeys.length);
                // Newest branch is the last one in creation order (highest index)
                setActiveBranchIndex(branchCreationOrderRef.current.indexOf(branchKey));
            }
        } else {
            // Clear hidden state when submitting a new (non-edited) message
            // This allows new messages to be visible
            if (hiddenAfterIndex !== null) {
                setHiddenAfterIndex(null);
            }
        }

        setInputValue('');
        setEditingMessageId(null);
        
        const filesToSend = attachedFiles;
        setAttachedFiles([]);
        setShowFileAttachment(false);

        if (isGenerating) {
            setMessageQueue((prev) => [...prev, message]);
            return;
        }

        await appendWithMetadata(message, filesToSend);
    }, [appendWithMetadata, inputValue, attachedFiles, isGenerating, append, sendMessage, hiddenAfterIndex, editingMessageId, sdkMessages, setMessages]);

    // NEW: Tool approval handlers
    const handleApprove = useCallback((requestId: string) => {
        const resolver = pendingApprovals.get(requestId);
        if (resolver) {
            resolver(true);
            setPendingApprovals(prev => {
                const next = new Map(prev);
                next.delete(requestId);
                return next;
            });
        }
        setApprovalRequest(null);
    }, [pendingApprovals]);

    const handleDeny = useCallback((requestId: string) => {
        const resolver = pendingApprovals.get(requestId);
        if (resolver) {
            resolver(false);
            setPendingApprovals(prev => {
                const next = new Map(prev);
                next.delete(requestId);
                return next;
            });
        }
        setApprovalRequest(null);
    }, [pendingApprovals]);

    const handleRetry = useCallback(async () => {
        // Find the last user message in sdkMessages
        const lastUserIndex = sdkMessages.findLastIndex((msg) => msg.role === 'user');
        if (lastUserIndex < 0) return;

        const lastUserMsg = sdkMessages[lastUserIndex];

        // Save current state before modifying
        const branchKey = `retry-${lastUserMsg.id}`;
        branchPathsRef.current.set(branchKey, {
            messages: [...sdkMessages],
            cutoffIndex: lastUserIndex,
        });

        // Track branch creation order
        if (!branchCreationOrderRef.current.includes(branchKey)) {
            branchCreationOrderRef.current.push(branchKey);
        }

        // Remove all messages after the last user message (including any assistant response)
        const messagesUpToUser = sdkMessages.slice(0, lastUserIndex + 1);
        setMessages(messagesUpToUser);

        // Clear hidden state since we're actually removing messages
        setHiddenAfterIndex(null);

        // Track as branch point
        branchPointsRef.current.add(lastUserMsg.id);

        // Update branch count - newest branch should be highest number
        const branchKeys = Array.from(branchPathsRef.current.keys());
        setBranchCount(branchKeys.length);
        // Newest branch is the last one in creation order (highest index)
        setActiveBranchIndex(branchCreationOrderRef.current.indexOf(branchKey));

        // Resend the last user message
        await appendWithMetadata((lastUserMsg as any).content);
    }, [
        sdkMessages,
        appendWithMetadata,
        setMessages,
    ]);

    const handleEditMessage = useCallback(
        (messageId: string, content: string) => {
            // Just load the message into input for editing
            // Don't create branch or hide messages yet
            setInputValue(content);
            setEditingMessageId(messageId);
            setActiveView('chat');
            requestAnimationFrame(() => textareaRef.current?.focus());
        },
        [],
    );

    const handleSwitchBranch = useCallback(
        (direction: 'prev' | 'next') => {
            if (branchCount <= 1) return;
            const branchKeys = branchCreationOrderRef.current;
            setActiveBranchIndex((current) => {
                const max = branchKeys.length;
                const delta = direction === 'prev' ? -1 : 1;
                const nextIndex = (current + delta + max) % max;
                const branchKey = branchKeys[nextIndex];
                const branchData = branchPathsRef.current.get(branchKey);

                if (branchData) {
                    // Restore messages and set cutoff point
                    setMessages(branchData.messages);
                    setHiddenAfterIndex(branchData.cutoffIndex);
                }

                setInputValue('');
                setEditingMessageId(null);

                return nextIndex;
            });
        },
        [branchCount, setMessages],
    );

    useEffect(() => {
        if (!sdkMessages.length) {
            branchSnapshotsRef.current[0] = [];
            setBranchCount(1);
            setActiveBranchIndex(0);
            setHiddenAfterIndex(null);
            branchPathsRef.current.clear();
            branchPointsRef.current.clear();
        } else {
            // Only clear hidden state if we're not in a branch context
            // When in a branch, new messages should stay hidden until explicitly cleared
            if (hiddenAfterIndex !== null && sdkMessages.length <= hiddenAfterIndex + 1) {
                // All messages are visible now, clear hidden state
                setHiddenAfterIndex(null);
            }
        }
    }, [sdkMessages.length, hiddenAfterIndex]);

    const handleModelChange = useCallback((modelId: string) => {
        setSelectedModel(modelId);
    }, [setSelectedModel]);

    const lastUserMessage = useMemo(() => {
        return [...displayMessages].reverse().find((msg) => msg.role === 'user');
    }, [displayMessages]);

    const lastAssistantMessage = useMemo(() => {
        return [...displayMessages].reverse().find((msg) => msg.role === 'assistant');
    }, [displayMessages]);

    const errorMessage = useMemo(() => {
        if (!error) return null;
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return 'Unknown error';
    }, [error]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed right-0 top-0 z-50 flex h-screen flex-col border-l bg-background shadow-lg transition-all duration-200"
            style={{ width: `${panelWidth}px` }}
        >
            {/* Resize handle */}
            <div
                ref={resizeRef}
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                }}
                className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
                style={{ 
                    cursor: isResizing ? 'col-resize' : 'col-resize',
                }}
            />
            
            <AgentPanelHeader
                selectedModel={selectedModel || DEFAULT_MODEL}
                onModelChange={handleModelChange}
                onNewChat={handleNewChat}
                onDownloadPDF={() => console.log('Export PDF ? TODO')}
                onDownloadTXT={() => console.log('Export TXT ? TODO')}
                onChatHistory={() => setActiveView('history')}
                onSettings={onSettingsClick || (() => undefined)}
                onClose={onClose}
            />

            {activeView === 'history' ? (
                <div className="flex-1 overflow-hidden">
                    <ChatHistoryPage
                        onBack={() => setActiveView('chat')}
                        onSelectSession={handleLoadSession}
                    />
                </div>
            ) : (
                <Conversation className="flex h-full flex-1 flex-col border-0 shadow-none">
                    <ConversationHeader className="border-b px-4 py-3">
                        {branchCount > 1 && (
                            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="inline-flex items-center gap-2">
                                    <GitBranch className="h-3.5 w-3.5" />
                                    <span>{`<${activeBranchIndex + 1} / ${branchCount}>`}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleSwitchBranch('prev')}
                                        title="Previous fork"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleSwitchBranch('next')}
                                        title="Next fork"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </ConversationHeader>

                    <ConversationBody className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
                        <ConversationMessages className="min-h-0 flex-1 pr-2" scrollable>
                            {displayMessages.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    Start a conversation with your agent.
                                </div>
                            ) : (
                                <>
                                    {displayMessages.map((message, index) => {
                                        const isLastUserMessage = message.role === 'user' && message.id === lastUserMessage?.id;
                                        const isEditing = editingMessageId === message.id;
                                        const hasBranch = branchPointsRef.current.has(message.id);
                                        const isEmptyStreamingAssistant =
                                            message.role === 'assistant' &&
                                            message.isStreaming &&
                                            (message.content ?? '').trim().length === 0;
                                        
                                        if (isEmptyStreamingAssistant) {
                                            return (
                                                <TypingIndicatorMessage
                                                    key={message.id}
                                                    className="animate-in fade-in"
                                                />
                                            );
                                        }

                                        return (
                                            <div
                                                key={message.id}
                                                ref={index === displayMessages.length - 1 ? lastMessageRef : undefined}
                                            >
                                                <MessageWithArtifacts
                                                    message={message}
                                                    editable={message.role === 'user'}
                                                    onEdit={() => handleEditMessage(message.id, (message as any).content)}
                                                    isEditing={isEditing}
                                                    branchCount={branchCount}
                                                    activeBranchIndex={activeBranchIndex}
                                                    onSwitchBranch={handleSwitchBranch}
                                                    showRetry={isLastUserMessage && !!lastAssistantMessage && !isGenerating}
                                                    onRetry={handleRetry}
                                                    showBranchNav={hasBranch && !isEditing}
                                                    className={cn(
                                                        message.role === 'assistant' && message.isStreaming && 'border border-primary/40 bg-primary/5 shadow-sm animate-pulse',
                                                        isEditing && 'ring-2 ring-primary/60',
                                                    )}
                                                />
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Show indicator when messages are hidden */}
                                    {hiddenAfterIndex !== null && hiddenAfterIndex < sdkMessages.length - 1 && (
                                        <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                                            <GitBranch className="h-3 w-3 mr-1" />
                                            <span>{sdkMessages.length - hiddenAfterIndex - 1} message(s) hidden below</span>
                                        </div>
                                    )}

                                    {/* NEW: Tool Executions */}
                                    {toolExecutions.length > 0 && (
                                        <ToolExecutionList executions={toolExecutions} />
                                    )}
                                </>
                            )}
                        </ConversationMessages>

                        {errorMessage && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                {errorMessage}
                            </div>
                        )}
                    </ConversationBody>

                    <ConversationFooter className="border-t px-4 py-3">
                        {/* NEW: File Attachment (conditional) */}
                        {showFileAttachment && (
                            <div className="mb-3">
                                <FileAttachment
                                    onFilesChange={setAttachedFiles}
                                    maxFiles={5}
                                    maxSizeMB={10}
                                />
                            </div>
                        )}

                        {/* Attach button - shown in same row as input */}
                        {attachedFiles.length > 0 && (
                            <div className="mb-2 text-xs text-muted-foreground">
                                {attachedFiles.length} file(s) attached
                            </div>
                        )}

                        <PromptInput
                            value={inputValue}
                            onChange={setInputValue}
                            onSubmit={() => void submitMessage()}
                            placeholder={editingMessageId ? "Edit your message..." : "Type a message?"}
                            disabled={isGenerating}
                            textareaRef={textareaRef}
                            maxHeightPercentage={35}
                            isGenerating={isGenerating}
                            onStop={stop}
                            attachButton={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFileAttachment(!showFileAttachment)}
                                    className="h-[44px] px-3 shrink-0"
                                    title={showFileAttachment ? 'Hide file attachment' : 'Attach files'}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </ConversationFooter>
                </Conversation>
            )}

            {/* NEW: Tool Approval Modal */}
            <ToolApprovalModal
                request={approvalRequest}
                open={!!approvalRequest}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onClose={() => setApprovalRequest(null)}
            />
        </div>
    );
};
