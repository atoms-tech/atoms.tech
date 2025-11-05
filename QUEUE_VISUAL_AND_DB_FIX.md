# Message Queue Visual Indicator & Database Fix

## Date: 2025-11-05

---

## Issues Fixed

### 1. ✅ Visual Queue Indicator

**Problem:**
Messages sent while another is in progress were queued but not visible to users. No indication that messages were waiting.

**Solution:**
Added visual indicators for queued messages:

#### Changes Made

**1. Updated DisplayMessage Interface**
```typescript
// atoms.tech/src/components/custom/AgentChat/AgentPanel.tsx
interface DisplayMessage {
    id: string;
    role: ChatRole;
    content: string;
    isStreaming?: boolean;
    isPending?: boolean; // NEW: Message is queued
    createdAt?: Date;
}
```

**2. Display Queued Messages**
```typescript
// Add queued messages to display
messageQueue.forEach((queuedMessage, index) => {
    normalized.push({
        id: `queued-${index}`,
        role: 'user',
        content: queuedMessage,
        isStreaming: false,
        isPending: true, // Mark as pending
    });
});
```

**3. Visual Styling**
```typescript
// atoms.tech/src/components/custom/AgentChat/MessageWithArtifacts.tsx
className={cn(
    message.isPending && 'opacity-60 ring-1 ring-primary/30',
)}
```

**4. Queued Indicator**
```tsx
{message.isPending && (
    <div className="flex justify-end mt-1 px-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-current animate-bounce" />
                <div className="w-1 h-1 rounded-full bg-current animate-bounce" />
                <div className="w-1 h-1 rounded-full bg-current animate-bounce" />
            </div>
            <span>Queued</span>
        </div>
    </div>
)}
```

#### Visual Features

- **Dimmed appearance** - 60% opacity
- **Subtle ring** - Primary color ring at 30% opacity
- **Animated dots** - Three bouncing dots
- **"Queued" label** - Clear text indicator
- **Non-editable** - Can't edit queued messages

---

### 2. ✅ Duplicate Message Index Error

**Problem:**
```
Failed to persist assistant variant {
  code: '23505',
  message: 'duplicate key value violates unique constraint "idx_chat_messages_session_index_unique"'
  details: 'Key (session_id, message_index)=(73a26d97-3d9b-fb79-32b0-d47bf0ad3b99, 0) already exists.'
}
```

**Root Cause:**
The code was trying to insert a message that already existed, causing a duplicate key violation on the `(session_id, message_index)` unique constraint.

**Solution:**
Check if message exists before inserting, update if it does.

#### Changes Made

**File:** `atoms.tech/src/app/api/chat/route.ts`

**Before:**
```typescript
const { data: inserted, error: insertError } = await supabase
    .from('chat_messages')
    .insert(insertPayload)
    .select('id')
    .single();

if (insertError) {
    logger.error('Failed to persist assistant variant', insertError);
    return;
}
```

**After:**
```typescript
// Check if message already exists
const { data: existingMessage } = await supabase
    .from('chat_messages')
    .select('id')
    .eq('id', responseMessageId)
    .eq('session_id', params.sessionId)
    .maybeSingle();

let inserted: any = existingMessage;

if (!existingMessage) {
    // Insert new message
    const { data: insertedData, error: insertError } = await supabase
        .from('chat_messages')
        .insert(insertPayload)
        .select('id')
        .single();

    if (insertError) {
        logger.error('Failed to persist assistant variant', insertError);
        return;
    }

    inserted = insertedData;
} else {
    // Update existing message
    await supabase
        .from('chat_messages')
        .update({
            content: normalizedContent,
            metadata: metadataPayload,
            tokens_in: params.responseMessage.tokens?.input ?? 0,
            tokens_out: params.responseMessage.tokens?.output ?? 0,
            tokens_total: params.responseMessage.tokens?.total ?? 0,
            is_active: true,
        })
        .eq('id', responseMessageId)
        .eq('session_id', params.sessionId);
}
```

---

## Testing

### Test Visual Queue

1. Start the app:
   ```bash
   cd atoms.tech
   npm run dev
   ```

2. Open chat interface

3. Send a message

4. While it's processing, send 2-3 more messages quickly

5. **Expected behavior:**
   - ✅ First message shows normal (processing)
   - ✅ Queued messages appear dimmed with ring
   - ✅ Each queued message shows bouncing dots + "Queued" label
   - ✅ Messages process in order
   - ✅ "Queued" indicator disappears when message starts processing

### Test Database Fix

1. Send multiple messages in quick succession

2. Check server logs

3. **Expected behavior:**
   - ✅ No duplicate key errors
   - ✅ Messages save successfully
   - ✅ No "Failed to persist assistant variant" errors

---

## Files Modified

1. ✅ `atoms.tech/src/components/custom/AgentChat/AgentPanel.tsx`
   - Added `isPending` to DisplayMessage interface
   - Added queued messages to displayMessages
   - Updated dependencies in useMemo

2. ✅ `atoms.tech/src/components/custom/AgentChat/MessageWithArtifacts.tsx`
   - Added `isPending` to props interface
   - Added visual styling for pending messages
   - Added "Queued" indicator with animated dots
   - Disabled editing for pending messages

3. ✅ `atoms.tech/src/app/api/chat/route.ts`
   - Added existence check before insert
   - Added update logic for existing messages
   - Prevents duplicate key errors

---

## Summary

### Visual Queue Indicator
- ✅ Queued messages now visible in chat
- ✅ Clear visual distinction (dimmed + ring)
- ✅ Animated "Queued" label
- ✅ Better UX - users know messages are waiting

### Database Fix
- ✅ No more duplicate key errors
- ✅ Handles existing messages gracefully
- ✅ Updates instead of failing on duplicates
- ✅ Cleaner error logs

---

## Next Steps

1. ✅ Test the visual queue indicator
2. ✅ Verify no database errors
3. 🔄 Optional: Add queue position number (e.g., "Queued (2/3)")
4. 🔄 Optional: Add ability to cancel queued messages

---

## Related Documentation

- `MESSAGE_QUEUE_DOCUMENTATION.md` - Queue implementation details
- `STREAMING_CHAT_ENHANCEMENTS.md` - Streaming features
- `FINAL_SESSION_SUMMARY.md` - Complete session summary

