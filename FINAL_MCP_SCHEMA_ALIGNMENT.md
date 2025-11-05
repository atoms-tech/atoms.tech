# Final MCP Schema Alignment - Complete ✅

**Date:** 2025-11-06  
**Status:** ✅ ALL FIXES APPLIED

---

## Summary

All schema mismatches between code and cloud Supabase database have been fixed. The code now correctly uses the cloud database's check constraints and column names.

---

## Architecture Clarification

### **MCP Server Sources (User Perspective):**

1. **User-Initiated Servers**
   - User manually adds custom MCP servers
   - Only visible in their profile/installed tab
   - `source: 'custom'`, `tier: 'community'`, `scope: 'user'`

2. **Marketplace Servers** (combines 2 backend sources):
   - **Atoms-Initiated:** Platform admins add curated servers
   - **Registry-Pulled:** Auto-synced from Anthropic MCP registry
   - Both treated equally as "marketplace" from user perspective
   - `source: 'anthropic'`, `tier: 'community'`, `scope: 'user'`

3. **Organization Servers** (future):
   - Shared within an organization
   - `scope: 'organization'`

---

## Cloud Database Constraints (Verified)

### **mcp_servers.source**
**Allowed values:** `'anthropic'`, `'cline'`, `'custom'`
- `'anthropic'` - Anthropic MCP registry ✅ (used for marketplace)
- `'cline'` - Cline registry
- `'custom'` - User-added servers

### **mcp_servers.tier**
**Allowed values:** `'first-party'`, `'curated'`, `'community'`
- `'first-party'` - atoms.tech official servers
- `'curated'` - Admin-approved servers
- `'community'` - User-contributed servers ✅ (used for marketplace)

### **mcp_servers.auth_type**
**Allowed values:** `'oauth'`, `'bearer'`, `NULL`
- `'oauth'` - OAuth authentication
- `'bearer'` - Bearer token / API key ✅ (default for servers without auth)
- `NULL` - No authentication

---

## All Fixes Applied

### **1. mcp_servers.url** ✅
```typescript
url: server.repository || server.homepage || `https://github.com/${decodedNamespace}`
```

### **2. mcp_servers.auth_type** ✅
```typescript
const normalizeAuthType = (authType: string | undefined | null): string => {
  if (!authType || authType === 'none') return 'bearer';
  if (authType === 'oauth') return 'oauth';
  if (authType === 'api_key' || authType === 'bearer') return 'bearer';
  return 'bearer';
};
```

### **3. mcp_servers.source** ✅
```typescript
source: 'anthropic',  // For Anthropic MCP registry servers
```

### **4. mcp_servers.tier** ✅
```typescript
tier: 'community',  // For marketplace servers (user risk)
```

### **5. chat_sessions.org_id** ✅
```typescript
org_id: normalizedOrgId,  // NOT organization_id
```

### **6. chat_messages.tokens** ✅
```typescript
tokens_in: latest.tokens?.input ?? latest.tokens_in ?? 0,
tokens_out: latest.tokens?.output ?? latest.tokens_out ?? 0,
tokens_total: latest.tokens?.total ?? latest.tokens_total ?? 0,
```

### **7. chat_messages.content** ✅
```typescript
content: trimmedContent.length > 0 ? normalizedContent : null,
```

---

## Files Modified

### **1. src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts**
**Changes:**
- `source: 'anthropic'` (was 'marketplace', then 'registry')
- `tier: 'community'` (was 'marketplace')
- `auth_type: normalizeAuthType(...)` (defaults to 'bearer')
- Added `url` field (required)

### **2. src/app/api/chat/route.ts**
**Changes:**
- `org_id` instead of `organization_id`
- `tokens_in`, `tokens_out`, `tokens_total` instead of `tokens`
- Allow `null` content for messages

---

## Testing

### **MCP Install:**
1. Visit http://localhost:3001/marketplace
2. Click install on any server
3. Should succeed without constraint errors ✅

### **Chat:**
1. Create new chat session
2. Should succeed without org_id error ✅
3. Send messages
4. Should succeed without tokens error ✅

---

## Mapping Guide

### **For Marketplace Servers (Registry-Pulled):**
```typescript
{
  source: 'anthropic',      // From Anthropic MCP registry
  tier: 'community',        // User risk level
  scope: 'user',            // Installed per-user
  auth_type: 'bearer',      // Default for servers without auth
}
```

### **For User-Initiated Servers:**
```typescript
{
  source: 'custom',         // User added it
  tier: 'community',        // User risk level
  scope: 'user',            // Only visible to that user
  auth_type: 'bearer',      // Or 'oauth' if configured
}
```

### **For Atoms-Initiated Servers (Future):**
```typescript
{
  source: 'anthropic',      // Still from registry
  tier: 'curated',          // Admin-approved
  scope: 'user',            // Or 'system' for pre-installed
  auth_type: 'bearer',      // Or 'oauth'
}
```

---

## Status

**Code Fixes:** ✅ ALL APPLIED  
**Database Migrations:** ❌ NOT NEEDED  
**Testing:** ✅ READY  

---

**🎉 All schema mismatches resolved! MCP install and chat should work perfectly now!** 🚀

