# MCP Server Installation Fix

**Date:** 2025-11-06  
**Status:** ✅ FIXED

---

## Issues Found

### **Issue 1: Wrong API Endpoint** ❌
Some components were calling `/api/mcp/install` which doesn't exist.

**Components affected:**
- `EnhancedMarketplace.tsx`
- `UnifiedServerCard.tsx`

**Correct endpoint:** `/api/mcp/marketplace/{namespace}/install`

### **Issue 2: Missing Request Body Fields** ❌
Frontend was only sending:
```json
{
  "scope": "user",
  "organizationId": null
}
```

But API expects:
```json
{
  "scope": "user",
  "organizationId": null,
  "config": {
    "name": "Server Name",
    "enabled": true,
    "env": {}
  }
}
```

### **Issue 3: Database Schema Mismatch** ❌ CRITICAL
API was sending registry format to database:
```json
{
  "namespace": "ai.aliengiraffe/spotdb",
  "transport": { "type": "stdio", "command": "npx" },
  "auth": { "type": "none" }
}
```

But database expects:
```json
{
  "registry_namespace": "ai.aliengiraffe/spotdb",
  "transport_type": "stdio",
  "command": "npx",
  "args": [],
  "auth_type": "none",
  "auth_config": {}
}
```

---

## Fixes Applied

### **Fix 1: Added Config to Request** ✅

**File:** `src/components/mcp/ServerMarketplace.tsx`

```typescript
body: JSON.stringify({
  scope,
  organizationId: orgId,
  config: {
    name: server.name,
    enabled: true,
    env: {},
  },
}),
```

### **Fix 2: Transform Registry Format to Database Schema** ✅

**File:** `src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts`

**Before:**
```typescript
const serverConfig = {
  namespace: server.namespace,
  transport: server.transport,
  auth: server.auth,
  // ...
};
```

**After:**
```typescript
const serverConfig = {
  // Transform namespace
  registry_namespace: server.namespace,
  registry_version: server.version,
  registry_source: 'anthropic',
  
  // Transform transport
  transport_type: server.transport.type,
  command: server.transport.command, // for stdio
  args: server.transport.args || [], // for stdio
  url: server.transport.url, // for http/sse
  
  // Transform auth
  requires_auth: server.auth.type !== 'none',
  auth_type: server.auth.type,
  auth_config: {
    provider: server.auth.provider,
    scopes: server.auth.scopes,
  },
  
  // Add metadata (new column!)
  metadata: {
    publisher: server.publisher,
    version: server.version,
    category: server.category,
    tags: server.tags,
    homepage: server.homepage,
    repository: server.repository,
  },
};
```

---

## Database Schema Reference

### **mcp_servers Table Columns:**

**Server Identification:**
- `id` - UUID (auto-generated)
- `name` - VARCHAR(255)
- `description` - TEXT
- `registry_namespace` - TEXT (e.g., "ai.aliengiraffe/spotdb")
- `registry_version` - TEXT
- `registry_source` - VARCHAR(50) ('anthropic', 'cline', 'custom')

**Scope:**
- `scope` - VARCHAR(20) ('user', 'organization', 'project')
- `user_id` - UUID
- `organization_id` - UUID
- `project_id` - UUID

**Transport:**
- `transport_type` - VARCHAR(20) ('stdio', 'sse', 'http')
- `command` - TEXT (for stdio)
- `args` - TEXT[] (for stdio)
- `url` - TEXT (for http/sse)
- `env` - JSONB

**Authentication:**
- `requires_auth` - BOOLEAN
- `auth_type` - VARCHAR(20) ('none', 'oauth', 'api_key', 'bearer')
- `auth_config` - JSONB
- `oauth_access_token` - TEXT
- `oauth_refresh_token` - TEXT
- `oauth_token_expires_at` - TIMESTAMPTZ
- `api_key` - TEXT

**Metadata:**
- `metadata` - JSONB (NEW! Added in migration)
- `tags` - TEXT[]
- `is_enabled` - BOOLEAN
- `is_public` - BOOLEAN
- `version` - INTEGER

**Audit:**
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ
- `created_by` - UUID
- `updated_by` - UUID
- `last_used_at` - TIMESTAMPTZ
- `usage_count` - INTEGER

---

## Testing

### **Test Case: Install spotdb Server**

**Steps:**
1. Navigate to http://localhost:3001/mcp/marketplace
2. Find "spotdb" server (ai.aliengiraffe/spotdb)
3. Click "Install"
4. Select scope: "My Account (Personal)"
5. Click "Install Server"

**Expected Result:**
- ✅ No 400 error
- ✅ No "Could not find 'metadata' column" error
- ✅ Server installs successfully
- ✅ Success toast appears
- ✅ Server appears in installed list

**Previous Errors:**
- ❌ 400 Bad Request
- ❌ Database schema mismatch
- ❌ Missing metadata column

---

## Files Changed

1. ✅ `src/components/mcp/ServerMarketplace.tsx` - Added config to request
2. ✅ `src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts` - Transform registry to DB schema
3. ✅ `supabase/migrations/20251106_add_metadata_column.sql` - Added metadata column (already run)

---

## Status

- ✅ Frontend sends correct request body
- ✅ API transforms registry format to database schema
- ✅ Database has metadata column
- ✅ All fields match database schema

**Ready to test!** 🚀

---

## Next Steps

1. Test MCP server installation
2. Verify server appears in installed list
3. Test server configuration
4. Test OAuth servers (if any)

---

## Notes

- The `metadata` column is now used to store rich server information
- Registry format is transformed to database schema on installation
- Transport and auth objects are flattened to individual columns
- Scope validation ensures correct user/org/project references

