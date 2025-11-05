-- Add missing columns to mcp_servers table to match API expectations
-- This migration adds columns that the API queries but don't exist in the schema

-- Add namespace column (alias for registry_namespace)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS namespace TEXT;

-- Add source column (alias for registry_source)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

-- Add transport column (JSONB to store full transport config)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS transport JSONB DEFAULT '{}'::jsonb;

-- Add auth column (JSONB to store full auth config)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS auth JSONB DEFAULT '{}'::jsonb;

-- Add auth_status column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS auth_status VARCHAR(20) DEFAULT 'needs_auth';

-- Add enabled column (alias for is_enabled)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

-- Add config column (general configuration JSONB)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Add stdio_config column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS stdio_config JSONB DEFAULT '{}'::jsonb;

-- Add proxy_config column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS proxy_config JSONB DEFAULT '{}'::jsonb;

-- Add server_url column (for HTTP/SSE transports)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS server_url TEXT;

-- Add category column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add repository_url column (alias for registry info)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS repository_url TEXT;

-- Add homepage_url column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- Add documentation_url column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS documentation_url TEXT;

-- Add stars column (GitHub stars)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS stars INTEGER DEFAULT 0;

-- Add install_count column
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS install_count INTEGER DEFAULT 0;

-- Add tier column (for curation tier)
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20);

-- Add deleted_at and deleted_by for soft deletes
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add last_test columns
ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ;

ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS last_test_status VARCHAR(20);

ALTER TABLE public.mcp_servers 
ADD COLUMN IF NOT EXISTS last_test_error TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_mcp_servers_namespace ON public.mcp_servers(namespace) WHERE namespace IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_servers_source ON public.mcp_servers(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_servers_category ON public.mcp_servers(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tier ON public.mcp_servers(tier) WHERE tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcp_servers_is_deleted ON public.mcp_servers(is_deleted) WHERE is_deleted = FALSE;

-- Add comments
COMMENT ON COLUMN public.mcp_servers.namespace IS 'Server namespace (e.g., @modelcontextprotocol/server-github)';
COMMENT ON COLUMN public.mcp_servers.source IS 'Registry source (anthropic, cline, custom)';
COMMENT ON COLUMN public.mcp_servers.transport IS 'Full transport configuration as JSON';
COMMENT ON COLUMN public.mcp_servers.auth IS 'Full authentication configuration as JSON';
COMMENT ON COLUMN public.mcp_servers.auth_status IS 'Authentication status (authenticated, needs_auth, error)';
COMMENT ON COLUMN public.mcp_servers.config IS 'General server configuration as JSON';
COMMENT ON COLUMN public.mcp_servers.tier IS 'Curation tier (first-party, curated, community, all)';

