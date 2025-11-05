/**
 * AgentPanel Integration Example
 * 
 * This file shows how to integrate all new components into AgentPanel.
 * Copy the relevant sections into your actual AgentPanel.tsx file.
 */

'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Paperclip } from 'lucide-react';

// Existing imports
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import {
    Conversation,
    ConversationHeader,
    ConversationBody,
    ConversationMessages,
    ConversationFooter,
    PromptInput,
} from '@/components/ui/ai-elements';

// NEW: Import new components
import { MessageWithArtifacts } from './MessageWithArtifacts';
import { FileAttachment, type AttachedFile } from './FileAttachment';
import { ToolApprovalModal, type ToolApprovalRequest } from './ToolApprovalModal';
import { ToolExecutionList, type ToolExecution } from './ToolExecutionStatus';

export const AgentPanelIntegrated: React.FC = () => {
    // Existing state
    const [inputValue, setInputValue] = useState('');
    
    // NEW: File attachment state
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [showFileAttachment, setShowFileAttachment] = useState(false);
    
    // NEW: Tool approval state
    const [approvalRequest, setApprovalRequest] = useState<ToolApprovalRequest | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<Map<string, (approved: boolean) => void>>(new Map());
    
    // NEW: Tool execution state
    const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);

    // Existing useChat hook
    const {
        messages,
        append,
        isLoading,
        error,
    } = useChat({
        api: '/api/chat',
        // ... existing config
    });

    // NEW: SSE Event Handler
    const handleSSEMessage = useCallback((event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle tool approval requests
            if (data.type === 'tool_approval_request') {
                const request: ToolApprovalRequest = {
                    request_id: data.request_id,
                    tool_name: data.tool_name,
                    tool_description: data.tool_description,
                    tool_input: data.tool_input,
                    approval_message: data.approval_message,
                    risk_level: data.risk_level,
                    timestamp: data.timestamp,
                };
                
                setApprovalRequest(request);
                
                // Wait for user approval
                return new Promise<boolean>((resolve) => {
                    setPendingApprovals(prev => new Map(prev).set(request.request_id, resolve));
                });
            }
            
            // Handle tool execution status
            if (data.type === 'tool_execution_status') {
                const execution: ToolExecution = {
                    id: data.execution_id,
                    tool_name: data.tool_name,
                    status: data.status,
                    input: data.input,
                    output: data.output,
                    error: data.error,
                    timestamp: data.timestamp,
                    duration: data.duration,
                };
                
                setToolExecutions(prev => {
                    const existing = prev.find(e => e.id === execution.id);
                    if (existing) {
                        return prev.map(e => e.id === execution.id ? execution : e);
                    }
                    return [...prev, execution];
                });
            }
        } catch (error) {
            console.error('Error parsing SSE message:', error);
        }
    }, []);

    // NEW: Approval handlers
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

    // NEW: File to base64 converter
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // UPDATED: Submit message with files
    const submitMessage = useCallback(async () => {
        const message = inputValue.trim();
        if (!message && attachedFiles.length === 0) return;

        setInputValue('');
        const filesToSend = attachedFiles;
        setAttachedFiles([]);
        setShowFileAttachment(false);

        // Convert files to base64
        const fileData = await Promise.all(
            filesToSend.map(async (attachedFile) => {
                const base64 = await fileToBase64(attachedFile.file);
                return {
                    name: attachedFile.file.name,
                    type: attachedFile.file.type,
                    data: base64,
                };
            })
        );

        // Send message with files in metadata
        await append({
            role: 'user',
            content: message,
        }, {
            data: {
                files: fileData,
            },
        });
    }, [inputValue, attachedFiles, append]);

    return (
        <Conversation className="flex h-full flex-col">
            <ConversationHeader>
                {/* Your existing header */}
            </ConversationHeader>

            <ConversationBody className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
                <ConversationMessages className="min-h-0 flex-1 pr-2" scrollable>
                    {messages.map((message) => (
                        <div key={message.id}>
                            {/* UPDATED: Use MessageWithArtifacts instead of ConversationMessage */}
                            <MessageWithArtifacts message={message} />
                        </div>
                    ))}
                    
                    {/* NEW: Tool Executions */}
                    {toolExecutions.length > 0 && (
                        <ToolExecutionList executions={toolExecutions} />
                    )}
                </ConversationMessages>
            </ConversationBody>

            <ConversationFooter className="border-t p-4">
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
                
                {/* Existing PromptInput */}
                <PromptInput
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onSubmit={submitMessage}
                    placeholder="Type a message..."
                    disabled={isLoading}
                />
                
                {/* NEW: File attachment button */}
                <div className="mt-2 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFileAttachment(!showFileAttachment)}
                    >
                        <Paperclip className="h-4 w-4 mr-1" />
                        {showFileAttachment ? 'Hide' : 'Attach'} Files
                    </Button>
                    
                    {attachedFiles.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {attachedFiles.length} file(s) attached
                        </span>
                    )}
                </div>
            </ConversationFooter>

            {/* NEW: Tool Approval Modal */}
            <ToolApprovalModal
                request={approvalRequest}
                open={!!approvalRequest}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onClose={() => setApprovalRequest(null)}
            />
        </Conversation>
    );
};

