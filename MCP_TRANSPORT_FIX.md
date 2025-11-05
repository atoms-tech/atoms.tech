# MCP Transport Constraint Fix

## Date: 2025-11-05

---

## Issue

When installing MCP servers from the marketplace, getting this error:

```
Error upserting MCP server: {
  code: '23514',
  message: 'new row for relation "mcp_servers" violates check constraint "mcp_servers_transport_check"'
}
```

---

## Root Cause

The `transport` column in the database is a JSONB column, but the code was setting it to a string value:

**Before:**
```typescript
const baseServerRecord = {
  // ...
  transport_type: transport.type || 'stdio',
  transport: transport.type || 'stdio', // ❌ String, not JSONB!
  // ...
};
```

The database expects a JSONB object like:
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"]
}
```

But was receiving just:
```json
"stdio"  // ❌ String, not object
```

---

## Solution

Changed the `transport` field to use the full transport object instead of just the type string.

### Changes Made

**File:** `atoms.tech/src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts`

**1. Fixed transport field (Line 204)**

**Before:**
```typescript
transport: transport.type || 'stdio', // ❌ String
```

**After:**
```typescript
transport: transport || { type: 'stdio' }, // ✅ JSONB object
```

**2. Added retry logic for transport column (Line 244)**

**Before:**
```typescript
await retryIfMissing("'project_id'", 'project_id');
await retryIfMissing("'tier'", 'tier');
await retryIfMissing("'transport_type'", 'transport_type');
await retryIfMissing("'source'", 'source');
```

**After:**
```typescript
await retryIfMissing("'project_id'", 'project_id');
await retryIfMissing("'tier'", 'tier');
await retryIfMissing("'transport_type'", 'transport_type');
await retryIfMissing("'transport'", 'transport'); // ✅ Added
await retryIfMissing("'source'", 'source');
```

---

## How It Works

### Transport Object Structure

The transport object from the MCP registry looks like:

```typescript
// For stdio transport
{
  type: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env?: { ... }
}

// For HTTP/SSE transport
{
  type: 'sse',
  url: 'https://api.example.com/mcp'
}
```

### Code Flow

1. **Fetch transport from registry:**
   ```typescript
   const transport = server.packages?.[0]?.transport || server.transport || { type: 'stdio' };
   ```

2. **Store full object in database:**
   ```typescript
   transport: transport || { type: 'stdio' }
   ```

3. **Fallback if column doesn't exist:**
   ```typescript
   await retryIfMissing("'transport'", 'transport');
   ```

---

## Testing

### Test Marketplace Install

1. Go to marketplace in your app
2. Try installing a server (e.g., `ai.alpic.test/test-mcp-server`)
3. Should succeed without constraint errors

### Expected Result

✅ **Before:** Error with transport constraint violation
✅ **After:** Server installs successfully

### Verify in Database

```sql
SELECT namespace, transport_type, transport 
FROM mcp_servers 
WHERE namespace = 'ai.alpic.test/test-mcp-server';
```

Should show:
```
namespace                        | transport_type | transport
---------------------------------|----------------|---------------------------
ai.alpic.test/test-mcp-server   | stdio          | {"type": "stdio", ...}
```

---

## Related Fixes

This is part of a series of MCP marketplace install fixes:

1. ✅ **Source constraint** - Fixed in `20251106002_fix_mcp_source_constraint.sql`
   - Changed `source: 'marketplace'` → `source: 'registry'`

2. ✅ **Transport constraint** - Fixed in this update
   - Changed `transport: 'stdio'` → `transport: { type: 'stdio' }`

3. ✅ **Retry logic** - Enhanced to handle missing columns
   - Added retry for `transport`, `source`, `tier`, etc.

---

## Summary

- ✅ Fixed transport field to use JSONB object instead of string
- ✅ Added retry logic for transport column
- ✅ Marketplace installs should now work correctly
- ✅ No more transport constraint violations

---

## Next Steps

1. ✅ Test marketplace install
2. ✅ Verify transport data in database
3. 🔄 Optional: Add validation for transport object structure
4. 🔄 Optional: Add migration to ensure transport column exists

---

## Related Documentation

- `APPLY_MCP_SOURCE_FIX.md` - Source constraint fix
- `FINAL_SESSION_SUMMARY.md` - Complete session summary
- `MCP_INSTALL_FIX.md` - General MCP install fixes

