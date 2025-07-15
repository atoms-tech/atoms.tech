-- Integrations Database Schema
-- This script creates the necessary tables for OAuth and MCP integrations

-- OAuth integrations table
CREATE TABLE IF NOT EXISTS oauth_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'jira', 'slack')),
    access_token_vault_key VARCHAR(255) NOT NULL,
    refresh_token_vault_key VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one integration per provider per organization
    UNIQUE(organization_id, provider)
);

-- MCP configurations table
CREATE TABLE IF NOT EXISTS mcp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('webhook', 'api', 'custom')),
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique names per organization
    UNIQUE(organization_id, name)
);

-- Vault secrets table for secure token storage
CREATE TABLE IF NOT EXISTS vault_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL, -- Encrypted value
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique keys per organization
    UNIQUE(organization_id, key)
);

-- Integration health monitoring table
CREATE TABLE IF NOT EXISTS integration_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    integration_type VARCHAR(20) NOT NULL CHECK (integration_type IN ('oauth', 'mcp')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_success TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints based on integration type
    CONSTRAINT fk_oauth_integration 
        FOREIGN KEY (integration_id) 
        REFERENCES oauth_integrations(id) 
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED,
    
    CONSTRAINT fk_mcp_integration 
        FOREIGN KEY (integration_id) 
        REFERENCES mcp_configurations(id) 
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED
);

-- Integration usage logs for analytics
CREATE TABLE IF NOT EXISTS integration_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    integration_type VARCHAR(20) NOT NULL CHECK (integration_type IN ('oauth', 'mcp')),
    action VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_integrations_org_provider ON oauth_integrations(organization_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_integrations_user ON oauth_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_integrations_status ON oauth_integrations(status);

CREATE INDEX IF NOT EXISTS idx_mcp_configurations_org ON mcp_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_mcp_configurations_type ON mcp_configurations(type);
CREATE INDEX IF NOT EXISTS idx_mcp_configurations_active ON mcp_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_vault_secrets_org_key ON vault_secrets(organization_id, key);
CREATE INDEX IF NOT EXISTS idx_vault_secrets_updated ON vault_secrets(updated_at);

CREATE INDEX IF NOT EXISTS idx_integration_health_integration ON integration_health(integration_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);
CREATE INDEX IF NOT EXISTS idx_integration_health_checked ON integration_health(last_checked);

CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_integration ON integration_usage_logs(integration_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_org ON integration_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_usage_logs_created ON integration_usage_logs(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE oauth_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_usage_logs ENABLE ROW LEVEL SECURITY;

-- OAuth integrations policies
CREATE POLICY "Users can view oauth integrations for their organizations" ON oauth_integrations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage oauth integrations for their organizations" ON oauth_integrations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- MCP configurations policies
CREATE POLICY "Users can view mcp configurations for their organizations" ON mcp_configurations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage mcp configurations for their organizations" ON mcp_configurations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Vault secrets policies (most restrictive)
CREATE POLICY "Only system can access vault secrets" ON vault_secrets
    FOR ALL USING (false); -- Only accessible via service role

-- Integration health policies
CREATE POLICY "Users can view integration health for their organizations" ON integration_health
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM oauth_integrations oi 
            WHERE oi.id = integration_id 
            AND oi.organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM mcp_configurations mc 
            WHERE mc.id = integration_id 
            AND mc.organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Integration usage logs policies
CREATE POLICY "Users can view usage logs for their organizations" ON integration_usage_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_oauth_integrations_updated_at 
    BEFORE UPDATE ON oauth_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_configurations_updated_at 
    BEFORE UPDATE ON mcp_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_secrets_updated_at 
    BEFORE UPDATE ON vault_secrets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Update expired integrations
    UPDATE oauth_integrations 
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at < NOW() AND status = 'active';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO integration_usage_logs (
        integration_id, 
        integration_type, 
        action, 
        user_id, 
        organization_id, 
        success, 
        metadata
    )
    SELECT 
        id,
        'oauth',
        'token_expired',
        user_id,
        organization_id,
        true,
        jsonb_build_object('cleanup_timestamp', NOW())
    FROM oauth_integrations 
    WHERE status = 'expired' AND updated_at > NOW() - INTERVAL '1 minute';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get integration statistics
CREATE OR REPLACE FUNCTION get_integration_stats(org_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'oauth_integrations', (
            SELECT jsonb_object_agg(
                provider,
                jsonb_build_object(
                    'status', status,
                    'last_connected', created_at,
                    'scopes', scopes
                )
            )
            FROM oauth_integrations 
            WHERE organization_id = org_id
        ),
        'mcp_integrations', (
            SELECT jsonb_object_agg(
                name,
                jsonb_build_object(
                    'type', type,
                    'is_active', is_active,
                    'created_at', created_at
                )
            )
            FROM mcp_configurations 
            WHERE organization_id = org_id
        ),
        'health_summary', (
            SELECT jsonb_build_object(
                'healthy', COUNT(*) FILTER (WHERE status = 'healthy'),
                'degraded', COUNT(*) FILTER (WHERE status = 'degraded'),
                'unhealthy', COUNT(*) FILTER (WHERE status = 'unhealthy'),
                'unknown', COUNT(*) FILTER (WHERE status = 'unknown')
            )
            FROM integration_health ih
            WHERE EXISTS (
                SELECT 1 FROM oauth_integrations oi 
                WHERE oi.id = ih.integration_id 
                AND oi.organization_id = org_id
            ) OR EXISTS (
                SELECT 1 FROM mcp_configurations mc 
                WHERE mc.id = ih.integration_id 
                AND mc.organization_id = org_id
            )
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;
