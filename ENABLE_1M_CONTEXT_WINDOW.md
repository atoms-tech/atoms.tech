# Enable 1M Token Context Window for Claude Sonnet 4.5

**Date:** 2025-11-06  
**Status:** 📋 CONFIGURATION GUIDE

---

## Overview

Enable the 1M token context window for Claude Sonnet 4 and 4.5 on Vertex AI by adding the required beta header.

---

## Configuration Steps

### **Step 1: Locate Your AgentAPI Directory**

Based on your setup, the AgentAPI is likely at:
```
../../kush/agentapi/atomsAgent
```

Or wherever your AgentAPI server is running (the one on port 3284).

---

### **Step 2: Update AgentAPI Environment Variables**

Add these to your AgentAPI `.env` file:

```bash
# ============================================================================
# Anthropic Claude Configuration - 1M Context Window
# ============================================================================

# Primary model with 1M context window
ANTHROPIC_MODEL=claude-sonnet-4-5@20250929-1m

# Small/fast model (standard context)
ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5@20251001

# Beta header for 1M context window support
ANTHROPIC_BETA_HEADERS=context-1m-2025-08-07

# Use a supported region (us-central1 or us-east1 recommended)
CLOUD_ML_REGION=us-central1

# Alternative: Use global endpoint
# CLOUD_ML_REGION=global

# ============================================================================
# Vertex AI Configuration
# ============================================================================

# Your GCP project ID
GCP_PROJECT_ID=serious-mile-462615-a2

# Vertex AI location (must match CLOUD_ML_REGION)
VERTEX_AI_LOCATION=us-central1

# ============================================================================
# Optional: Per-Model Region Configuration
# ============================================================================

# If you need different regions for different models:
# VERTEX_REGION_CLAUDE_SONNET_4_5=us-central1
# VERTEX_REGION_CLAUDE_HAIKU_4_5=us-central1
```

---

### **Step 3: Verify Model Availability**

Before using the 1M context model, verify it's available in your region:

```bash
# Check if model is available in us-central1
gcloud ai models list \
  --region=us-central1 \
  --project=serious-mile-462615-a2 \
  --filter="displayName:claude-sonnet-4-5"

# Or check in Model Garden
# Go to: https://console.cloud.google.com/vertex-ai/model-garden
# Search for: Claude Sonnet 4.5
# Verify: "1M context" is listed under "Supported features"
```

---

### **Step 4: Enable Model in Model Garden**

If the model isn't enabled:

1. Go to [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
2. Search for "Claude Sonnet 4.5"
3. Click on the model
4. Click "Enable" or "Deploy"
5. Select your region (us-central1 recommended)
6. Confirm the 1M context feature is available

---

### **Step 5: Update AgentAPI Code (if needed)**

If your AgentAPI doesn't automatically use the `ANTHROPIC_BETA_HEADERS` env var, you'll need to add it to the Vertex AI client initialization.

**Example (Python):**
```python
import os
from anthropic import AnthropicVertex

# Initialize client with beta header
client = AnthropicVertex(
    region=os.getenv("CLOUD_ML_REGION", "us-central1"),
    project_id=os.getenv("GCP_PROJECT_ID"),
    # Add beta header for 1M context
    default_headers={
        "anthropic-beta": os.getenv("ANTHROPIC_BETA_HEADERS", "context-1m-2025-08-07")
    }
)

# Use the 1M context model
response = client.messages.create(
    model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5@20250929-1m"),
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Example (TypeScript/Node.js):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: `https://${process.env.CLOUD_ML_REGION}-aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.CLOUD_ML_REGION}/publishers/anthropic`,
  defaultHeaders: {
    'anthropic-beta': process.env.ANTHROPIC_BETA_HEADERS || 'context-1m-2025-08-07'
  }
});

const response = await client.messages.create({
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5@20250929-1m',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

---

### **Step 6: Restart AgentAPI Server**

After updating the configuration:

```bash
# Stop the current AgentAPI server
# Then restart it to pick up the new environment variables

# Example (if using npm/node):
cd ../../kush/agentapi/atomsAgent
npm run dev

# Or if using Python:
python main.py
```

---

## Testing

### **Test 1: Verify Configuration**

Check that the environment variables are loaded:

```bash
# In your AgentAPI directory
echo $ANTHROPIC_MODEL
# Should output: claude-sonnet-4-5@20250929-1m

echo $ANTHROPIC_BETA_HEADERS
# Should output: context-1m-2025-08-07
```

### **Test 2: Send a Test Request**

From your atoms.tech app:
1. Open a chat session
2. Send a message
3. Check AgentAPI logs for successful model invocation
4. Should see no 404 errors

### **Test 3: Verify 1M Context**

Try sending a very long context (e.g., paste a large document):
1. Should accept up to ~1M tokens
2. Should not hit context length errors until near 1M tokens

---

## Troubleshooting

### **Still getting 404 errors?**

1. **Check region availability:**
   ```bash
   # Try us-central1 instead of us-east5
   CLOUD_ML_REGION=us-central1
   ```

2. **Try without -1m suffix first:**
   ```bash
   # Use standard 200K context to verify basic setup
   ANTHROPIC_MODEL=claude-sonnet-4-5@20250929
   # Remove beta header temporarily
   # ANTHROPIC_BETA_HEADERS=context-1m-2025-08-07
   ```

3. **Check IAM permissions:**
   ```bash
   gcloud projects add-iam-policy-binding serious-mile-462615-a2 \
     --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
     --role="roles/aiplatform.user"
   ```

### **Model not found in Model Garden?**

The 1M context variant may not be available in all regions yet. Try:
1. Use `us-central1` or `us-east1` (most likely to have it)
2. Or use `CLOUD_ML_REGION=global`
3. Or wait for rollout to your region

### **Beta header not working?**

Ensure the header format is exact:
```bash
ANTHROPIC_BETA_HEADERS=context-1m-2025-08-07
```

Not:
- ❌ `context-1m-2025-08-07,other-beta`
- ❌ `anthropic-beta: context-1m-2025-08-07`
- ❌ `Context-1M-2025-08-07`

---

## Summary

**Required Changes:**
1. ✅ Add `ANTHROPIC_MODEL=claude-sonnet-4-5@20250929-1m`
2. ✅ Add `ANTHROPIC_BETA_HEADERS=context-1m-2025-08-07`
3. ✅ Set `CLOUD_ML_REGION=us-central1` (or supported region)
4. ✅ Restart AgentAPI server

**Optional:**
- Update AgentAPI code to use beta header (if not automatic)
- Enable model in Model Garden
- Verify IAM permissions

---

## Status

**Configuration:** 📋 READY TO APPLY  
**Location:** AgentAPI `.env` file  
**Testing:** ⏳ PENDING  

---

**🎯 Apply these changes to your AgentAPI and restart the server!** 🚀

