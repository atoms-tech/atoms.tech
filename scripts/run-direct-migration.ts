#!/usr/bin/env node
/**
 * Direct Database Migration Script
 * Runs the signup_requests table migration directly without using RPC
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
    console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    console.log('🚀 Running database migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(
        __dirname,
        '..',
        'src',
        'migrations',
        '001_create_signup_requests_table.sql',
    );

    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📝 Read migration SQL from:', migrationPath);

    // Try to create the table directly using Supabase REST API
    try {
        // First, check if table already exists
        console.log('\n1️⃣ Checking if table already exists...');
        const { error: checkError } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);

        if (!checkError) {
            console.log('✅ Table already exists! No migration needed.\n');
            return true;
        }

        console.log('⚠️  Table does not exist. Need to run migration via Supabase SQL Editor.\n');
        console.log('📋 INSTRUCTIONS:');
        console.log('1. Go to: ' + SUPABASE_URL.replace('https://', 'https://app.') + '/sql');
        console.log('2. Click "New Query"');
        console.log('3. Copy and paste the following SQL:\n');
        console.log('─'.repeat(80));
        console.log(migrationSQL);
        console.log('─'.repeat(80));
        console.log('\n4. Click "Run" to execute the migration');
        console.log('\n5. After running, execute this script again to verify\n');

        return false;
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return false;
    }
}

// Run migration
runMigration()
    .then((success) => {
        if (success) {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        } else {
            console.log(
                '⚠️  Migration needs to be run manually via Supabase SQL Editor.',
            );
            process.exit(1);
        }
    })
    .catch((err) => {
        console.error('💥 Migration script failed:', err);
        process.exit(1);
    });
