-- Fix RLS Policies for Organization and Chat Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql

-- ============================================================================
-- PART 1: Enable RLS on tables (if not already enabled)
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mcp_servers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Drop existing policies (to avoid conflicts)
-- ============================================================================

-- Organizations
DROP POLICY IF EXISTS "Users can read organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Members can read their organizations" ON public.organizations;

-- Organization Members
DROP POLICY IF EXISTS "Users can read their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can read organization members" ON public.organization_members;

-- Organization Invitations
DROP POLICY IF EXISTS "Users can read invitations by email" ON public.organization_invitations;
DROP POLICY IF EXISTS "Users can read their invitations" ON public.organization_invitations;

-- Chat Sessions
DROP POLICY IF EXISTS "Users can read their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;

-- Chat Messages
DROP POLICY IF EXISTS "Users can read messages from their sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete messages from their sessions" ON public.chat_messages;

-- MCP Servers
DROP POLICY IF EXISTS "Users can read their own MCP servers" ON public.mcp_servers;
DROP POLICY IF EXISTS "Users can create their own MCP servers" ON public.mcp_servers;
DROP POLICY IF EXISTS "Users can update their own MCP servers" ON public.mcp_servers;
DROP POLICY IF EXISTS "Users can delete their own MCP servers" ON public.mcp_servers;

-- User MCP Servers
DROP POLICY IF EXISTS "Users can read their own server installations" ON public.user_mcp_servers;
DROP POLICY IF EXISTS "Users can create their own server installations" ON public.user_mcp_servers;
DROP POLICY IF EXISTS "Users can update their own server installations" ON public.user_mcp_servers;
DROP POLICY IF EXISTS "Users can delete their own server installations" ON public.user_mcp_servers;

-- ============================================================================
-- PART 3: Create new RLS policies
-- ============================================================================

-- Organizations: Members can read their organizations
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

-- Organization Members: Users can read their own memberships
CREATE POLICY "Users can read their own memberships"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Organization Members: Users can read members of their organizations
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

-- Organization Invitations: Users can read invitations by their email
CREATE POLICY "Users can read their invitations"
ON public.organization_invitations
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Chat Sessions: Users can manage their own sessions
CREATE POLICY "Users can read their own chat sessions"
ON public.chat_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chat sessions"
ON public.chat_sessions
FOR DELETE
USING (user_id = auth.uid());

-- Chat Messages: Users can manage messages in their sessions
CREATE POLICY "Users can read messages from their sessions"
ON public.chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their sessions"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their sessions"
ON public.chat_messages
FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages from their sessions"
ON public.chat_messages
FOR DELETE
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
  )
);

-- MCP Servers: Users can manage their own servers
CREATE POLICY "Users can read their own MCP servers"
ON public.mcp_servers
FOR SELECT
USING (user_id = auth.uid() OR scope = 'system');

CREATE POLICY "Users can create their own MCP servers"
ON public.mcp_servers
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own MCP servers"
ON public.mcp_servers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own MCP servers"
ON public.mcp_servers
FOR DELETE
USING (user_id = auth.uid());

-- User MCP Servers: Users can manage their own installations
CREATE POLICY "Users can read their own server installations"
ON public.user_mcp_servers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own server installations"
ON public.user_mcp_servers
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own server installations"
ON public.user_mcp_servers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own server installations"
ON public.user_mcp_servers
FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- PART 4: Verify policies were created
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'organization_members', 'organization_invitations', 'chat_sessions', 'chat_messages', 'mcp_servers', 'user_mcp_servers')
ORDER BY tablename, policyname;

