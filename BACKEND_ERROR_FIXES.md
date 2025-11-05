# Backend Error Fixes

**Date:** 2025-11-05  
**Status:** ⚠️ BACKEND ERRORS IDENTIFIED - FIXES NEEDED

---

## 🐛 Errors Found

### 1. NameError in Claude Client ❌

**Error:**
```
NameError: name 'user_identifier' is not defined
```

**Location:**
```
File: atomsAgent/services/claude_client.py
Line: 269
Function: get_session
```

**Code:**
```python
user_id = user_identifier or session_id
          ^^^^^^^^^^^^^^^
```

**Fix:**
The variable `user_identifier` is not defined in the scope. It should be one of:
- `user_id` (if passed as parameter)
- `session_id` (if that's the fallback)
- A parameter that needs to be added to the function signature

**Recommended Fix:**
```python
# Option 1: If user_id is the parameter
user_id = user_id or session_id

# Option 2: If it should be a new parameter
async def get_session(self, session_id: str, user_id: Optional[str] = None):
    user_id = user_id or session_id
```

---

### 2. Vertex AI Access Token Error ❌

**Error:**
```
RuntimeError: No access token available - cannot fetch models from Vertex AI
```

**Location:**
```
File: atomsAgent/services/vertex_models.py
Line: 206
Function: _fetch_models
```

**Issue:**
The Vertex AI service doesn't have an access token configured.

**Fix:**
1. Set up Google Cloud credentials
2. Configure environment variables:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   ```
3. Or use OAuth token:
   ```python
   # In vertex_models.py
   from google.auth import default
   credentials, project = default()
   ```

---

### 3. UUID Validation Error ❌

**Error:**
```
invalid input syntax for type uuid: "session-1762333076184-ez9oxt7qt5r"
```

**Location:**
Database insert for messages

**Issue:**
The session ID format is not a valid UUID. It's using a custom format like `session-{timestamp}-{random}`.

**Fix:**
Either:
1. **Change session ID format to UUID:**
   ```python
   import uuid
   session_id = str(uuid.uuid4())
   ```

2. **Change database column type:**
   ```sql
   ALTER TABLE messages 
   ALTER COLUMN session_id TYPE TEXT;
   ```

3. **Convert session ID before saving:**
   ```python
   # Generate UUID from session string
   import hashlib
   import uuid
   
   def session_to_uuid(session_str: str) -> str:
       # Create deterministic UUID from session string
       hash_bytes = hashlib.md5(session_str.encode()).digest()
       return str(uuid.UUID(bytes=hash_bytes))
   ```

---

### 4. Socket Closed Errors ❌

**Error:**
```
Error [SocketError]: other side closed
```

**Issue:**
The connection to the agent API is being closed prematurely, likely due to:
1. Timeout issues
2. Streaming errors
3. Backend crashes

**Fix:**
1. **Increase timeout:**
   ```typescript
   // In API proxy
   const response = await fetch(url, {
       signal: AbortSignal.timeout(60000), // 60 seconds
   });
   ```

2. **Add retry logic:**
   ```typescript
   const maxRetries = 3;
   for (let i = 0; i < maxRetries; i++) {
       try {
           return await makeRequest();
       } catch (error) {
           if (i === maxRetries - 1) throw error;
           await sleep(1000 * (i + 1));
       }
   }
   ```

3. **Fix backend streaming:**
   ```python
   # Ensure proper streaming response
   async def stream_response():
       try:
           async for chunk in generate_chunks():
               yield chunk
       except Exception as e:
           logger.error(f"Streaming error: {e}")
           yield f"data: {json.dumps({'error': str(e)})}\n\n"
       finally:
           yield "data: [DONE]\n\n"
   ```

---

## 🔧 Quick Fixes

### Fix 1: Claude Client (Immediate)

**File:** `atomsAgent/services/claude_client.py`

**Line 269:**
```python
# BEFORE (broken)
user_id = user_identifier or session_id

# AFTER (fixed)
# Check the function signature to see what parameter is actually passed
# If it's user_id:
user_id = user_id or session_id

# If it's a new parameter needed:
async def get_session(
    self, 
    session_id: str, 
    user_id: Optional[str] = None
):
    actual_user_id = user_id or session_id
    # ... rest of function
```

---

### Fix 2: Session ID Format (Immediate)

**File:** Where session IDs are generated

**Change:**
```python
# BEFORE
session_id = f"session-{int(time.time() * 1000)}-{random_string}"

# AFTER
import uuid
session_id = str(uuid.uuid4())
```

---

### Fix 3: Vertex AI Token (Configuration)

**File:** `.env` or environment configuration

**Add:**
```bash
# Option 1: Service account
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Option 2: OAuth token
VERTEX_AI_ACCESS_TOKEN=your-access-token
```

---

## 📋 Action Items

### Immediate (Critical)
1. [ ] Fix `user_identifier` NameError in claude_client.py
2. [ ] Fix session ID UUID format
3. [ ] Add proper error handling for streaming

### Short-term (Important)
4. [ ] Configure Vertex AI credentials
5. [ ] Add retry logic for socket errors
6. [ ] Increase timeouts for long-running requests

### Long-term (Nice to have)
7. [ ] Add comprehensive error logging
8. [ ] Add health checks for external services
9. [ ] Add circuit breakers for failing services

---

## 🎯 Testing After Fixes

1. **Test Claude Client:**
   ```bash
   # Send a chat completion request
   curl -X POST http://localhost:3284/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model": "claude-sonnet-4", "messages": [{"role": "user", "content": "Hello"}]}'
   ```

2. **Test Session Creation:**
   ```python
   # Verify session IDs are valid UUIDs
   import uuid
   session_id = create_session()
   uuid.UUID(session_id)  # Should not raise
   ```

3. **Test Streaming:**
   ```bash
   # Test streaming endpoint
   curl -X POST http://localhost:3284/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model": "claude-sonnet-4", "messages": [{"role": "user", "content": "Count to 10"}], "stream": true}'
   ```

---

## 📝 Summary

**Total Errors:** 4  
**Critical:** 2 (user_identifier, session UUID)  
**Important:** 2 (Vertex AI, socket errors)  

**Estimated Fix Time:** 30-60 minutes  
**Priority:** HIGH - Blocking chat functionality

---

**Status:** ⚠️ **BACKEND FIXES NEEDED**

The frontend is complete and working. The backend needs these fixes to function properly.

