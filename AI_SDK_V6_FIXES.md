# AI SDK v6 Fixes - Critical Issues

**Date:** 2025-11-06  
**Status:** 🔴 CRITICAL - 2 Issues Found

---

## Issue 1: Missing `metadata` Column in Database ✅ FIXED

### **Error:**
```
Could not find the 'metadata' column of 'mcp_servers' in the schema cache
```

### **Root Cause:**
The migration file `20250106_create_mcp_servers.sql` doesn't include a `metadata` column, but the TypeScript types expect it.

### **Fix:** ✅ CREATED
Created migration: `supabase/migrations/20251106_add_metadata_column.sql`

```sql
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_mcp_servers_metadata 
ON public.mcp_servers USING gin(metadata);
```

### **Action Required:**
Run the migration:
```bash
# Option 1: Via Supabase CLI
supabase db push

# Option 2: Via SQL editor in Supabase dashboard
# Copy and paste the migration SQL
```

---

## Issue 2: AI SDK Spec Version Mismatch 🔴 CRITICAL

### **Error:**
```
AI_UnsupportedModelVersionError: Unsupported model version v3 for provider "atomsagent.chat"
and model "claude-sonnet-4-5@20250929-1m". AI SDK 5 only supports models that implement
specification version "v2".
```

### **Root Cause:**
**IMPORTANT:** This is NOT about OpenAI API versions! This is about AI SDK's internal provider specification.

The real issue:
1. `@ai-sdk/openai-compatible@2.0.0-beta.32` has `specificationVersion = "v3"`
2. AI SDK v6 only supports providers with `specificationVersion: 'V2'`
3. The package version is too new and incompatible with AI SDK v6

**This is a package version mismatch, NOT an API spec issue!**

### **Solutions:**

#### **Option A: Downgrade @ai-sdk/openai-compatible** ⭐ RECOMMENDED

Downgrade to a version that uses spec v2:

```bash
npm install @ai-sdk/openai-compatible@1.0.0
```

**Pros:**
- Simple fix
- No code changes needed
- Works with current implementation

**Cons:**
- Using older package version
- May miss newer features

#### **Option B: Use Anthropic Provider Directly**

Instead of using `createOpenAICompatible`, use the official Anthropic provider:

```bash
npm install @ai-sdk/anthropic
```

Update `src/lib/providers/atomsagent.provider.ts`:
```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

export const atomsAgent = createAnthropic({
  baseURL: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/agentapi-proxy/v1`
    : 'http://localhost:3000/api/agentapi-proxy/v1',
  apiKey: 'dummy', // Not used, handled by proxy
});
```

**Pros:**
- Native Anthropic support
- Supports latest Claude models
- Better type safety

**Cons:**
- Requires atomsAgent backend to implement Anthropic API format
- More code changes

#### **Option C: Wait for AI SDK v7**

Wait for AI SDK v7 which will support spec v3.

**Pros:**
- No code changes needed
- Future-proof

**Cons:**
- Unknown timeline
- Blocks current development

---

## Recommended Fix: Option A (Downgrade Package)

### **Step 1: Downgrade @ai-sdk/openai-compatible**

```bash
npm install @ai-sdk/openai-compatible@1.0.0
```

### **Step 2: Verify Package Version**

```bash
npm list @ai-sdk/openai-compatible
```

Should show:
```
@ai-sdk/openai-compatible@1.0.0
```

### **Step 3: Test**

```bash
npm run dev
```

Try the chat - it should work now!

---

## Alternative Fix: Option B (Use Anthropic Provider)

Only use this if you want native Anthropic support and your backend implements Anthropic API.

### **Step 1: Install Anthropic Provider**

```bash
npm install @ai-sdk/anthropic
npm uninstall @ai-sdk/openai-compatible
```

### **Step 2: Update Provider**

**File:** `src/lib/providers/atomsagent.provider.ts`

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

export const atomsAgent = createAnthropic({
  baseURL: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/agentapi-proxy/v1`
    : 'http://localhost:3000/api/agentapi-proxy/v1',
  apiKey: 'dummy-key',
});

export type AtomsChatModelId =
  | 'claude-sonnet-4-5@20250929'
  | 'claude-sonnet-4-5@20250929-1m'
  | 'claude-haiku-4-5@20251001'
  | (string & Record<never, never>);

export const atomsChatModel = (modelId: AtomsChatModelId) =>
  atomsAgent(modelId);

export const DEFAULT_MODEL: AtomsChatModelId = 'claude-sonnet-4-5@20250929';
```

### **Step 3: Update Backend**

Ensure atomsAgent backend implements Anthropic API format (not OpenAI format).

---

## Alternative: Keep OpenAI-Compatible Provider

If atomsAgent backend must stay OpenAI-compatible, ensure it returns spec v2:

### **Backend Changes Required:**

1. **Response Format:** Use OpenAI API spec v2 format
2. **Streaming:** Use `data: [DONE]` to end stream
3. **Tool Calls:** Use spec v2 tool call format

### **Frontend Changes:**

Update provider configuration:

```typescript
export const atomsAgent = createOpenAICompatible({
  name: 'atomsagent',
  baseURL: '...',
  includeUsage: true,
  // Force spec v2
  compatibility: 'strict',
});
```

---

## Action Items

### **Immediate (Critical):**
1. ✅ Run database migration for `metadata` column
2. 🔴 Choose fix option (A, B, or C)
3. 🔴 Implement chosen fix
4. 🔴 Test chat functionality

### **Testing Checklist:**
- [ ] Chat completions work
- [ ] Streaming works
- [ ] Tool calling works
- [ ] Error handling works
- [ ] MCP server installation works

---

## Status

- **Issue 1 (metadata column):** ✅ FIXED (migration created)
- **Issue 2 (spec version):** 🔴 PENDING (awaiting decision)

**Recommended:** Implement Option A (Anthropic Provider)

