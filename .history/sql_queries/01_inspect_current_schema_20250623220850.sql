-- Check current audit_logs table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
    AND table_schema = 'public'xqfxaxz
ORDER BY ordinal_position;

-- Check if SOC2 enums exist
SELECT t.typname as enum_name, e.enumlabel as enum_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname IN ('audit_event_type', 'audit_severity', 'action_type', 'resource_type')
ORDER BY t.typname, e.enumsortorder;

-- Check existing data in audit_logs
SELECT COUNT(*) as total_records FROM audit_logs;

-- Sample current data structure
SELECT * FROM audit_logs LIMIT 3;
