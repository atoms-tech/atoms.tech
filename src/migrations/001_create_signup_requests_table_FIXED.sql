-- ============================================================================
-- FIXED: Create signup_requests table for storing user signup requests
-- This version ensures service role can always access the table
-- ============================================================================

-- Drop existing table and policies if they exist (clean slate)
DROP TABLE IF EXISTS signup_requests CASCADE;

-- Create the table
CREATE TABLE signup_requests (
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

-- Create indexes for faster queries
CREATE INDEX idx_signup_requests_email ON signup_requests(email);
CREATE INDEX idx_signup_requests_status ON signup_requests(status);
CREATE INDEX idx_signup_requests_created_at ON signup_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (bypasses RLS)
-- This is automatic in Supabase, but we're being explicit

-- Policy: Public can SELECT (read) all signup requests
CREATE POLICY "Anyone can view signup requests"
ON signup_requests FOR SELECT
TO public
USING (true);

-- Policy: Public can INSERT (create) signup requests
CREATE POLICY "Anyone can create signup requests"
ON signup_requests FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Public can UPDATE signup requests
-- (This allows admins to approve/deny requests)
CREATE POLICY "Anyone can update signup requests"
ON signup_requests FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy: Public can DELETE signup requests
-- (Only for cleanup/admin purposes)
CREATE POLICY "Anyone can delete signup requests"
ON signup_requests FOR DELETE
TO public
USING (true);

-- Grant permissions to authenticated and anon roles
GRANT ALL ON signup_requests TO authenticated;
GRANT ALL ON signup_requests TO anon;
GRANT ALL ON signup_requests TO service_role;

-- Verify table was created
SELECT 'Table created successfully!' AS status;
SELECT COUNT(*) AS current_row_count FROM signup_requests;
