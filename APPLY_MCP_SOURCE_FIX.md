# Apply MCP Source Constraint Fix

## Problem

When installing MCP servers from the marketplace, you're getting this error:

```
Error upserting MCP server: {
  code: '23514',
  message: 'new row for relation "mcp_servers" violates check constraint "mcp_servers_source_check"'
}
```

## Root Cause

The database has a CHECK constraint on the `source` column that doesn't include `'registry'` as a valid value. The constraint was likely created manually in the cloud database and doesn't match the code.

## Solution

A migration has been created to fix the constraint:

**File:** `supabase/migrations/20251106002_fix_mcp_source_constraint.sql`

This migration:
1. Drops the existing incorrect constraint
2. Adds a new constraint with the correct allowed values
3. Adds proper documentation

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

```bash
cd atoms.tech

# Make sure you're logged in
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration to the cloud database
npx supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20251106002_fix_mcp_source_constraint.sql`
6. Click **Run**

### Option 3: Manual SQL Execution

Copy this SQL and run it in your Supabase SQL editor:

```sql
-- Drop existing constraints if they exist
ALTER TABLE public.mcp_servers 
DROP CONSTRAINT IF EXISTS mcp_servers_source_check;

ALTER TABLE public.mcp_servers 
DROP CONSTRAINT IF EXISTS mcp_servers_tier_check;

-- Add proper constraints with correct allowed values
-- Source can be: 'registry', 'github', 'npm', 'custom', 'anthropic', 'cline'
ALTER TABLE public.mcp_servers 
ADD CONSTRAINT mcp_servers_source_check 
CHECK (source IS NULL OR source IN ('registry', 'github', 'npm', 'custom', 'anthropic', 'cline'));

-- Tier can be: 'first-party', 'curated', 'community', 'all'
ALTER TABLE public.mcp_servers 
ADD CONSTRAINT mcp_servers_tier_check 
CHECK (tier IS NULL OR tier IN ('first-party', 'curated', 'community', 'all'));
```

## Verification

After applying the migration, test by installing an MCP server:

1. Go to the marketplace in your app
2. Try installing a server (e.g., `ai.gomarble/mcp-api`)
3. Should succeed without constraint errors

### Expected Result

✅ **Before:** Error with constraint violation
✅ **After:** Server installs successfully

## Valid Values Reference

### Source Column

The `source` column can have these values:

- `'registry'` - MCP registry (default for marketplace installs)
- `'github'` - GitHub repository
- `'npm'` - NPM package
- `'custom'` - Custom source
- `'anthropic'` - Anthropic registry
- `'cline'` - Cline registry
- `NULL` - No source specified

### Tier Column

The `tier` column can have these values:

- `'first-party'` - Official/first-party servers
- `'curated'` - Verified/curated servers
- `'community'` - Community-contributed servers
- `'all'` - Any tier
- `NULL` - No tier specified

## Code Reference

The install route already uses the correct value:

```typescript
// atoms.tech/src/app/(protected)/api/mcp/marketplace/[namespace]/install/route.ts
const mcpServerData = {
    // ... other fields
    source: 'registry',  // ✅ Correct value
    // ...
};
```

## Troubleshooting

### Migration fails with "constraint already exists"

This is fine - the migration uses `IF EXISTS` to handle this case. The constraint will be dropped and recreated with the correct values.

### Still getting constraint errors after migration

1. Verify the migration was applied:
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conrelid = 'public.mcp_servers'::regclass 
   AND conname LIKE '%source%';
   ```

2. Check the constraint definition includes `'registry'`:
   ```sql
   -- Should show: CHECK (source IS NULL OR source IN ('registry', 'github', 'npm', 'custom', 'anthropic', 'cline'))
   ```

3. If still failing, manually drop and recreate:
   ```sql
   ALTER TABLE public.mcp_servers DROP CONSTRAINT mcp_servers_source_check;
   ALTER TABLE public.mcp_servers ADD CONSTRAINT mcp_servers_source_check 
   CHECK (source IS NULL OR source IN ('registry', 'github', 'npm', 'custom', 'anthropic', 'cline'));
   ```

## Summary

- ✅ Migration created: `20251106002_fix_mcp_source_constraint.sql`
- ✅ Fixes constraint to allow `'registry'` value
- ✅ Also fixes tier constraint for future use
- ✅ Includes proper documentation

Apply the migration using one of the methods above, then test marketplace installs!

