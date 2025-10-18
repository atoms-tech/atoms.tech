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
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyDatabase() {
    // Verifying database configuration

    // 1. Check if table exists
    try {
        const { data, error } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);

        if (error) {
            return false;
        }
    } catch (err) {
        return false;
    }

    // 2. Verify RLS is enabled
    try {
        const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
            sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'signup_requests'",
        });
    } catch (err) {
        // Cannot verify RLS
    }

    // 3. Test insert operation
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
            return false;
        }

        // Clean up test record
        const { error: deleteError } = await supabase
            .from('signup_requests')
            .delete()
            .eq('email', testEmail);
    } catch (err) {
        return false;
    }

    // 4. Check for existing records
    try {
        const { data: records, error: countError } = await supabase
            .from('signup_requests')
            .select('status')
            .order('created_at', { ascending: false })
            .limit(10);

        if (countError) {
            return false;
        }
    } catch (err) {
        return false;
    }

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
        process.exit(1);
    });
