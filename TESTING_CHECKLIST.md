# Testing Checklist - Post-Fix Verification

**Date:** 2025-11-06  
**Status:** ✅ READY FOR TESTING  
**Server:** Running on http://localhost:3001

---

## ✅ Fixes Applied

1. ✅ Database migration run - `metadata` column added
2. ✅ Package downgraded - `@ai-sdk/openai-compatible@1.0.0`
3. ✅ Dev server started - Port 3001

---

## Testing Checklist

### **1. Chat Functionality** 🔴 CRITICAL

**Test:** Basic chat completion

**Steps:**
1. Navigate to http://localhost:3001
2. Go to chat interface
3. Send a message: "Hello, can you help me?"
4. Verify response streams correctly
5. Check browser console for errors

**Expected:**
- ✅ Message sends successfully
- ✅ Response streams in real-time
- ✅ No "Unsupported model version v3" error
- ✅ No console errors

**Status:** ⏳ PENDING

---

### **2. MCP Server Installation** 🔴 CRITICAL

**Test:** Install MCP server from marketplace

**Steps:**
1. Navigate to http://localhost:3001/mcp/marketplace
2. Find a server (e.g., "reddit-ads-mcp")
3. Click "Install"
4. Fill in configuration
5. Submit installation

**Expected:**
- ✅ Installation form appears
- ✅ No "Could not find 'metadata' column" error
- ✅ Server installs successfully
- ✅ Server appears in installed list

**Status:** ⏳ PENDING

---

### **3. Tool Calling** 🟡 IMPORTANT

**Test:** Chat with tool usage

**Steps:**
1. In chat, ask: "Search for requirements about authentication"
2. Verify tool is called
3. Check tool results appear
4. Verify response incorporates tool results

**Expected:**
- ✅ Tool call is triggered
- ✅ Tool executes successfully
- ✅ Results are displayed
- ✅ Claude uses results in response

**Status:** ⏳ PENDING

---

### **4. Streaming** 🟡 IMPORTANT

**Test:** Verify streaming works

**Steps:**
1. Send a long message: "Write me a detailed explanation of OAuth 2.0"
2. Watch response appear
3. Verify it streams word-by-word
4. Check network tab for SSE events

**Expected:**
- ✅ Response streams incrementally
- ✅ No buffering/delays
- ✅ SSE events in network tab
- ✅ Smooth user experience

**Status:** ⏳ PENDING

---

### **5. Error Handling** 🟢 NICE TO HAVE

**Test:** Graceful error handling

**Steps:**
1. Send invalid request (if possible)
2. Check error message
3. Verify app doesn't crash

**Expected:**
- ✅ Error message displayed
- ✅ App remains functional
- ✅ Can retry

**Status:** ⏳ PENDING

---

## Known Issues (Pre-Fix)

### **Before Fixes:**
- ❌ Chat API error: "Unsupported model version v3"
- ❌ MCP install error: "Could not find 'metadata' column"
- ❌ Chat completions failed
- ❌ MCP server installation failed

### **After Fixes (Expected):**
- ✅ Chat API works
- ✅ MCP installation works
- ✅ Tool calling works
- ✅ Streaming works

---

## Quick Test Commands

### **Test 1: Check Database Schema**
```bash
# Verify metadata column exists
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mcp_servers' AND column_name = 'metadata';"
```

**Expected Output:**
```
 column_name | data_type
-------------+-----------
 metadata    | jsonb
```

### **Test 2: Check Package Version**
```bash
npm list @ai-sdk/openai-compatible
```

**Expected Output:**
```
@ai-sdk/openai-compatible@1.0.0
```

### **Test 3: Check Server Logs**
```bash
# Watch for errors in terminal running dev server
# Should see no "Unsupported model version" errors
```

---

## Browser Console Checks

### **What to Look For:**

**Good Signs:**
- ✅ No red errors
- ✅ Successful API calls (200 status)
- ✅ SSE connection established
- ✅ Messages streaming

**Bad Signs:**
- ❌ "Unsupported model version v3"
- ❌ "Could not find 'metadata' column"
- ❌ 500 errors
- ❌ Failed API calls

---

## Network Tab Checks

### **Chat API Call:**

**Request:**
- URL: `/api/chat`
- Method: POST
- Status: 200

**Response:**
- Type: text/event-stream
- Events streaming
- No errors

### **MCP Install API Call:**

**Request:**
- URL: `/api/mcp/marketplace/{server}/install`
- Method: POST
- Status: 200

**Response:**
- Success message
- Server ID returned

---

## Troubleshooting

### **If Chat Still Fails:**

1. Check package version:
   ```bash
   npm list @ai-sdk/openai-compatible
   ```
   Should be `1.0.0`

2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. Check browser console for errors

4. Check server logs for errors

### **If MCP Install Still Fails:**

1. Verify migration ran:
   ```bash
   psql $DATABASE_URL -c "\d mcp_servers"
   ```
   Should show `metadata` column

2. Check Supabase dashboard
   - Go to Table Editor
   - Open `mcp_servers` table
   - Verify `metadata` column exists

3. Check API logs for errors

---

## Success Criteria

All tests must pass:

- ✅ Chat completions work
- ✅ Streaming works
- ✅ MCP installation works
- ✅ Tool calling works
- ✅ No console errors
- ✅ No API errors

---

## Next Steps After Testing

### **If All Tests Pass:**
1. ✅ Mark issues as resolved
2. ✅ Update documentation
3. ✅ Commit changes
4. ✅ Deploy to production

### **If Tests Fail:**
1. 🔴 Document failures
2. 🔴 Check error messages
3. 🔴 Review fixes
4. 🔴 Apply additional fixes

---

## Status

**Server:** ✅ Running on http://localhost:3001  
**Database:** ✅ Migration applied  
**Package:** ✅ Downgraded to v1.0.0  

**Ready for testing!** 🚀

---

## Test Results

Update this section as you test:

- [ ] Chat functionality: ⏳ PENDING
- [ ] MCP installation: ⏳ PENDING
- [ ] Tool calling: ⏳ PENDING
- [ ] Streaming: ⏳ PENDING
- [ ] Error handling: ⏳ PENDING

**Overall Status:** ⏳ TESTING IN PROGRESS

