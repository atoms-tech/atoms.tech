-- Create system_prompts table with 3-scope support
CREATE TABLE IF NOT EXISTS public.system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('user', 'organization', 'system')),

    -- Scope-specific references
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,

    -- Version tracking
    version INTEGER DEFAULT 1,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_scope_user CHECK (
        (scope = 'user' AND user_id IS NOT NULL AND organization_id IS NULL) OR
        (scope = 'organization' AND organization_id IS NOT NULL AND user_id IS NULL) OR
        (scope = 'system' AND user_id IS NULL AND organization_id IS NULL)
    ),
    CONSTRAINT unique_default_per_scope UNIQUE NULLS NOT DISTINCT (scope, user_id, organization_id, is_default)
);

-- Create indexes for performance
CREATE INDEX idx_system_prompts_scope ON public.system_prompts(scope);
CREATE INDEX idx_system_prompts_user_id ON public.system_prompts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_system_prompts_organization_id ON public.system_prompts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_system_prompts_is_default ON public.system_prompts(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_system_prompts_is_public ON public.system_prompts(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_system_prompts_tags ON public.system_prompts USING GIN(tags);

-- Create full-text search index
CREATE INDEX idx_system_prompts_fts ON public.system_prompts USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''))
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_system_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_prompts_updated_at
    BEFORE UPDATE ON public.system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_system_prompts_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own prompts
CREATE POLICY "Users can view their own prompts"
    ON public.system_prompts
    FOR SELECT
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )) OR
        (scope = 'system' AND is_public = TRUE) OR
        (scope = 'system' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND admin_role IS NOT NULL
        ))
    );

-- Policy: Users can create their own prompts
CREATE POLICY "Users can create their own prompts"
    ON public.system_prompts
    FOR INSERT
    WITH CHECK (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    );

-- Policy: Platform admins can create system prompts
CREATE POLICY "Platform admins can create system prompts"
    ON public.system_prompts
    FOR INSERT
    WITH CHECK (
        scope = 'system' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND admin_role IS NOT NULL
        )
    );

-- Policy: Users can update their own prompts
CREATE POLICY "Users can update their own prompts"
    ON public.system_prompts
    FOR UPDATE
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    );

-- Policy: Platform admins can update system prompts
CREATE POLICY "Platform admins can update system prompts"
    ON public.system_prompts
    FOR UPDATE
    USING (
        scope = 'system' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND admin_role IS NOT NULL
        )
    );

-- Policy: Users can delete their own prompts
CREATE POLICY "Users can delete their own prompts"
    ON public.system_prompts
    FOR DELETE
    USING (
        (scope = 'user' AND user_id = auth.uid()) OR
        (scope = 'organization' AND organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        ))
    );

-- Policy: Platform admins can delete system prompts
CREATE POLICY "Platform admins can delete system prompts"
    ON public.system_prompts
    FOR DELETE
    USING (
        scope = 'system' AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND admin_role IS NOT NULL
        )
    );

-- Create function to get merged prompt with 3-scope hierarchy
CREATE OR REPLACE FUNCTION public.get_merged_system_prompt(
    p_user_id UUID,
    p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
    merged_content TEXT,
    system_prompt_id UUID,
    organization_prompt_id UUID,
    user_prompt_id UUID,
    system_content TEXT,
    organization_content TEXT,
    user_content TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH system_default AS (
        SELECT id, content
        FROM public.system_prompts
        WHERE scope = 'system' AND is_default = TRUE
        ORDER BY created_at DESC
        LIMIT 1
    ),
    org_default AS (
        SELECT id, content
        FROM public.system_prompts
        WHERE scope = 'organization'
            AND organization_id = p_organization_id
            AND is_default = TRUE
        ORDER BY created_at DESC
        LIMIT 1
    ),
    user_default AS (
        SELECT id, content
        FROM public.system_prompts
        WHERE scope = 'user'
            AND user_id = p_user_id
            AND is_default = TRUE
        ORDER BY created_at DESC
        LIMIT 1
    )
    SELECT
        -- Merged content with proper line breaks
        COALESCE(
            (SELECT content FROM system_default) || E'\n\n' ||
            COALESCE((SELECT content FROM org_default) || E'\n\n', '') ||
            COALESCE((SELECT content FROM user_default), ''),
            (SELECT content FROM system_default),
            'You are a helpful AI assistant.'
        ) AS merged_content,
        (SELECT id FROM system_default) AS system_prompt_id,
        (SELECT id FROM org_default) AS organization_prompt_id,
        (SELECT id FROM user_default) AS user_prompt_id,
        (SELECT content FROM system_default) AS system_content,
        (SELECT content FROM org_default) AS organization_content,
        (SELECT content FROM user_default) AS user_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system prompt
INSERT INTO public.system_prompts (
    name,
    description,
    content,
    scope,
    is_default,
    is_public,
    tags
) VALUES (
    'Default AI Assistant',
    'General-purpose helpful AI assistant prompt',
    'You are a helpful, harmless, and honest AI assistant. Your goal is to provide accurate and useful information while being respectful and considerate of the user''s needs.',
    'system',
    TRUE,
    TRUE,
    ARRAY['default', 'general', 'assistant']
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_prompts TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_merged_system_prompt TO authenticated;
