-- Fix auth_type constraint to allow NULL and all valid values
-- This migration ensures the auth_type constraint is properly configured

-- Drop the existing constraint if it exists
ALTER TABLE public.mcp_servers 
DROP CONSTRAINT IF EXISTS mcp_servers_auth_type_check;

-- Add the constraint back with NULL support
ALTER TABLE public.mcp_servers 
ADD CONSTRAINT mcp_servers_auth_type_check 
CHECK (auth_type IS NULL OR auth_type IN ('oauth', 'api_key', 'bearer'));

-- Update any existing 'none' values to NULL
UPDATE public.mcp_servers 
SET auth_type = NULL 
WHERE auth_type = 'none';

-- Add comment
COMMENT ON CONSTRAINT mcp_servers_auth_type_check ON public.mcp_servers IS 
'Ensures auth_type is either NULL (no auth) or one of the supported types: oauth, api_key, bearer';

