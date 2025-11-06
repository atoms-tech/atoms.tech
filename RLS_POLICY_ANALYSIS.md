# RLS Policy Analysis & Fixes

**Date:** 2025-11-06  
**Status:** ✅ ANALYSIS COMPLETE

---

## Errors Identified

### **1. Organization Memberships**
```
Error fetching memberships: {}
```

**Query:** `organization_members` table  
**Issue:** No RLS policy allowing users to read their own memberships  
**Impact:** Users can't see which organizations they belong to

---

### **2. Organization Invitations**
```
Error fetching organization invitations by email: {}
```

**Query:** `organization_invitations` table  
**Issue:** No RLS policy allowing users to read invitations by their email  
**Impact:** Users can't see pending invitations

---

### **3. Organizations**
```
Error in useOrganizationsByMembership: {}
```

**Query:** `organizations` table  
**Issue:** No RLS policy allowing members to read their organizations  
**Impact:** Users can't see organization details

---

## Root Cause

**RLS (Row Level Security) is enabled** on these tables, but **no policies exist** to allow users to read their own data.

When RLS is enabled without policies:
- ✅ Service role can access everything
- ❌ Authenticated users get empty results (not errors, just `{}`)
- ❌ Anonymous users get empty results

---

## Solution

Created comprehensive RLS policies in `fix_rls_policies.sql`

### **Organizations**
```sql
-- Members can read their organizations
CREATE POLICY "Members can read their organizations"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### **Organization Members**
```sql
-- Users can read their own memberships
CREATE POLICY "Users can read their own memberships"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Users can read members of their organizations
CREATE POLICY "Users can read organization members"
ON public.organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### **Organization Invitations**
```sql
-- Users can read invitations by their email
CREATE POLICY "Users can read their invitations"
ON public.organization_invitations
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
```

### **Chat Sessions**
```sql
-- Users can manage their own sessions
CREATE POLICY "Users can read their own chat sessions"
ON public.chat_sessions
FOR SELECT
USING (user_id = auth.uid());

-- + INSERT, UPDATE, DELETE policies
```

### **Chat Messages**
```sql
-- Users can manage messages in their sessions
CREATE POLICY "Users can read messages from their sessions"
ON public.chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- + INSERT, UPDATE, DELETE policies
```

### **MCP Servers**
```sql
-- Users can read their own servers + system servers
CREATE POLICY "Users can read their own MCP servers"
ON public.mcp_servers
FOR SELECT
USING (user_id = auth.uid() OR scope = 'system');

-- + INSERT, UPDATE, DELETE policies
```

### **User MCP Servers**
```sql
-- Users can manage their own installations
CREATE POLICY "Users can read their own server installations"
ON public.user_mcp_servers
FOR SELECT
USING (user_id = auth.uid());

-- + INSERT, UPDATE, DELETE policies
```

---

## How to Apply

### **Step 1: Open Supabase SQL Editor**
1. Go to https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql
2. Click "New Query"

### **Step 2: Run the Migration**
1. Open `fix_rls_policies.sql`
2. Copy the entire SQL
3. Paste into SQL Editor
4. Click "Run"

### **Step 3: Verify**
The script will output all created policies at the end. You should see:
- 1 policy for `organizations`
- 2 policies for `organization_members`
- 1 policy for `organization_invitations`
- 4 policies for `chat_sessions` (SELECT, INSERT, UPDATE, DELETE)
- 4 policies for `chat_messages`
- 4 policies for `mcp_servers`
- 4 policies for `user_mcp_servers`

**Total: 20 policies**

---

## Testing After Fix

### **Test 1: Organization Memberships**
```typescript
// Should return user's memberships
const { data, error } = await supabase
  .from('organization_members')
  .select('*')
  .eq('user_id', userId);

// Before: error = {} (empty due to RLS)
// After: data = [...memberships]
```

### **Test 2: Organization Invitations**
```typescript
// Should return invitations for user's email
const { data, error } = await supabase
  .from('organization_invitations')
  .select('*')
  .eq('email', userEmail);

// Before: error = {} (empty due to RLS)
// After: data = [...invitations]
```

### **Test 3: Organizations**
```typescript
// Should return organizations user is a member of
const { data, error } = await supabase
  .from('organizations')
  .select('*');

// Before: error = {} (empty due to RLS)
// After: data = [...organizations]
```

---

## Impact

### **Before:**
- ❌ Organization features don't work
- ❌ Users can't see their memberships
- ❌ Users can't see invitations
- ❌ Console errors on every page load

### **After:**
- ✅ Organization features work
- ✅ Users can see their memberships
- ✅ Users can see invitations
- ✅ No console errors
- ✅ Chat sessions work properly
- ✅ MCP servers work properly

---

## Security Notes

### **Principle of Least Privilege:**
- Users can only read/write their own data
- Users can only see organizations they're members of
- Users can only see invitations for their email
- System-scoped MCP servers are visible to all users

### **No Service Role Needed:**
- All policies use `auth.uid()` for user identification
- No need for service role client in frontend
- Secure by default

---

## Files Created

1. **`fix_rls_policies.sql`** - Complete RLS policy migration
2. **`RLS_POLICY_ANALYSIS.md`** - This analysis document

---

## Status

**Analysis:** ✅ COMPLETE  
**Migration Script:** ✅ READY  
**Testing:** ⏳ PENDING (after migration)  

---

**🎉 Apply the migration to fix all organization and chat errors!** 🚀

