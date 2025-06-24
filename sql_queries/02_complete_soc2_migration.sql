-- Complete SOC2 Migration Script
-- This safely adds missing columns to existing audit_logs table

-- Step 1: Create missing enums (if they don't exist)
DO $$ 
BEGIN
    -- Create audit_event_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_event_type') THEN
        CREATE TYPE audit_event_type AS ENUM (
            'login', 'logout', 'login_failed', 'password_change',
            'mfa_enabled', 'mfa_disabled', 'permission_granted', 'permission_denied',
            'role_assigned', 'role_removed', 'data_created', 'data_read',
            'data_updated', 'data_deleted', 'data_exported', 'system_config_changed',
            'backup_created', 'backup_restored', 'security_violation', 'suspicious_activity',
            'rate_limit_exceeded', 'compliance_report_generated', 'audit_log_accessed',
            'data_retention_applied'
        );
    END IF;

    -- Create audit_severity enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_severity') THEN
        CREATE TYPE audit_severity AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;

    -- Create action_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE action_type AS ENUM (
            'create', 'read', 'update', 'delete', 'manage', 'assign',
            'invite', 'approve', 'reject', 'export', 'import', 'share',
            'archive', 'restore', 'audit', 'monitor', 'configure', 'admin'
        );
    END IF;

    -- Create resource_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
        CREATE TYPE resource_type AS ENUM (
            'organization', 'project', 'document', 'requirement', 'user',
            'member', 'invitation', 'role', 'permission', 'external_document',
            'diagram', 'trace_link', 'assignment', 'audit_log', 'security_event',
            'system_config', 'compliance_report'
        );
    END IF;
END $$;

-- Step 2: Add missing columns to audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS event_type audit_event_type,
ADD COLUMN IF NOT EXISTS severity audit_severity DEFAULT 'low',
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS resource_type resource_type,
ADD COLUMN IF NOT EXISTS resource_id UUID,
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS details JSONB,
ADD COLUMN IF NOT EXISTS soc2_control TEXT,
ADD COLUMN IF NOT EXISTS compliance_category TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS threat_indicators TEXT[],
ADD COLUMN IF NOT EXISTS source_system TEXT,
ADD COLUMN IF NOT EXISTS correlation_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Step 3: Populate new columns with data from existing columns
UPDATE audit_logs SET
    timestamp = created_at,
    event_type = CASE
        WHEN action = 'created' THEN 'data_created'::audit_event_type
        WHEN action = 'updated' THEN 'data_updated'::audit_event_type
        WHEN action = 'deleted' THEN 'data_deleted'::audit_event_type
        WHEN action = 'restored' THEN 'data_created'::audit_event_type
        WHEN action = 'user_deleted' THEN 'data_deleted'::audit_event_type
        ELSE 'data_updated'::audit_event_type
    END,
    severity = 'low'::audit_severity,
    user_id = actor_id::UUID,
    resource_type = CASE
        WHEN entity_type = 'block' THEN 'document'::resource_type
        WHEN entity_type = 'document' THEN 'document'::resource_type
        WHEN entity_type = 'requirement' THEN 'requirement'::resource_type
        WHEN entity_type = 'auth.users' THEN 'user'::resource_type
        ELSE 'document'::resource_type
    END,
    resource_id = entity_id::UUID,
    description = CONCAT('Legacy audit: ', action, ' on ', entity_type),
    details = metadata,
    source_system = 'legacy_migration',
    ip_address = CASE
        WHEN metadata->>'ip_address' IS NOT NULL
        THEN (metadata->>'ip_address')::INET
        ELSE NULL
    END,
    user_agent = metadata->>'user_agent'
WHERE timestamp IS NULL;

-- Step 4: Add foreign key constraints (optional, for data integrity)
-- Note: Only add these if the referenced tables exist
DO $$
BEGIN
    -- Add foreign key to profiles table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT fk_audit_logs_user_id
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;

    -- Add foreign key to organizations table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT fk_audit_logs_organization_id
        FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;

    -- Add foreign key to projects table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        ALTER TABLE audit_logs
        ADD CONSTRAINT fk_audit_logs_project_id
        FOREIGN KEY (project_id) REFERENCES projects(id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraints already exist, ignore
        NULL;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_category ON audit_logs(compliance_category);

-- Step 6: Update table comment
COMMENT ON TABLE audit_logs IS 'SOC2 CC7.2 - Comprehensive audit trail for all system activities';
