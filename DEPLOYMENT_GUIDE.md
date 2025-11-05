# Deployment Guide

**Purpose:** Deploy atomsAgent backend and frontend to production  
**Time Required:** 1-2 hours  
**Difficulty:** Intermediate

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ All backend code complete
- ✅ All frontend components created
- ✅ Supabase project created
- ✅ Environment variables configured
- ✅ Tests passing
- ✅ Git repository ready

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                         │
│  • Next.js application                                       │
│  • React components                                          │
│  • Static assets                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│              Cloud Run / Railway (Backend)                   │
│  • FastAPI application                                       │
│  • atomsAgent server                                         │
│  • MCP tools                                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Database)                       │
│  • PostgreSQL database                                       │
│  • Authentication                                            │
│  • Storage                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Backend Deployment

### Option 1: Google Cloud Run (Recommended)

**Step 1: Create Dockerfile**

Create `Dockerfile` in atomsAgent directory:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY config/ ./config/

# Expose port
EXPOSE 8080

# Run application
CMD ["uvicorn", "atomsAgent.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Step 2: Create .dockerignore**

```
.venv/
__pycache__/
*.pyc
.pytest_cache/
.env
*.log
test_*.py
```

**Step 3: Build and Deploy**

```bash
# Set project ID
export PROJECT_ID="your-gcp-project-id"

# Build image
gcloud builds submit --tag gcr.io/$PROJECT_ID/atomsagent

# Deploy to Cloud Run
gcloud run deploy atomsagent \
  --image gcr.io/$PROJECT_ID/atomsagent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=$SUPABASE_URL \
  --set-env-vars SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

**Step 4: Get Service URL**

```bash
gcloud run services describe atomsagent --region us-central1 --format 'value(status.url)'
```

---

### Option 2: Railway

**Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

**Step 2: Login and Initialize**

```bash
railway login
railway init
```

**Step 3: Add Environment Variables**

```bash
railway variables set SUPABASE_URL="your-url"
railway variables set SUPABASE_SERVICE_KEY="your-key"
railway variables set ANTHROPIC_API_KEY="your-key"
```

**Step 4: Deploy**

```bash
railway up
```

---

### Option 3: Docker Compose (Self-Hosted)

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  atomsagent:
    build: .
    ports:
      - "3284:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
```

**Deploy:**

```bash
docker-compose up -d
```

---

## 🌐 Frontend Deployment

### Vercel (Recommended)

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Configure Environment Variables**

Create `.env.production`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_AGENTAPI_URL=https://your-backend-url.run.app
```

**Step 3: Deploy**

```bash
vercel --prod
```

**Step 4: Set Environment Variables in Vercel Dashboard**

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.production`

---

## 🗄️ Database Setup

### Supabase Migrations

**Step 1: Install Supabase CLI**

```bash
npm install -g supabase
```

**Step 2: Link to Project**

```bash
supabase link --project-ref your-project-ref
```

**Step 3: Run Migrations**

```bash
supabase db push
```

Or manually run migrations:

```bash
# Run each migration file
psql $DATABASE_URL -f supabase/migrations/20250106_create_mcp_servers.sql
```

---

## 🔐 Environment Variables

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key

# Google Cloud (for Vertex AI)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Optional
LOG_LEVEL=INFO
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.production)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_AGENTAPI_URL=https://your-backend.run.app

# Optional
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## ✅ Pre-Deployment Checklist

### Backend
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] CORS configured for frontend domain
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error tracking setup (Sentry, etc.)

### Frontend
- [ ] Build succeeds locally
- [ ] Environment variables set
- [ ] API endpoints updated
- [ ] Components tested
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Analytics setup

### Database
- [ ] Migrations applied
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Backup configured
- [ ] Connection pooling setup

---

## 🧪 Post-Deployment Testing

### Backend Health Check

```bash
curl https://your-backend.run.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Test Chat Completion

```bash
curl -X POST https://your-backend.run.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5@20250929",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Test MCP Tools

```bash
curl -X POST https://your-backend.run.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5@20250929",
    "messages": [{"role": "user", "content": "Search for authentication requirements"}]
  }'
```

---

## 📊 Monitoring

### Backend Monitoring

**Google Cloud Run:**
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Railway:**
- View logs in Railway dashboard
- Set up log drains to external services

### Frontend Monitoring

**Vercel:**
- View analytics in Vercel dashboard
- Set up error tracking with Sentry
- Monitor performance with Web Vitals

---

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
      - run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT }}/atomsagent
          gcloud run deploy atomsagent --image gcr.io/${{ secrets.GCP_PROJECT }}/atomsagent

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🐛 Troubleshooting

### Backend not starting
- Check environment variables
- Verify database connection
- Check logs for errors
- Ensure port is correct

### Frontend can't connect to backend
- Verify CORS settings
- Check API URL in environment
- Test backend health endpoint
- Check network/firewall rules

### Database connection issues
- Verify connection string
- Check RLS policies
- Ensure migrations applied
- Test with psql directly

---

**Status:** ✅ Ready for deployment

**Next:** Follow steps for your chosen platform and test thoroughly

