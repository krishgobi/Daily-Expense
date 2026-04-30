# Quick Reference: Unified Authentication

**Last Updated:** April 30, 2026

---

## For Frontend Developers

### Login/Signup
```typescript
import { supabase } from './services/supabaseClient'

// Signup
const { data: authData, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: { data: { full_name: 'John Doe' } }
})

// Login
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Logout
await supabase.auth.signOut()
```

### Accessing User Profile
```typescript
import api from './services/api'

// Get current user profile
const response = await api.get('/auth/me')
const profile = response.data.data
// { id, email, full_name, currency_code, timezone, created_at }

// Update profile
const response = await api.put('/auth/profile', {
  full_name: 'New Name',
  currency_code: 'USD',
  timezone: 'America/New_York'
})
```

### Making API Calls
```typescript
import api from './services/api'

// Get request - JWT automatically added
const expenses = await api.get('/expenses')

// Post request - JWT automatically added
const newExpense = await api.post('/expenses/cash', {
  purpose: 'Groceries',
  amount: 500,
  date: '2026-04-30'
})

// Update request - JWT automatically added
const updated = await api.put('/expenses/123', { amount: 600 })

// Delete request - JWT automatically added
await api.delete('/expenses/123')
```

### Check Authentication Status
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Get current user from auth
const { data: { user } } = await supabase.auth.getUser()

// Check if authenticated
const isAuthenticated = !!session?.access_token
```

### What NOT to Do ❌
```typescript
// ❌ DON'T access profiles table directly
// const profiles = await supabase.from('profiles').select()

// ❌ DON'T manage tokens manually
// localStorage.setItem('access_token', token)

// ❌ DON'T call /auth/register or /auth/login
// await api.post('/auth/register', {...})

// ❌ DON'T call /auth/refresh
// await api.post('/auth/refresh', {...})

// ✅ DO let Supabase SDK handle it all
```

---

## For Backend Developers

### Protect a Route
```python
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user_id
from sqlalchemy.orm import Session
from app.database.connection import get_db
from uuid import UUID

router = APIRouter()

@router.get("/expenses")
async def list_expenses(
    user_id: str = Depends(get_current_user_id),  # JWT → user_id
    db: Session = Depends(get_db)
):
    user_uuid = UUID(user_id)
    
    # Now you have validated user_id
    expenses = db.query(Expense).filter(Expense.user_id == user_uuid).all()
    
    return {
        "status": "success",
        "data": [ExpenseResponse.from_orm(e) for e in expenses]
    }
```

### Access User Profile
```python
@router.get("/users/profile")
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_uuid = UUID(user_id)
    
    # Query profile
    profile = db.query(User).filter(User.id == user_uuid).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "status": "success",
        "data": UserResponse.from_orm(profile)
    }
```

### Update User Profile (Backend)
```python
@router.put("/auth/profile")
async def update_profile(
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user_uuid = UUID(user_id)
    
    # Get user
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success",
        "data": UserResponse.from_orm(user)
    }
```

### What NOT to Do ❌
```python
# ❌ DON'T create your own JWT
# from app.utils.jwt import create_access_token
# token = create_access_token(user_id, email)

# ❌ DON'T hash passwords
# from app.utils.password import hash_password
# hashed = hash_password(password)

# ❌ DON'T call custom auth endpoints
# POST /auth/register, /auth/login, /auth/refresh

# ❌ DON'T return User object from dependency
# return db.query(User).filter(...).first()

# ✅ DO use Supabase JWT validation
# Just add: user_id: str = Depends(get_current_user_id)

# ✅ DO extract user_id and use it directly
# user_uuid = UUID(user_id)
```

### Debug JWT Validation
```python
import logging
from app.utils.supabase_jwt import get_supabase_validator

logger = logging.getLogger(__name__)

# Get validator
validator = get_supabase_validator()

# Test with token
try:
    token = "eyJhbGci..."
    user_id = validator.extract_user_id(token)
    logger.info(f"Valid token for user: {user_id}")
except Exception as e:
    logger.error(f"Token validation failed: {e}")
```

---

## JWT Token Structure

### Supabase JWT (Used Now ✅)

```
Header:
{
  "alg": "RS256",          ← RSA signature
  "typ": "JWT",
  "kid": "abc123"          ← Key ID for JWKS
}

Payload:
{
  "iss": "https://..supabase.co/auth/v1",  ← Issuer
  "sub": "550e8400-e29b-41d4-a716-446655440000",  ← User ID
  "aud": "authenticated",  ← Audience
  "exp": 1682946799,       ← Expiration (1 hour from now)
  "iat": 1682943199,       ← Issued at
  "auth_time": 1682943199,
  "email": "user@example.com",
  "email_confirmed": true
}

