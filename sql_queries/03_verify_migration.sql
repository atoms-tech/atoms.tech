-- Verify SOC2 Migration Completion

-- Check that all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
    AND table_schema = 'public'
    AND column_name IN (
        'compliance_category', 'soc2_control', 'timestamp', 'event_type',
        'severity', 'user_id', 'resource_type', 'description'
    )
ORDER BY column_name;

-- Check that enums were created
SELECT t.typname as enum_name, e.enumlabel as enum_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname IN ('audit_event_type', 'audit_severity', 'action_type', 'resource_type')
ORDER BY t.typname, e.enumlabel;

-- Check that existing data was migrated properly
SELECT 
    id,
    action,
    event_type,
    severity,
    entity_type,
    resource_type,
    description,
    compliance_category,
    created_at,
    timestamp
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Count records to ensure no data loss
SELECT COUNT(*) as total_records FROM audit_logs;
