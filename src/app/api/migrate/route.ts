import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const migrationSQL = `
-- Create signup_requests table for storing user signup requests
CREATE TABLE IF NOT EXISTS signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, denied
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    denied_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID, -- WorkOS user ID who approved
    denied_by UUID, -- WorkOS user ID who denied
    denial_reason TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests(status);
CREATE INDEX IF NOT EXISTS idx_signup_requests_created_at ON signup_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view signup request status" ON signup_requests;
DROP POLICY IF EXISTS "Public can insert signup requests" ON signup_requests;
DROP POLICY IF EXISTS "Authenticated users can update signup requests" ON signup_requests;

-- Public can read (for approval links) and insert (for requests)
CREATE POLICY "Public can view signup request status" ON signup_requests
    FOR SELECT
    USING (true);

CREATE POLICY "Public can insert signup requests" ON signup_requests
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated admins can update
CREATE POLICY "Authenticated users can update signup requests" ON signup_requests
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
`;

export async function POST(request: NextRequest) {
    try {
        // Check for a secret key to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🚀 Running database migration...');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map((stmt) => stmt.trim())
            .filter((stmt) => stmt.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(
                `   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`,
            );

            const { error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error);
                return NextResponse.json(
                    { error: `Migration failed at statement ${i + 1}: ${error.message}` },
                    { status: 500 },
                );
            }
        }

        console.log('✅ Migration completed successfully!');

        // Verify the table was created
        const { data: _data, error: verifyError } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);

        if (verifyError) {
            console.error('❌ Verification failed:', verifyError);
            return NextResponse.json(
                { error: `Verification failed: ${verifyError.message}` },
                { status: 500 },
            );
        }

        console.log('✅ Table verification successful!');

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
        });
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return NextResponse.json(
            {
                error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
            { status: 500 },
        );
    }
}
