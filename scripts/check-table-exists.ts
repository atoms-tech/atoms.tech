#!/usr/bin/env node
/**
 * Quick script to check if signup_requests table exists and show table info
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

// Create client with service role that bypasses RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    db: {
        schema: 'public',
    },
});

async function checkTable() {
<<<<<<< HEAD
    // Checking table status
=======
    console.log('🔍 Checking table status...\n');
    console.log('Using Supabase URL:', SUPABASE_URL);
    console.log('Service role key present:', !!SUPABASE_SERVICE_ROLE_KEY);
    console.log('Service role key starts with:', SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
>>>>>>> production

    // Try with service role - this should bypass RLS
    const { data, error, count } = await supabase
        .from('signup_requests')
        .select('*', { count: 'exact', head: false })
        .limit(1);

    if (error) {
<<<<<<< HEAD
        // Error occurred during table check

        if (error.message.includes('permission denied')) {
            // RLS is blocking access even with service role key
            // Table might need to be recreated, or the service role key is incorrect
        } else if (error.message.includes('does not exist')) {
            // Table does not exist - this is expected
            // Next step: Create the table using Supabase SQL Editor
=======
        console.error('\n❌ Error:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);

        if (error.message.includes('permission denied')) {
            console.log('\n⚠️  RLS is blocking access even with service role key!');
            console.log('\n💡 Solution: The table might need to be recreated, or the service role key is incorrect.');
            console.log('\nTo fix:');
            console.log('1. Go to Supabase SQL Editor: ' + SUPABASE_URL.replace('https://', 'https://app.') + '/sql');
            console.log('2. Run this SQL to drop and recreate:');
            console.log('\n   DROP TABLE IF EXISTS signup_requests CASCADE;');
            console.log('\n3. Then run the full migration from: src/migrations/001_create_signup_requests_table.sql');
        } else if (error.message.includes('does not exist')) {
            console.log('\n✅ Table does not exist - this is expected!');
            console.log('\n📝 Next step: Create the table using Supabase SQL Editor');
>>>>>>> production
        }

        return false;
    }

<<<<<<< HEAD
    // Table exists and is accessible
=======
    console.log('\n✅ Table exists and is accessible!');
    console.log('Current record count:', count);
    if (data && data.length > 0) {
        console.log('Sample record:', data[0]);
    }
>>>>>>> production

    return true;
}

checkTable()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
<<<<<<< HEAD
=======
        console.error('💥 Script failed:', err);
>>>>>>> production
        process.exit(1);
    });
