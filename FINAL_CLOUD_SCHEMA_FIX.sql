-- FINAL Cloud Database Schema Fix
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ydogoylwenufckscqijp/sql
-- This will align the cloud database with what the code expects

-- ============================================================================
-- PART 1: Fix chat_sessions table
-- ============================================================================

-- The cloud database has 'org_id' but our code and migrations reference 'organization_id'
-- We need to ensure both columns exist and are synchronized

-- Check if organization_id column exists, if not, add it as an alias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_sessions' 
        AND column_name = 'organization_id'
    ) THEN
        -- Add organization_id as an alias/copy of org_id
        ALTER TABLE public.chat_sessions 
        ADD COLUMN organization_id UUID;
        
        -- Copy existing data
        UPDATE public.chat_sessions 
        SET organization_id = org_id;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_organization_id 
        ON public.chat_sessions(organization_id);
        
        -- Add comment
        COMMENT ON COLUMN public.chat_sessions.organization_id IS 
          'Organization ID (alias for org_id, nullable for personal sessions)';
    END IF;
END $$;

-- Make sure org_id is nullable
ALTER TABLE public.chat_sessions 
ALTER COLUMN org_id DROP NOT NULL;

-- Make sure organization_id is nullable
ALTER TABLE public.chat_sessions 
ALTER COLUMN organization_id DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN public.chat_sessions.org_id IS 
  'Organization ID (nullable for personal sessions)';

-- ============================================================================
-- PART 2: Fix chat_messages table
-- ============================================================================

-- Make content nullable for tool calls and system messages
ALTER TABLE public.chat_messages 
ALTER COLUMN content DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.chat_messages.content IS 
  'Message content (nullable for tool calls or system messages)';

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add message_index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'message_index'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN message_index INTEGER DEFAULT 0;
    END IF;
    
    -- Add sequence if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sequence'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN sequence INTEGER DEFAULT 0;
    END IF;
    
    -- Add tokens_in if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'tokens_in'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN tokens_in INTEGER DEFAULT 0;
    END IF;
    
    -- Add tokens_out if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'tokens_out'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN tokens_out INTEGER DEFAULT 0;
    END IF;
    
    -- Add tokens_total if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'tokens_total'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN tokens_total INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================================================
-- PART 3: Verify changes
-- ============================================================================

-- Verify chat_sessions columns
SELECT 
  'chat_sessions' as table_name,
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'chat_sessions' 
  AND column_name IN ('org_id', 'organization_id')
ORDER BY column_name;

-- Verify chat_messages columns
SELECT 
  'chat_messages' as table_name,
  column_name, 
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'chat_messages' 
  AND column_name = 'content';

-- Expected results:
-- chat_sessions.org_id: is_nullable = 'YES'
-- chat_sessions.organization_id: is_nullable = 'YES'
-- chat_messages.content: is_nullable = 'YES'

