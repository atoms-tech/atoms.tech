# AI SDK v6 Implementation Guide

**Date:** 2025-11-05  
**Status:** ✅ VERIFIED - Using AI SDK v6 Beta  
**Version:** `ai@6.0.0-beta.93`

---

## 📊 Current Status

### **Package Versions** ✅
```json
{
  "@ai-sdk/openai-compatible": "^2.0.0-beta.32",
  "@ai-sdk/react": "^3.0.0-beta.93",
  "ai": "^6.0.0-beta.93"
}
```

### **Current Implementation** ✅
- ✅ Using `streamText` from AI SDK v6
- ✅ Using `tool()` helper for type-safe tools
- ✅ Using `convertToModelMessages` for message formatting
- ✅ Using `@ai-sdk/react` hooks (`useChat`)
- ✅ Using `createOpenAICompatible` for atomsAgent provider

---

## 🎯 AI SDK v6 Key Features

### **1. Tool Calling** ✅ IMPLEMENTED
```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'Tool description',
  inputSchema: z.object({
    param: z.string()
  }),
  execute: async ({ param }) => {
    // Tool logic
    return result;
  }
});
```

**Current Usage:**
- ✅ `src/lib/agents/chat.agent.ts` - 4 MCP tools defined
- ✅ `src/app/api/chat/route.ts` - Tools passed to `streamText`

### **2. Multi-Step Tool Calls** ⚠️ NOT IMPLEMENTED
```typescript
const result = streamText({
  model,
  tools,
  stopWhen: stepCountIs(5), // Enable multi-step
  prompt
});
```

**Recommendation:** Add multi-step support for complex workflows

### **3. Tool Approval** ⚠️ PARTIAL
```typescript
// AI SDK v6 doesn't have built-in approval
// We need custom implementation
```

**Current:** `needsApproval` flag in tools (custom)  
**Needed:** Implement approval workflow

### **4. Dynamic Tools** ⚠️ NOT IMPLEMENTED
```typescript
import { dynamicTool } from 'ai';

const mcpTool = dynamicTool({
  description: 'MCP tool',
  inputSchema: z.object({}),
  execute: async (input) => {
    // Runtime tool execution
  }
});
```

**Recommendation:** Use for MCP server tools

### **5. Tool Execution Options** ✅ AVAILABLE
```typescript
execute: async (args, { 
  toolCallId,    // Tool call ID
  messages,      // Message history
  abortSignal,   // Abort signal
  experimental_context // Custom context
}) => {
  // Tool logic
}
```

**Current:** Not using execution options  
**Recommendation:** Add for better control

### **6. Response Messages** ⚠️ NOT IMPLEMENTED
```typescript
const { response } = await streamText({
  model,
  tools,
  messages
});

// Add assistant/tool messages to history
messages.push(...response.messages);
```

**Recommendation:** Use for conversation history

---

## 🔧 Implementation Checklist

### **Phase 1: Core Features** ✅ COMPLETE
- [x] Install AI SDK v6 packages
- [x] Create atomsAgent provider with `createOpenAICompatible`
- [x] Define tools with `tool()` helper
- [x] Use `streamText` for chat completions
- [x] Use `useChat` hook in frontend

### **Phase 2: Advanced Features** ⏳ IN PROGRESS
- [ ] Add multi-step tool calling with `stopWhen`
- [ ] Implement tool approval workflow
- [ ] Add dynamic tools for MCP servers
- [ ] Use tool execution options (toolCallId, messages, abortSignal)
- [ ] Implement response.messages for conversation history
- [ ] Add `onStepFinish` callback for step tracking

### **Phase 3: Optimization** ⏳ PENDING
- [ ] Add `activeTools` for limiting available tools
- [ ] Implement tool call repair with `experimental_repairToolCall`
- [ ] Add preliminary tool results with AsyncIterable
- [ ] Implement tool input lifecycle hooks
- [ ] Add error handling for tool calls

---

## 📝 Recommended Updates

### **1. Add Multi-Step Tool Calling**

**File:** `src/app/api/chat/route.ts`

```typescript
import { stepCountIs } from 'ai';

const result = streamText({
  model: chatModel,
  messages: formattedMessages,
  tools: Object.values(mcpTools),
  toolChoice: 'auto',
  system: systemPrompt || DEFAULT_AGENT_INSTRUCTIONS,
  stopWhen: stepCountIs(10), // Allow up to 10 steps
  onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
    // Log step completion
    logger.info('Step finished', {
      toolCalls: toolCalls.length,
      toolResults: toolResults.length,
      finishReason
    });
  }
});
```

### **2. Implement Tool Approval Workflow**

**File:** `src/lib/agents/tool-approval.ts` (NEW)

```typescript
import { tool } from 'ai';

export function createApprovalTool<T>(
  baseTool: ReturnType<typeof tool>,
  needsApproval: boolean
) {
  if (!needsApproval) return baseTool;
  
  return tool({
    ...baseTool,
    execute: async (args, options) => {
      // Request approval
      const approved = await requestApproval({
        toolName: baseTool.description,
        args,
        toolCallId: options.toolCallId
      });
      
      if (!approved) {
        throw new Error('Tool execution denied by user');
      }
      
      return baseTool.execute(args, options);
    }
  });
}
```

### **3. Add Dynamic MCP Tools**

**File:** `src/lib/agents/mcp-tools.ts` (NEW)

```typescript
import { dynamicTool } from 'ai';
import { z } from 'zod';

export async function getMCPTools(userId: string) {
  // Fetch user's MCP servers from database
  const mcpServers = await fetchUserMCPServers(userId);
  
  // Convert to dynamic tools
  const tools = {};
  
  for (const server of mcpServers) {
    for (const tool of server.tools) {
      tools[tool.name] = dynamicTool({
        description: tool.description,
        inputSchema: z.object({}), // Dynamic schema
        execute: async (input) => {
          // Call MCP server
          return await callMCPTool(server.id, tool.name, input);
        }
      });
    }
  }
  
  return tools;
}
```

### **4. Use Response Messages**

**File:** `src/app/api/chat/route.ts`

```typescript
// Store conversation history
const conversationHistory: ModelMessage[] = [];

const { response } = streamText({
  model: chatModel,
  messages: conversationHistory,
  tools: Object.values(mcpTools),
  // ...
});

// Add response messages to history
conversationHistory.push(...(await response).messages);
```

---

## 🚀 Next Steps

1. **Implement Multi-Step Tool Calling** - Enable complex workflows
2. **Add Tool Approval System** - Integrate with backend approval manager
3. **Create Dynamic MCP Tools** - Load tools from user's MCP servers
4. **Add Conversation History** - Use response.messages
5. **Implement Error Handling** - Handle tool errors gracefully

---

## 📚 Resources

- **AI SDK v6 Docs:** https://sdk.vercel.ai/docs
- **Tool Calling:** https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling
- **streamText:** https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text
- **GitHub:** https://github.com/vercel/ai

---

## ✅ Status: VERIFIED

We are correctly using AI SDK v6 with:
- ✅ Correct package versions
- ✅ Proper tool definitions
- ✅ streamText implementation
- ✅ React hooks integration

**Recommended:** Implement advanced features (multi-step, approval, dynamic tools)

