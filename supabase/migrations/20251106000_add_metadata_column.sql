-- Add metadata column to mcp_servers table
-- This column stores additional server metadata as JSON

ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN public.mcp_servers.metadata IS 'Additional server metadata stored as JSON';

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_mcp_servers_metadata ON public.mcp_servers USING gin(metadata);

