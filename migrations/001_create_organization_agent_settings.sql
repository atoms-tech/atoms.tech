-- Create organization_agent_settings table for storing AI agent configuration per organization
CREATE TABLE IF NOT EXISTS organization_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mcp_integrations JSONB DEFAULT '{}' NOT NULL,
    advanced_settings JSONB DEFAULT '{
        "debugMode": false,
        "customPrompts": "",
        "apiTimeout": 30,
        "maxRetries": 3,
        "enableLogging": true,
        "logLevel": "info"
    }' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one settings record per organization
    CONSTRAINT unique_org_agent_settings UNIQUE (organization_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_agent_settings_org_id 
ON organization_agent_settings(organization_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_organization_agent_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organization_agent_settings_updated_at
    BEFORE UPDATE ON organization_agent_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_agent_settings_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE organization_agent_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access settings for organizations they belong to
CREATE POLICY organization_agent_settings_access_policy 
ON organization_agent_settings
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_agent_settings TO authenticated;
GRANT USAGE ON SEQUENCE organization_agent_settings_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE organization_agent_settings IS 'Stores AI agent configuration and MCP integration settings per organization';
COMMENT ON COLUMN organization_agent_settings.organization_id IS 'Reference to the organization this configuration belongs to';
COMMENT ON COLUMN organization_agent_settings.mcp_integrations IS 'JSON object storing MCP integration status and metadata';
COMMENT ON COLUMN organization_agent_settings.advanced_settings IS 'JSON object storing advanced agent configuration options';
