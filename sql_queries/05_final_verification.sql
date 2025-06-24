-- Final Verification - Check that everything is working

-- 1. Verify all required columns exist
SELECT 'Column Check' as test_type, 
       COUNT(*) as found_columns,
       8 as expected_columns,
       CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
    AND table_schema = 'public'
    AND column_name IN (
        'compliance_category', 'soc2_control', 'timestamp', 'event_type',
        'severity', 'user_id', 'resource_type', 'description'
    );

-- 2. Check that the compliance_category column specifically exists
SELECT 'Compliance Category Column' as test_type,
       CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
    AND column_name = 'compliance_category';

-- 3. Test inserting a record with compliance_category (this should work now)
INSERT INTO audit_logs (
    entity_id, entity_type, action, actor_id, 
    event_type, severity, description, compliance_category,
    created_at, timestamp
) VALUES (
    gen_random_uuid(), 'test', 'test_migration', gen_random_uuid(),
    'data_created', 'low', 'Migration test record', 'Testing',
    NOW(), NOW()
) RETURNING id, compliance_category;

-- 4. Clean up test record
DELETE FROM audit_logs WHERE description = 'Migration test record';

-- 5. Show sample of migrated data
SELECT 
    id,
    action,
    event_type,
    severity,
    compliance_category,
    description,
    user_id IS NOT NULL as has_valid_user
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 3;

-- 6. Summary
SELECT 
    'Migration Summary' as summary,
    COUNT(*) as total_records,
    COUNT(compliance_category) as records_with_compliance_category,
    COUNT(user_id) as records_with_valid_users
FROM audit_logs;
