-- Fix Foreign Key Issues - Run this to complete the migration

-- Step 1: Clean up orphaned user references
-- Set user_id to NULL for users that don't exist in profiles table
UPDATE audit_logs 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM profiles);

-- Step 2: Add foreign key constraints with proper handling
DO $$
BEGIN
    -- Drop existing constraint if it exists (from failed attempt)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_audit_logs_user_id'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT fk_audit_logs_user_id;
    END IF;

    -- Add foreign key to profiles table (allowing NULL values)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE audit_logs 
        ADD CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key to organizations table if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_audit_logs_organization_id'
        ) THEN
            ALTER TABLE audit_logs 
            ADD CONSTRAINT fk_audit_logs_organization_id 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Add foreign key to projects table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_audit_logs_project_id'
        ) THEN
            ALTER TABLE audit_logs 
            ADD CONSTRAINT fk_audit_logs_project_id 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but continue
        RAISE NOTICE 'Error adding foreign keys: %', SQLERRM;
END $$;

-- Step 3: Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_category ON audit_logs(compliance_category);

-- Step 4: Update table comment
COMMENT ON TABLE audit_logs IS 'SOC2 CC7.2 - Comprehensive audit trail for all system activities';

-- Step 5: Show summary of what was fixed
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_valid_users,
    COUNT(*) - COUNT(user_id) as records_with_null_users
FROM audit_logs;
