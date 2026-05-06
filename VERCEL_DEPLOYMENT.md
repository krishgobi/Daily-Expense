# Vercel Frontend Deployment Guide

## Overview
This guide covers deploying the React frontend to Vercel with proper environment variable configuration and backend integration.

---

## Prerequisites

1. **GitHub Account** - With the repository pushed (already done)
2. **Vercel Account** - Sign up at https://vercel.com
3. **Backend Deployed** - FastAPI backend running at `https://daily-expense-oiwb.onrender.com` ✅

---

## Step-by-Step Deployment

### 1. Prepare Code for Deployment

Verify all changes are committed:

```bash
cd /Users/pointonezero/Desktop/expense
git status  # Should show clean
git log --oneline -3  # Verify latest commits
```

**Changes made:**
- ✅ Frontend `.env` updated with production backend URL
- ✅ Vite proxy removed (uses direct API calls)
- ✅ Error handler created for global error management
- ✅ API interceptors enhanced

---

### 2. Build Verification (Local)

Test the build works:

```bash
cd frontend
npm run build
# Should complete without errors
```

This generates the `dist/` folder ready for deployment.

---

### 3. Push Latest Code to GitHub

```bash
cd /Users/pointonezero/Desktop/expense
git add .
git commit -m "Frontend: Update env vars, remove proxy, add error handling"
git push origin main
```

---

### 4. Connect Vercel to GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Search for and select: **`krishgobi/Daily-Expense`**
5. Click **"Import"**

---

### 5. Configure Project Settings

**Project Name:** `daily-expense-frontend` (or any name)

**Framework:** Select **React**

**Root Directory:** Since this is a monorepo, set to **`frontend`**

**Build Command:** Leave as default (Vite will auto-detect)

**Output Directory:** Leave as default (should be `dist`)

**Install Command:** Leave as default

---

### 6. Add Environment Variables

In the **"Environment Variables"** section, add all three variables:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://daily-expense-oiwb.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | `https://zksjamrfyccgzbvnhwiu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc2phbXJmeWNjZ3pidm5od2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzA0ODksImV4cCI6MjA5MzEwNjQ4OX0.6V1RnZYcfsDn_ivDnFYk4LNRQK23xoBII8B2Bkk4GZM` |

**Important:** These variables are marked as **secrets** in Vercel - they won't be logged or exposed.

---

### 7. Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-3 minutes)
3. Once complete, you'll get a URL like: `https://daily-expense-frontend.vercel.app`

**Deployment Status:**
- 🔵 **Building** - Code is being built
- 🟢 **Ready** - Successfully deployed
- 🔴 **Error** - Check logs if deployment fails

---

## Post-Deployment Verification

### 1. Check Frontend is Live

Open your Vercel deployment URL in browser - should load the app

### 2. Test Login Flow

1. Go to login page
2. Register with test account: `test@example.com` / `password123`
3. Should redirect to dashboard after login

### 3. Verify API Connection

In browser DevTools **Network** tab:
- Look for API requests to `https://daily-expense-oiwb.onrender.com/api/v1/...`
- Requests should have **`Authorization: Bearer <token>`** header
- Response status should be **200 OK**

### 4. Test Key Features

- ✅ Login/Register
- ✅ Create expense (should hit backend)
- ✅ View dashboard
- ✅ Logout

### 5. Monitor for CORS Errors

If you see CORS errors in console:
- Make sure backend has correct `ALLOWED_ORIGINS` set
- Check backend env vars include your Vercel domain

---

## Troubleshooting

### Issue: Blank Page on Load

**Check:**
1. Browser DevTools → Console tab for errors
2. Vercel Logs → Real-time output during load
3. Verify environment variables are set in Vercel

**Fix:**
```bash
# Redeploy with new env vars
vercel env pull  # Pull vars locally for testing
npm run build
npm run preview  # Test locally before redeploying
```

---

### Issue: API 401 Errors

**Means:** Supabase token not being sent or invalid

**Check:**
1. Supabase credentials in `.env` are correct
2. Login page works and token is being created
3. API interceptor is attaching token header

**Fix:**
```bash
# Test locally first
cd frontend
npm run dev
# Try login and check Network tab for Authorization header
```

---

### Issue: CORS Errors

**Means:** Backend blocking requests from frontend domain

**Fix on Backend:**
1. Go to Render dashboard → Service → Environment
2. Update `ALLOWED_ORIGINS`:
```
["https://your-vercel-domain.vercel.app"]
```
3. Save and redeploy backend

---

### Issue: Slow Performance

**Check:**
1. Vercel analytics tab - identify slow endpoints
2. Backend performance
3. Network conditions in DevTools

---

## Updating After Deployment

To update frontend after making changes:

```bash
# Make code changes locally
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically detect the push and redeploy.

---

## Environment Variables Reference

All frontend environment variables are **prefixed with `VITE_`** (Vite requirement):

| Variable | Purpose | Format |
|----------|---------|--------|
| `VITE_API_BASE_URL` | Backend API endpoint | `https://domain.com/api/v1` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | JWT token format |

**These are injected at build time** - changes require rebuild/redeploy.

---

## Production Checklist

Before considering this production-ready:

- [ ] Backend deployed and tested
- [ ] Frontend deployed on Vercel
- [ ] All env variables set in Vercel dashboard
- [ ] Login/registration working end-to-end
- [ ] API calls sending authorization headers
- [ ] No hardcoded URLs in code
- [ ] Error handling working (401, 500, etc.)
- [ ] CORS properly configured on backend
- [ ] Tested on real devices/browsers

---

## Useful Commands

```bash
# Local development
cd frontend
npm run dev        # Start dev server on http://localhost:5173

# Build for production
npm run build      # Creates dist/ folder
npm run preview    # Preview production build locally

# Lint code
npm run lint       # Check for code issues
```

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev
- **Supabase Docs:** https://supabase.com/docs
- **Check Vercel Logs:** Click deployment → Logs tab

---

## Summary

✅ **Frontend Configuration Complete:**
- Production backend URL configured
- Environment variables set up
- Error handling implemented
- Ready for Vercel deployment

✅ **Backend Running:**
- URL: https://daily-expense-oiwb.onrender.com
- API endpoints: `/api/v1/...`
- Supabase authentication enabled

**Next:** Deploy frontend to Vercel using steps above!