Signature: (Signed with Supabase's private key)
RSASSA-PKCS1-v1_5 using SHA-256
```

### Backend JWT (Old ❌ - Removed)

```
Header: { "alg": "HS256" }  ← HMAC (symmetric key)
Payload: { "user_id": "...", "email": "...", "exp": ... }
Signature: (Signed with backend secret - less secure)

WHY REMOVED:
- No public key verification
- Easier to forge
- Redundant with Supabase
```

---

## Common Scenarios

### Scenario: Create Protected Endpoint

```python
# 1. Add dependency
from app.dependencies import get_current_user_id

# 2. Add parameter
async def my_route(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):

# 3. Convert to UUID
from uuid import UUID
user_uuid = UUID(user_id)

# 4. Use in query
result = db.query(Expense).filter(Expense.user_id == user_uuid).all()

# 5. Return response
return { "status": "success", "data": [...] }
```

### Scenario: Handle 401 Unauthorized

**Backend:**
```python
# Automatically handled by dependency
# If JWT invalid/expired → HTTPException(401)
```

**Frontend:**
```typescript
// Automatically handled by axios interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try refresh
      await supabase.auth.refreshSession()
      // Retry request
      return api(error.config)
    }
  }
)
```

### Scenario: Multi-Tenant Data Access

```python
# Backend automatically filters by user_id from JWT
@router.get("/expenses")
async def list_expenses(
    user_id: str = Depends(get_current_user_id),  # From JWT
    db: Session = Depends(get_db)
):
    user_uuid = UUID(user_id)
    
    # Only this user's expenses
    expenses = db.query(Expense)\
        .filter(Expense.user_id == user_uuid)\
        .all()
    
    # Frontend cannot see other users' data
    # (even if they try to guess user_id in JWT)
```

---

## Environment Variables

### Frontend `.env`
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

### Backend `.env`
```bash
# NEW (for JWT validation)
SUPABASE_URL=https://your-project.supabase.co

# OLD (can be removed)
JWT_SECRET_KEY=...          # No longer used
JWT_ALGORITHM=HS256         # No longer used

# Still needed
DATABASE_URL=postgresql://...
```

---

## File Reference

### Important Files

```
Backend:
- app/utils/supabase_jwt.py           # JWT validator
- app/dependencies.py                 # get_current_user_id dependency
- app/api/v1/auth.py                  # /auth/me, /auth/profile
- requirements.txt                    # Dependencies

Frontend:
- src/services/supabaseClient.ts      # Supabase setup
- src/services/api.ts                 # Axios + interceptor
- src/services/authService.ts         # Auth logic
```

### Documentation

```
- UNIFIED_AUTH_ARCHITECTURE.md        # Full details (read this!)
- AUTH_MIGRATION_GUIDE.md             # Setup instructions
- AUTH_REFACTORING_SUMMARY.md         # What changed
- BEFORE_AFTER_COMPARISON.md          # Visual comparison
- QUICK_REFERENCE.md                  # This file!
```

---

## Testing Locally

### Test Backend Auth

```bash
# 1. Start backend
cd backend
python -m uvicorn app.main:app --reload

# 2. Get token from frontend login
# Open browser → http://localhost:5173
# Login → Open DevTools → Application → Cookies
# Copy supabase-auth-token

# 3. Test with curl
TOKEN="<paste-token-here>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/auth/me

# Expected response:
# { "status": "success", "data": { id, email, full_name, ... } }
```

### Test Frontend Integration

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Open http://localhost:5173

# 3. Test signup
# - Fill form
# - Click register
# - Check profile loads

# 4. Test API calls
# - Open DevTools Network tab
# - Create expense
# - Click on POST request
# - Check Headers → Authorization: Bearer <token>

# 5. Verify token is Supabase JWT
# Decode token at https://jwt.io
# Check: iss, sub, aud, exp claims
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 on API calls | Check Authorization header has Bearer token |
| Token validation fails | Verify SUPABASE_URL in backend .env |
| "Invalid signature" | Ensure JWKS endpoint is accessible |
| Profile not loading | Check /auth/me returns user profile |
| Token not refreshing | Check supabase.auth.refreshSession() works |
| Users can see other data | Verify user_id is extracted from JWT, not frontend |

---

## Key Principles

1. **JWT from Supabase** ← Use ONLY this
2. **No custom tokens** ← Remove if found
3. **JWKS validation** ← Trust Supabase signature
4. **User ID from JWT** ← Don't trust frontend
5. **No password hashing** ← Supabase handles
6. **Automatic token refresh** ← SDK does it
7. **API gateway pattern** ← Backend validates all

---

## Checklists

### Before Deploying Backend
- [ ] `pip install -r requirements.txt` ✓
- [ ] Backend starts without errors
- [ ] `/auth/me` endpoint works with valid JWT
- [ ] `/auth/me` returns 401 with invalid JWT
- [ ] All protected routes require JWT
- [ ] JWKS endpoint accessible

### Before Deploying Frontend
- [ ] `npm install` ✓
- [ ] Frontend starts without errors
- [ ] Signup/login works with Supabase
- [ ] API calls include Authorization header
- [ ] Supabase JWT in header (not backend token)
- [ ] Profile endpoint works
- [ ] Expenses CRUD works

### Post-Deployment
- [ ] Check backend logs for JWT errors
- [ ] Verify no 401 spikes
- [ ] Confirm token refresh working
- [ ] Monitor JWKS endpoint reachability
- [ ] Test with multiple user accounts

---

## Important Links

- [Supabase JWT Docs](https://supabase.com/docs/learn/auth-deep-dive/jwts)
- [FastAPI Dependency Injection](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)

---

**Questions?** Check the full documentation files or ask in code review!

