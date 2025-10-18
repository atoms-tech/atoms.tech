#!/usr/bin/env node
/**
 * Database Migration Verification Script
 * Verifies that the signup_requests table exists and has the correct schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
<<<<<<< HEAD
=======
    console.error('❌ Missing required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
    console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
>>>>>>> production
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyDatabase() {
<<<<<<< HEAD
    // Verifying database configuration

    // 1. Check if table exists
=======
    console.log('🔍 Verifying database configuration...\n');

    // 1. Check if table exists
    console.log('1️⃣ Checking if signup_requests table exists...');
>>>>>>> production
    try {
        const { data, error } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);

        if (error) {
<<<<<<< HEAD
            return false;
        }
    } catch (err) {
=======
            console.error('❌ Table does not exist or is not accessible:', error.message);
            console.error('\n📝 Solution: Run the migration:');
            console.error('   curl -X POST http://localhost:3000/api/migrate \\');
            console.error(
                "     -H 'Authorization: Bearer YOUR_MIGRATION_SECRET_KEY' \\",
            );
            console.error("     -H 'Content-Type: application/json'");
            return false;
        }

        console.log('✅ Table exists and is accessible\n');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
>>>>>>> production
        return false;
    }

    // 2. Verify RLS is enabled
<<<<<<< HEAD
=======
    console.log('2️⃣ Checking Row Level Security (RLS)...');
>>>>>>> production
    try {
        const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
            sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'signup_requests'",
        });
<<<<<<< HEAD
    } catch (err) {
        // Cannot verify RLS
    }

    // 3. Test insert operation
=======

        if (rlsError) {
            console.warn('⚠️  Cannot verify RLS status:', rlsError.message);
        } else {
            console.log('✅ RLS verification complete\n');
        }
    } catch (err) {
        console.warn('⚠️  Cannot verify RLS:', err);
    }

    // 3. Test insert operation
    console.log('3️⃣ Testing insert operation...');
>>>>>>> production
    const testEmail = `test-${Date.now()}@example.com`;
    try {
        const { data: insertData, error: insertError } = await supabase
            .from('signup_requests')
            .insert([
                {
                    email: testEmail,
                    full_name: 'Test User',
                    message: 'Database verification test',
                    status: 'pending',
                },
            ])
            .select()
            .single();

        if (insertError) {
<<<<<<< HEAD
            return false;
        }

=======
            console.error('❌ Insert operation failed:', insertError.message);
            console.error('   Code:', insertError.code);
            console.error('   Details:', insertError.details);
            console.error('   Hint:', insertError.hint);
            return false;
        }

        console.log('✅ Insert operation successful');
        console.log('   Record ID:', insertData?.id);

>>>>>>> production
        // Clean up test record
        const { error: deleteError } = await supabase
            .from('signup_requests')
            .delete()
            .eq('email', testEmail);
<<<<<<< HEAD
    } catch (err) {
=======

        if (deleteError) {
            console.warn('⚠️  Could not delete test record:', deleteError.message);
        } else {
            console.log('✅ Test record cleaned up\n');
        }
    } catch (err) {
        console.error('❌ Unexpected error during insert test:', err);
>>>>>>> production
        return false;
    }

    // 4. Check for existing records
<<<<<<< HEAD
=======
    console.log('4️⃣ Checking for existing signup requests...');
>>>>>>> production
    try {
        const { data: records, error: countError } = await supabase
            .from('signup_requests')
            .select('status')
            .order('created_at', { ascending: false })
            .limit(10);

        if (countError) {
<<<<<<< HEAD
            return false;
        }
    } catch (err) {
        return false;
    }

=======
            console.error('❌ Cannot retrieve records:', countError.message);
            return false;
        }

        console.log(`✅ Found ${records?.length || 0} existing signup requests`);
        if (records && records.length > 0) {
            const statusCounts = records.reduce(
                (acc, r) => {
                    acc[r.status] = (acc[r.status] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            );
            console.log('   Status breakdown:', statusCounts);
        }
        console.log();
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return false;
    }

    console.log('✅ All database checks passed!\n');
>>>>>>> production
    return true;
}

// Run verification
verifyDatabase()
    .then((success) => {
        if (success) {
            console.log('🎉 Database is properly configured and ready to use!');
            process.exit(0);
        } else {
            console.log('❌ Database verification failed. Please check the errors above.');
            process.exit(1);
        }
    })
    .catch((err) => {
<<<<<<< HEAD
=======
        console.error('💥 Verification script failed:', err);
>>>>>>> production
        process.exit(1);
    });
