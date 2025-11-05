-- Create mcp_servers table with 3-scope support (user, organization, project)
-- This table stores MCP server configurations for atomsAgent

CREATE TABLE IF NOT EXISTS public.mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Server identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope: user, organization, or project
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('user', 'organization', 'project')),
    
    -- Scope-specific references
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- MCP Server Configuration
    -- Transport type: stdio, sse, http
    transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('stdio', 'sse', 'http')),
    
    -- For stdio transport
    command TEXT,
    args TEXT[], -- Array of command arguments
    env JSONB DEFAULT '{}', -- Environment variables
    
    -- For HTTP/SSE transport
    url TEXT,
    
    -- Authentication
    requires_auth BOOLEAN DEFAULT FALSE,
    auth_type VARCHAR(20) CHECK (auth_type IN ('none', 'oauth', 'api_key', 'bearer')),
    auth_config JSONB DEFAULT '{}', -- OAuth client ID, scopes, etc.
    
    -- OAuth tokens (encrypted)
    oauth_access_token TEXT,
    oauth_refresh_token TEXT,
    oauth_token_expires_at TIMESTAMPTZ,
    
    -- API key (encrypted)
    api_key TEXT,
    
    -- Server metadata
    tags TEXT[] DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE, -- Can other users see/use this server?
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    
    -- Registry information (if from MCP registry)
    registry_namespace TEXT, -- e.g., "@modelcontextprotocol/server-github"
    registry_version TEXT,
    registry_source VARCHAR(50) CHECK (registry_source IN ('anthropic', 'cline', 'custom')),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT valid_scope CHECK (
        (scope = 'user' AND user_id IS NOT NULL AND organization_id IS NULL AND project_id IS NULL) OR
        (scope = 'organization' AND organization_id IS NOT NULL AND user_id IS NULL AND project_id IS NULL) OR
        (scope = 'project' AND project_id IS NOT NULL AND user_id IS NULL AND organization_id IS NULL)
    ),
    CONSTRAINT valid_transport_stdio CHECK (
        (transport_type = 'stdio' AND command IS NOT NULL) OR
        (transport_type != 'stdio')
    ),
    CONSTRAINT valid_transport_http CHECK (
        (transport_type IN ('http', 'sse') AND url IS NOT NULL) OR
        (transport_type NOT IN ('http', 'sse'))
    ),
    CONSTRAINT unique_name_per_scope UNIQUE NULLS NOT DISTINCT (scope, user_id, organization_id, project_id, name)
);

-- Create indexes
CREATE INDEX idx_mcp_servers_user_id ON public.mcp_servers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_mcp_servers_organization_id ON public.mcp_servers(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_mcp_servers_project_id ON public.mcp_servers(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_mcp_servers_scope ON public.mcp_servers(scope);
CREATE INDEX idx_mcp_servers_is_enabled ON public.mcp_servers(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX idx_mcp_servers_registry_namespace ON public.mcp_servers(registry_namespace) WHERE registry_namespace IS NOT NULL;
CREATE INDEX idx_mcp_servers_created_at ON public.mcp_servers(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mcp_servers_updated_at
    BEFORE UPDATE ON public.mcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_mcp_servers_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own servers
CREATE POLICY "Users can view their own MCP servers"
    ON public.mcp_servers
    FOR SELECT
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )) OR
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
        )) OR
        (is_public = TRUE)
    );

-- Policy: Users can create their own servers
CREATE POLICY "Users can create their own MCP servers"
    ON public.mcp_servers
    FOR INSERT
    WITH CHECK (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )) OR
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'member')
        ))
    );

-- Policy: Users can update their own servers
CREATE POLICY "Users can update their own MCP servers"
    ON public.mcp_servers
    FOR UPDATE
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )) OR
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'member')
        ))
    )
    WITH CHECK (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )) OR
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'member')
        ))
    );

-- Policy: Users can delete their own servers
CREATE POLICY "Users can delete their own MCP servers"
    ON public.mcp_servers
    FOR DELETE
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )) OR
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
        ))
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_servers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mcp_servers TO service_role;

