# Authentication Migration Guide

## Overview

This guide walks through migrating from dual auth (PyJWT + Supabase) to unified Supabase auth.

---

## Prerequisites

- Supabase project already set up
- Existing database with `public.profiles` table
- Existing user data in `auth.users` and `public.profiles`

---

## Step-by-Step Migration

### Phase 1: Backend Changes (Can be deployed independently)

#### 1. Install New Dependencies

```bash
cd backend
pip install PyJWT cryptography
# Remove: pip uninstall passlib python-jose
```

**Updated requirements.txt:**
```
PyJWT==2.8.0
cryptography==41.0.7
# Removed: passlib, python-jose
```

#### 2. Create Supabase JWT Validator

File: `backend/app/utils/supabase_jwt.py`

This file contains the `SupabaseJWTValidator` class that validates JWTs using Supabase JWKS.

#### 3. Update Dependencies

File: `backend/app/dependencies.py`

Replace `get_current_user` dependency with `get_current_user_id` that:
- Extracts JWT from Authorization header
- Validates using Supabase JWKS
- Returns user_id string

#### 4. Update Auth Routes

File: `backend/app/api/v1/auth.py`

Keep only:
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile

Remove:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

#### 5. Update All Route Files

Update all files in `backend/app/api/v1/*.py`:

**Before:**
```python
from app.dependencies import get_current_user
from app.models import User

@router.get("/expenses")
async def list_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = ExpenseService.get(db, current_user.id)
```

**After:**
```python
from app.dependencies import get_current_user_id
from uuid import UUID

@router.get("/expenses")
async def list_expenses(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = UUID(user_id)
    expense = ExpenseService.get(db, user_uuid)
```

**Files to update:**
- `app/api/v1/expenses.py`
- `app/api/v1/categories.py`
- `app/api/v1/transactions.py`
- `app/api/v1/calendar.py`
- `app/api/v1/reports.py`
- `app/api/v1/search.py`
- `app/api/v1/analytics.py`

#### 6. Test Backend

```bash
# Start backend
python -m uvicorn app.main:app --reload

# Test with curl using Supabase token
SUPABASE_TOKEN="<your-jwt-token>"
curl -H "Authorization: Bearer $SUPABASE_TOKEN" \
  http://localhost:8000/api/v1/auth/me

# Should return: { "status": "success", "data": { user profile } }
```

### Phase 2: Frontend Changes (Deploy after backend is live)

#### 1. Update API Interceptor

File: `frontend/src/services/api.ts`

Replace token handling:
- Remove localStorage access_token / refresh_token
- Get token from Supabase session in request interceptor
- Use Supabase refreshSession() instead of /auth/refresh endpoint

#### 2. Update Auth Service

File: `frontend/src/services/authService.ts`

Replace direct Supabase DB access:
- Remove `supabase.from('profiles').select/insert/update`
- Use `api.get('/auth/me')` to fetch profile
- Use `api.put('/auth/profile', data)` to update profile
- Keep `supabase.auth.signUp()` and `supabase.auth.signIn()`

#### 3. Test Frontend

```bash
cd frontend
npm run dev

# Test login flow:
1. Visit http://localhost:5173/register
2. Fill form (email, password, name)
3. Click register
4. Should redirect to dashboard
5. Open DevTools Network tab
6. Verify Authorization header has Bearer token
7. Check token is from Supabase (not backend)
```

#### 4. Remove Old Token References

Search and remove:

```bash
grep -r "access_token\|refresh_token" frontend/src --exclude-dir=node_modules
```

Files to check:
- AuthContext if using one
- Any localStorage references
- API service files

---

## Verification Checklist

### Backend Verification

- [ ] Backend starts without errors
- [ ] `/auth/me` endpoint returns user profile
- [ ] `/auth/profile` endpoint updates profile
- [ ] All protected routes require Authorization header
- [ ] Invalid tokens return 401
- [ ] Expired tokens return 401
- [ ] JWKS endpoint is accessible

### Frontend Verification

- [ ] Signup works end-to-end
- [ ] Login works end-to-end
- [ ] API calls include Authorization header with Supabase JWT
- [ ] 401 errors trigger token refresh
- [ ] Profile page loads and updates correctly
- [ ] Expenses can be created, read, updated, deleted
- [ ] Logout clears localStorage and redirects to login
- [ ] Refresh page doesn't lose session

### Database Verification

- [ ] No unused columns in `public.profiles` (removed if needed)
- [ ] No unused auth tables
- [ ] RLS policies still work correctly
- [ ] Triggers for profile creation work on signup

---

## Rollback Plan

If issues occur, you can roll back by:

1. **Restore previous backend code**
   ```bash
   git checkout HEAD~1 -- backend/
   pip install -r backend/requirements.txt
   python -m uvicorn app.main:app --reload
   ```

2. **Restore previous frontend code**
   ```bash
   git checkout HEAD~1 -- frontend/
   npm install
   npm run dev
   ```

3. **Database** - No changes needed, fully compatible

---

## Performance Impact

### Positive
- **Fewer DB queries:** No need to query User table for every request (we just extract ID from JWT)
- **Token validation cached:** JWKS public keys are cached in memory
- **Reduced roundtrips:** No separate /auth/refresh calls, Supabase SDK handles it

### Potential Issues
- **JWKS endpoint latency:** First token validation may be slow (cache mitigates)
- **Network dependency:** Backend needs internet to fetch JWKS keys

**Mitigation:**
- Cache JWKS keys in memory (already implemented)
- Implement fallback validation logic if JWKS fails

---

## Common Issues

### Issue: "JWKS endpoint unreachable"

**Cause:** Backend cannot reach Supabase

**Solution:**
```python
# backend/app/config.py
SUPABASE_URL = "https://your-project.supabase.co"  # Verify URL

# Test reachability:
curl https://your-project.supabase.co/auth/v1/keys
```

### Issue: "Invalid audience in token"

**Cause:** Token audience doesn't match expected

**Solution:**
```python
# Ensure token is issued for 'authenticated' audience
# Supabase does this by default
# If custom auth, ensure audience matches
```

### Issue: "Frontend shows 401 but token looks valid"

**Cause:** Token not being sent in Authorization header

**Solution:**
```typescript
// Debug in browser DevTools
const { data: { session } } = await supabase.auth.getSession()
console.log("Session token:", session?.access_token)

// Verify it's in request headers
// Network tab → Select API request → Headers → Look for Authorization
```

---

## Code Snippets for Quick Reference

### Backend: Validate Token (in dependencies.py)

```python
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    validator = get_supabase_validator()
    try:
        return validator.extract_user_id(token)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Frontend: Send Token in API (in api.ts)

```typescript
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

### Frontend: Fetch Profile (in authService.ts)

```typescript
private async fetchUserProfile(): Promise<User> {
  const response = await api.get('/auth/me')
  return response.data.data
}
```

---

## Additional Resources

- [Supabase Auth Deep Dive](https://supabase.com/docs/learn/auth-deep-dive/jwts)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Validation Best Practices](https://tools.ietf.org/html/rfc7519)

---

## Support

If you encounter issues:

1. Check [UNIFIED_AUTH_ARCHITECTURE.md](./UNIFIED_AUTH_ARCHITECTURE.md) for details
2. Review troubleshooting section above
3. Check backend logs: `python -m uvicorn ... --log-level debug`
4. Check frontend console: F12 → Console tab
5. Verify Supabase project settings in dashboard

