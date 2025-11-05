# AgentPanel Integration Guide

**Purpose:** Step-by-step guide to integrate new components into existing AgentPanel  
**Time Required:** 2-3 hours  
**Difficulty:** Intermediate

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ All frontend components created (ArtifactRenderer, MessageWithArtifacts, etc.)
- ✅ Backend server running on port 3284
- ✅ Existing AgentPanel.tsx file
- ✅ Basic understanding of React hooks and TypeScript

---

## 🎯 Integration Steps

### Step 1: Add Component Imports

**File:** `src/components/custom/AgentChat/AgentPanel.tsx`

Add these imports at the top of the file:

```typescript
// Add to existing imports
import { MessageWithArtifacts } from './MessageWithArtifacts';
import { FileAttachment, type AttachedFile } from './FileAttachment';
import { ToolApprovalModal, type ToolApprovalRequest } from './ToolApprovalModal';
import { ToolExecutionList, type ToolExecution } from './ToolExecutionStatus';
```

---

### Step 2: Add State for New Features

Add these state variables inside your AgentPanel component:

```typescript
// File attachments
const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

// Tool approval
const [approvalRequest, setApprovalRequest] = useState<ToolApprovalRequest | null>(null);
const [pendingApprovals, setPendingApprovals] = useState<Map<string, (approved: boolean) => void>>(new Map());

// Tool executions
const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
```

---

### Step 3: Add SSE Event Handlers

Add event handlers for tool approval and execution status:

```typescript
// Add this function to handle SSE events
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
            
            // Create a promise that resolves when user approves/denies
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

// Add approval handlers
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
```

---

### Step 4: Update Message Rendering

Replace the existing `ConversationMessage` with `MessageWithArtifacts`:

**Before:**
```typescript
<ConversationMessage
    role={message.role}
    isStreaming={message.isStreaming}
    timestamp={message.createdAt}
    editable={message.role === 'user'}
    onEdit={() => handleEditMessage(message.id, message.content)}
>
    {message.role === 'assistant' ? (
        <ReactMarkdown className="prose prose-sm dark:prose-invert">
            {message.content}
        </ReactMarkdown>
    ) : (
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
    )}
</ConversationMessage>
```

**After:**
```typescript
<MessageWithArtifacts
    message={message}
    editable={message.role === 'user'}
    onEdit={() => handleEditMessage(message.id, message.content)}
/>
```

---

### Step 5: Add File Attachment to Input Area

Add the FileAttachment component above the PromptInput:

```typescript
<ConversationFooter className="border-t p-4">
    {/* File Attachment */}
    {attachedFiles.length > 0 && (
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
    
    {/* Add file attachment button */}
    <div className="mt-2 flex items-center gap-2">
        <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                // Toggle file attachment visibility
                if (attachedFiles.length === 0) {
                    // Show file attachment component
                    setAttachedFiles([]);
                }
            }}
        >
            <Paperclip className="h-4 w-4 mr-1" />
            Attach Files
        </Button>
    </div>
</ConversationFooter>
```

---

### Step 6: Add Tool Approval Modal

Add the modal at the end of your component, before the closing tag:

```typescript
{/* Tool Approval Modal */}
<ToolApprovalModal
    request={approvalRequest}
    open={!!approvalRequest}
    onApprove={handleApprove}
    onDeny={handleDeny}
    onClose={() => setApprovalRequest(null)}
/>
```

---

### Step 7: Add Tool Execution Display

Add tool execution list in the conversation body:

```typescript
<ConversationBody className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4">
    <ConversationMessages className="min-h-0 flex-1 pr-2" scrollable>
        {/* Existing messages */}
        {displayMessages.map((message, index) => (
            <div key={message.id}>
                <MessageWithArtifacts
                    message={message}
                    editable={message.role === 'user'}
                    onEdit={() => handleEditMessage(message.id, message.content)}
                />
            </div>
        ))}
        
        {/* Tool Executions */}
        {toolExecutions.length > 0 && (
            <ToolExecutionList executions={toolExecutions} />
        )}
    </ConversationMessages>
</ConversationBody>
```

---

### Step 8: Update Submit Message to Include Files

Modify the `submitMessage` function to include attached files:

```typescript
const submitMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message && attachedFiles.length === 0) return;

    if (!append && !sendMessage) {
        console.error('Chat hook is not ready');
        return;
    }

    setInputValue('');
    const filesToSend = attachedFiles;
    setAttachedFiles([]);
    setEditingMessageId(null);

    if (isLoading) {
        setMessageQueue((prev) => [...prev, message]);
        return;
    }

    // Convert files to base64 for sending
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

    // Include files in metadata
    await appendWithMetadata(message, { files: fileData });
}, [appendWithMetadata, inputValue, attachedFiles, isLoading, append, sendMessage]);

// Helper function to convert file to base64
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
```

---

## 📝 Complete Example

See `AGENTPANEL_INTEGRATION_EXAMPLE.tsx` for a complete working example with all features integrated.

---

## 🧪 Testing Checklist

After integration, test these features:

- [ ] Messages display with artifact extraction
- [ ] Artifacts render correctly (HTML, SVG, code)
- [ ] File attachment drag-and-drop works
- [ ] File previews show correctly
- [ ] Files are sent with messages
- [ ] Tool approval modal appears for high-risk tools
- [ ] Approve/Deny buttons work
- [ ] Tool execution status displays
- [ ] Tool results show correctly
- [ ] Streaming still works
- [ ] Error handling works

---

## 🐛 Troubleshooting

### Artifacts not showing
- Check that message content contains `<artifact>` tags
- Verify `extractArtifacts` is being called
- Check browser console for errors

### File upload not working
- Verify file size limits
- Check accepted file types
- Ensure `onFilesChange` is called

### Tool approval not appearing
- Check SSE connection
- Verify event handler is registered
- Check backend is sending approval requests

### Tool execution not updating
- Verify SSE events are being received
- Check `toolExecutions` state updates
- Ensure execution IDs are unique

---

## 📚 Additional Resources

- **Component Documentation:** See FRONTEND_COMPONENTS_COMPLETE.md
- **Backend Integration:** See BACKEND_IMPLEMENTATION_COMPLETE.md
- **API Reference:** See backend OpenAPI docs at `/docs`

---

**Next:** See AGENTPANEL_INTEGRATION_EXAMPLE.tsx for complete working example

