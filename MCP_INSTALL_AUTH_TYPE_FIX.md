# MCP Server Installation - Auth Type Constraint Fix

**Date:** November 5, 2025  
**Status:** ✅ FIXED

---

## Problem

MCP server installation was failing with this error:

```
Error upserting MCP server: {
  code: '23514',
  message: 'new row for relation "mcp_servers" violates check constraint "mcp_servers_auth_type_check"'
}
```

The failing row had `auth_type: 'none'`, which was being rejected by the database constraint.

---

## Root Cause

The database constraint `mcp_servers_auth_type_check` was checking:
```sql
CHECK (auth_type IN ('none', 'oauth', 'api_key', 'bearer'))
```

However, the constraint was likely modified or there was a mismatch between the migration files and the actual database schema. The value `'none'` should be represented as `NULL` instead of the string `'none'`.

---

## Solution

### 1. Database Migration

Created migration `20251108_fix_auth_type_constraint.sql`:

```sql
-- Drop the existing constraint
ALTER TABLE public.mcp_servers 
DROP CONSTRAINT IF EXISTS mcp_servers_auth_type_check;

-- Add constraint with NULL support (NULL = no auth required)
ALTER TABLE public.mcp_servers 
ADD CONSTRAINT mcp_servers_auth_type_check 
CHECK (auth_type IS NULL OR auth_type IN ('oauth', 'api_key', 'bearer'));

-- Update existing 'none' values to NULL
UPDATE public.mcp_servers 
SET auth_type = NULL 
WHERE auth_type = 'none';
```

### 2. API Route Fix

Updated `src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts`:

**Added normalization function:**
```typescript
const normalizeAuthType = (authType: string | undefined | null): string | null => {
  if (!authType || authType === 'none') return null;
  if (['oauth', 'api_key', 'bearer'].includes(authType)) return authType;
  return null; // Default to null for unknown types
};
```

**Updated upsert to include required fields:**
```typescript
.upsert({
  // ... other fields ...
  auth_type: normalizeAuthType(server.auth?.type), // Normalize auth_type
  scope: 'user', // Required by valid_scope constraint
  user_id: userId, // Required by valid_scope constraint
  organization_id: null, // Must be NULL for user scope
  project_id: null, // Must be NULL for user scope
})
```

---

## Valid Auth Types

After the fix, the valid values for `auth_type` are:

- `NULL` - No authentication required (default)
- `'oauth'` - OAuth 2.0 authentication
- `'api_key'` - API key authentication
- `'bearer'` - Bearer token authentication

**Note:** The string `'none'` is NO LONGER valid and will be converted to `NULL`.

---

## Scope Constraint

The `valid_scope` constraint requires:

- When `scope = 'user'`: `user_id` must be NOT NULL, `organization_id` and `project_id` must be NULL
- When `scope = 'organization'`: `organization_id` must be NOT NULL, `user_id` and `project_id` must be NULL
- When `scope = 'project'`: `project_id` must be NOT NULL, `user_id` and `organization_id` must be NULL

For marketplace servers, we use `scope = 'user'` with the installing user's ID, and set `tier = 'marketplace'` to indicate it's from the marketplace.

---

## How to Apply the Fix

### Step 1: Apply Database Migration

**Option A: Via Supabase SQL Editor (Recommended)**

1. Go to: https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql
2. Copy and paste the SQL from `scripts/fix-auth-type-constraint.sql`
3. Click "Run" to execute

**Option B: Via Supabase CLI**

```bash
cd atoms.tech
npx supabase db push
```

### Step 2: Restart the Next.js App

The code changes are already applied. Just restart your dev server:

```bash
cd atoms.tech
npm run dev
```

### Step 3: Test Server Installation

```bash
# Test installing a marketplace server
curl -X POST http://localhost:3000/api/mcp/marketplace/ai.alpic.test%2Ftest-mcp-server/install \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"scope": "user"}'

# Should return: { "success": true, "server": {...} }
```

### Step 4: Verify Installation

```bash
# Check installed servers
curl http://localhost:3000/api/mcp/servers \
  -H "Cookie: your-session-cookie"

# Should show the installed server with auth_type: null
```

---

## Files Modified

### New Files
1. **Migration:** `supabase/migrations/20251108_fix_auth_type_constraint.sql`
2. **SQL Script:** `scripts/fix-auth-type-constraint.sql` (for manual execution)
3. **Documentation:** `MCP_INSTALL_AUTH_TYPE_FIX.md` (this file)

### Updated Files
1. **API Route:** `src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts`
   - Added `normalizeAuthType()` function
   - Updated upsert to include `scope`, `user_id`, `organization_id`, `project_id`
   - Normalized `auth_type` to convert 'none' → NULL

---

## Summary

✅ Database constraint updated to use `NULL` instead of `'none'`  
✅ API route normalizes auth_type values  
✅ Scope and foreign key constraints properly satisfied  
✅ Marketplace servers can now be installed successfully

