-- Fix chat_sessions and chat_messages schema issues
-- organization_id is already nullable in chat_sessions (created in 20250105)
-- Make content nullable since some messages might not have content (e.g., tool calls)

-- 1. Make content nullable in chat_messages
ALTER TABLE public.chat_messages
ALTER COLUMN content DROP NOT NULL;

-- 2. Add comments
COMMENT ON COLUMN public.chat_sessions.organization_id IS 'Organization ID (nullable for personal sessions)';
COMMENT ON COLUMN public.chat_messages.content IS 'Message content (nullable for tool calls or system messages)';

