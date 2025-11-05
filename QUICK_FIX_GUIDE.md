# Quick Fix Guide - MCP Server Installation Error

**Error:** `new row for relation "mcp_servers" violates check constraint "mcp_servers_auth_type_check"`

---

## 🚀 Quick Fix (2 Steps)

### Step 1: Run SQL in Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql
2. Paste this SQL:

```sql
-- Fix auth_type constraint
ALTER TABLE public.mcp_servers DROP CONSTRAINT IF EXISTS mcp_servers_auth_type_check;
ALTER TABLE public.mcp_servers ADD CONSTRAINT mcp_servers_auth_type_check CHECK (auth_type IS NULL OR auth_type IN ('oauth', 'api_key', 'bearer'));
UPDATE public.mcp_servers SET auth_type = NULL WHERE auth_type = 'none';
```

3. Click **Run**

### Step 2: Restart Your App

```bash
# The code is already fixed, just restart
cd atoms.tech
npm run dev
```

---

## ✅ Test It Works

Try installing a server again:

```bash
# In your browser, go to the marketplace and click "Install" on any server
# Or use curl:
curl -X POST http://localhost:3000/api/mcp/marketplace/ai.alpic.test%2Ftest-mcp-server/install
```

Should work now! ✨

---

## 📚 More Details

See `MCP_INSTALL_AUTH_TYPE_FIX.md` for full explanation.

