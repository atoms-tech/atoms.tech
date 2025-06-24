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
