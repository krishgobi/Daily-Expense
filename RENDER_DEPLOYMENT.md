# Render Deployment Guide

## ⚠️ SECURITY ALERT

Your `.env` file containing credentials was exposed in the git repository. **You MUST:**

1. **Rotate all credentials immediately:**
   - Generate new JWT_SECRET_KEY
   - Regenerate Supabase API keys
   - Reset database password

2. **Remove .env from git history:**
   ```bash
   git rm --cached backend/.env
   git commit -m "Remove exposed .env file"
   git push
   ```

## Setup Steps for Render

### Step 1: Delete Current Service
1. Go to https://dashboard.render.com
2. Find your "daily-expense-api" service
3. Click Settings → Delete Service
4. Confirm deletion

### Step 2: Create New Service with render.yaml
1. Click "New +" → Web Service
2. Connect your GitHub repo (krishgobi/Daily-Expense)
3. Render should auto-detect `render.yaml`
4. If not, manually specify:
   - **Build Command:** `pip install --upgrade pip && pip install --no-cache-dir -r backend/requirements.txt && cd backend && alembic upgrade head`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Step 3: Set Environment Variables
In Render Dashboard → Environment:
```
SUPABASE_URL=https://zksjamrfyccgzbvnhwiu.supabase.co
SUPABASE_KEY=<new-key>
SUPABASE_SERVICE_KEY=<new-key>
JWT_SECRET_KEY=<strong-random-key-32-chars-min>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=7
DATABASE_URL=postgresql://...
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["https://your-frontend-domain.com"]
```

### Step 4: Deploy
Click "Deploy" and watch the build logs. Should now use Python 3.10.5.

## Files Changed
- ✅ `runtime.txt` - Specifies Python 3.10.5
- ✅ `render.yaml` - Render native configuration
- ✅ `Procfile` - Fallback process definition
- ✅ `backend/requirements.txt` - Updated for stability
- ✅ `.env.example` - Template for environment variables
- ✅ `.gitignore` - Already excludes .env

## Troubleshooting

If still using Python 3.14:
1. Hard refresh Render dashboard (Cmd+Shift+R)
2. Check service details - should show "Python 3.10"
3. If not, delete and recreate service again

For build failures:
- Check build logs for specific package errors
- Render logs show exact pip failure
- All packages here have pre-built wheels for Python 3.10
