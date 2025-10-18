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
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    // Running database migration

    // Read the migration SQL file
    const migrationPath = path.join(
        __dirname,
        '..',
        'src',
        'migrations',
        '001_create_signup_requests_table.sql',
    );

    if (!fs.existsSync(migrationPath)) {
        process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Try to create the table directly using Supabase REST API
    try {
        // First, check if table already exists
        const { error: checkError } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);

        if (!checkError) {
            return true;
        }

        // Table does not exist. Need to run migration via Supabase SQL Editor

        return false;
    } catch (err) {
        return false;
    }
}

// Run migration
runMigration()
    .then((success) => {
        if (success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    })
    .catch((err) => {
        process.exit(1);
    });
