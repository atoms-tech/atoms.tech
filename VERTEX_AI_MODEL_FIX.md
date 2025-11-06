# Vertex AI Model Configuration Fix

**Date:** 2025-11-06  
**Status:** ⚠️ ACTION REQUIRED

---

## Error

```
API Error: 404 {"error":{"code":404,"message":"Publisher Model projects/serious-mile-462615-a2/locations/us-east5/publishers/anthropic/models/claude-sonnet-4-5@20250929-1m not found.","status":"NOT_FOUND"}}
```

---

## Root Cause

The model `claude-sonnet-4-5@20250929-1m` is not available in the `us-east5` region.

**Issues:**
1. ❌ Model not found in `us-east5` region
2. ❌ Using 1M context window variant (`-1m` suffix)
3. ❌ Model may not be enabled in Model Garden

---

## Solution Options

### **Option 1: Use Standard Model (Recommended)**

Remove the `-1m` suffix to use the standard 200K context window:

```bash
# In your AgentAPI .env file (not atoms.tech .env.local)
ANTHROPIC_MODEL=claude-sonnet-4-5@20250929
ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5@20251001
```

### **Option 2: Switch to Supported Region**

Use a region that supports the model:

```bash
# In your AgentAPI .env file
CLOUD_ML_REGION=us-central1
# or
CLOUD_ML_REGION=us-east1
```

### **Option 3: Use Global Endpoint**

Switch to global endpoint (if model supports it):

```bash
# In your AgentAPI .env file
CLOUD_ML_REGION=global
```

### **Option 4: Enable Model in Model Garden**

1. Go to Google Cloud Console
2. Navigate to Vertex AI → Model Garden
3. Search for "Claude Sonnet 4.5"
4. Click "Enable" for your project
5. Verify it's enabled in your region

---

## How to Fix

### **Step 1: Locate AgentAPI Configuration**

The error is coming from your AgentAPI server (port 3284), not the Next.js app.

Find the AgentAPI `.env` file (likely in a separate directory).

### **Step 2: Update Environment Variables**

**Recommended configuration:**

```bash
# Use standard models without 1M context
ANTHROPIC_MODEL=claude-sonnet-4-5@20250929
ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5@20251001

# Use a supported region
CLOUD_ML_REGION=us-central1

# Or use global endpoint
# CLOUD_ML_REGION=global
```

### **Step 3: Restart AgentAPI Server**

```bash
# Stop the current server
# Then restart with new configuration
```

---

## Verification

### **Test the Configuration:**

1. Restart AgentAPI server
2. Try sending a chat message
3. Should work without 404 errors

### **Check Model Availability:**

```bash
# List available models in your region
gcloud ai models list \
  --region=us-east5 \
  --filter="displayName:claude"
```

---

## Model Availability by Region

### **Commonly Supported Regions:**
- ✅ `us-central1` - Usually has all models
- ✅ `us-east1` - Usually has all models
- ✅ `europe-west1` - Usually has all models
- ⚠️ `us-east5` - May have limited model availability

### **Global Endpoint:**
- ✅ `global` - Best availability, but check Model Garden for support

---

## 1M Context Window

If you need the 1M context window:

1. **Verify model supports it** in your region
2. **Add beta header** to requests:
   ```bash
   ANTHROPIC_BETA_HEADERS=context-1m-2025-08-07
   ```
3. **Use the `-1m` model variant:**
   ```bash
   ANTHROPIC_MODEL=claude-sonnet-4-5@20250929-1m
   ```

**Note:** 1M context is in beta and may not be available in all regions.

---

## Troubleshooting

### **Still getting 404 errors?**

1. **Check Model Garden:**
   - Go to Vertex AI → Model Garden
   - Search for "Claude Sonnet 4.5"
   - Verify it's enabled

2. **Check IAM Permissions:**
   ```bash
   # Ensure you have the required role
   gcloud projects add-iam-policy-binding serious-mile-462615-a2 \
     --member="user:YOUR_EMAIL" \
     --role="roles/aiplatform.user"
   ```

3. **Check Quotas:**
   - Go to IAM & Admin → Quotas
   - Search for "Vertex AI"
   - Ensure you have quota in your region

4. **Try a different model:**
   ```bash
   # Use Claude 3.5 Sonnet (older but widely available)
   ANTHROPIC_MODEL=claude-3-5-sonnet@20240620
   ```

---

## Recommended Configuration

**For Development:**
```bash
# AgentAPI .env
ANTHROPIC_MODEL=claude-sonnet-4-5@20250929
ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5@20251001
CLOUD_ML_REGION=us-central1
```

**For Production:**
```bash
# AgentAPI .env
ANTHROPIC_MODEL=claude-sonnet-4-5@20250929
ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5@20251001
CLOUD_ML_REGION=global
```

---

## Status

**Issue:** ⚠️ Vertex AI model not found  
**Location:** AgentAPI server (port 3284)  
**Fix:** Update AgentAPI `.env` configuration  
**Testing:** ⏳ Pending configuration update  

---

**🎯 Update your AgentAPI configuration and restart the server!** 🚀

