-- Fix auth_type constraint to allow NULL and all valid values
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql

-- Step 1: Drop the existing constraint if it exists
ALTER TABLE public.mcp_servers 
DROP CONSTRAINT IF EXISTS mcp_servers_auth_type_check;

-- Step 2: Add the constraint back with NULL support
-- NULL means no authentication required (replaces the old 'none' value)
ALTER TABLE public.mcp_servers 
ADD CONSTRAINT mcp_servers_auth_type_check 
CHECK (auth_type IS NULL OR auth_type IN ('oauth', 'api_key', 'bearer'));

-- Step 3: Update any existing 'none' values to NULL
UPDATE public.mcp_servers 
SET auth_type = NULL 
WHERE auth_type = 'none';

-- Step 4: Verify the fix
SELECT 
  namespace,
  name,
  auth_type,
  CASE 
    WHEN auth_type IS NULL THEN 'No auth (NULL)'
    ELSE auth_type 
  END as auth_status
FROM public.mcp_servers
ORDER BY created_at DESC
LIMIT 10;

