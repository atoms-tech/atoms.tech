-- Create base tables that other migrations depend on
-- This should run before all other migrations

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    workos_id VARCHAR(255) UNIQUE, -- WorkOS user ID for SSO
    admin_role VARCHAR(50), -- For platform admins: 'super_admin', 'admin', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create models table
CREATE TABLE IF NOT EXISTS public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    description TEXT,
    context_window INTEGER,
    max_tokens INTEGER,
    pricing_input DECIMAL(10, 6),
    pricing_output DECIMAL(10, 6),
    capabilities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, model_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (scope IN ('user', 'organization', 'system')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_models_provider ON public.models(provider);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON public.agents(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- Organizations: Members can read
CREATE POLICY "Members can read organizations" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Organization members: Members can read
CREATE POLICY "Members can read organization members" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Models: Everyone can read
CREATE POLICY "Everyone can read models" ON public.models
    FOR SELECT USING (true);

-- Agents: Users can read their own agents
CREATE POLICY "Users can read own agents" ON public.agents
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create own agents" ON public.agents
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own agents" ON public.agents
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own agents" ON public.agents
    FOR DELETE USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

