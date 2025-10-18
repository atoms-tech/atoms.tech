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
    // Checking table status

    // Try with service role - this should bypass RLS
    const { data, error, count } = await supabase
        .from('signup_requests')
        .select('*', { count: 'exact', head: false })
        .limit(1);

    if (error) {
        // Error occurred during table check

        if (error.message.includes('permission denied')) {
            // RLS is blocking access even with service role key
            // Table might need to be recreated, or the service role key is incorrect
        } else if (error.message.includes('does not exist')) {
            // Table does not exist - this is expected
            // Next step: Create the table using Supabase SQL Editor
        }

        return false;
    }

    // Table exists and is accessible

    return true;
}

checkTable()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        process.exit(1);
    });
