-- Ensure INSERT policy exists for mcp_servers table
-- This policy allows users to create servers when authenticated via WorkOS JWT

-- First, fix the SELECT policy to remove reference to non-existent is_public column
DROP POLICY IF EXISTS "Users can view their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can view their own MCP servers"
    ON public.mcp_servers
    FOR SELECT
    TO authenticated
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
        ))
    );

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can create their own MCP servers" ON public.mcp_servers;

-- Create INSERT policy for authenticated users
-- This policy checks that auth.uid() matches the user_id being inserted
CREATE POLICY "Users can create their own MCP servers"
    ON public.mcp_servers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User-scoped servers: user_id must match auth.uid()
        (scope = 'user' AND user_id = auth.uid()) OR
        -- Organization-scoped servers: user must be admin/owner of the org
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )) OR
        -- Project-scoped servers: user must be member/admin/owner of the org
        (scope = 'project' AND project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'member')
        ))
    );

-- Also ensure UPDATE and DELETE policies exist
DROP POLICY IF EXISTS "Users can update their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can update their own MCP servers"
    ON public.mcp_servers
    FOR UPDATE
    TO authenticated
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

DROP POLICY IF EXISTS "Users can delete their own MCP servers" ON public.mcp_servers;
CREATE POLICY "Users can delete their own MCP servers"
    ON public.mcp_servers
    FOR DELETE
    TO authenticated
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
