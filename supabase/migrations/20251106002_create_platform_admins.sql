-- Create platform_admins table for managing platform administrators
-- This table stores users who have admin privileges across the platform

CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    workos_user_id TEXT,
    email VARCHAR(255) NOT NULL UNIQUE,
    name TEXT,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure either user_id or workos_user_id is provided
    CONSTRAINT platform_admins_user_reference CHECK (
        (user_id IS NOT NULL) OR (workos_user_id IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX idx_platform_admins_user_id ON public.platform_admins(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_platform_admins_workos_user_id ON public.platform_admins(workos_user_id) WHERE workos_user_id IS NOT NULL;
CREATE INDEX idx_platform_admins_email ON public.platform_admins(email);
CREATE INDEX idx_platform_admins_is_active ON public.platform_admins(is_active) WHERE is_active = TRUE;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_platform_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_admins_updated_at
    BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_admins_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own admin status
CREATE POLICY "Users can view their own admin status"
    ON public.platform_admins
    FOR SELECT
    USING (
        (user_id = auth.uid()) OR
        (workos_user_id IS NOT NULL AND workos_user_id IN (
            SELECT p.workos_id FROM public.profiles p WHERE p.id = auth.uid()
        ))
    );

-- Policy: Only platform admins can manage other admins
CREATE POLICY "Platform admins can manage admin records"
    ON public.platform_admins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_admins pa
            WHERE pa.is_active = TRUE
            AND (
                (pa.user_id = auth.uid()) OR
                (pa.workos_user_id IS NOT NULL AND pa.workos_user_id IN (
                    SELECT p.workos_id FROM public.profiles p WHERE p.id = auth.uid()
                ))
            )
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_admins TO service_role;