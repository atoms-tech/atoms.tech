-- Complete the Data Migration - Run this to finish what was started

-- Step 1: Populate new columns with data from existing columns
-- This is the step that didn't run due to the foreign key error
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
    compliance_category = 'System Activity',
    soc2_control = 'CC7.2',
    ip_address = CASE 
        WHEN metadata->>'ip_address' IS NOT NULL 
        THEN (metadata->>'ip_address')::INET 
        ELSE NULL 
    END,
    user_agent = metadata->>'user_agent'
WHERE timestamp IS NULL;

-- Step 2: Handle orphaned user references
-- Set user_id to NULL for users that don't exist in profiles table
UPDATE audit_logs 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);

-- Step 3: Add foreign key constraints with proper error handling
DO $$
BEGIN
    -- Add foreign key to profiles table (allowing NULL values)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        BEGIN
            ALTER TABLE audit_logs 
            ADD CONSTRAINT fk_audit_logs_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
        EXCEPTION
            WHEN duplicate_object THEN
                -- Constraint already exists, ignore
                NULL;
        END;
    END IF;

    -- Add foreign key to organizations table if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        BEGIN
            ALTER TABLE audit_logs 
            ADD CONSTRAINT fk_audit_logs_organization_id 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END;
    END IF;

    -- Add foreign key to projects table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        BEGIN
            ALTER TABLE audit_logs 
            ADD CONSTRAINT fk_audit_logs_project_id 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
        EXCEPTION
            WHEN duplicate_object THEN
                NULL;
        END;
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_category ON audit_logs(compliance_category);

-- Step 5: Update table comment
COMMENT ON TABLE audit_logs IS 'SOC2 CC7.2 - Comprehensive audit trail for all system activities';

-- Step 6: Show final summary
SELECT 
    'Migration Completed' as status,
    COUNT(*) as total_records,
    COUNT(compliance_category) as records_with_compliance_category,
    COUNT(user_id) as records_with_valid_users,
    COUNT(*) - COUNT(user_id) as records_with_null_users
FROM audit_logs;
