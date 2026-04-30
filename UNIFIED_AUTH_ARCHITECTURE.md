# Unified Authentication Architecture

## Overview

This document describes the refactored authentication system that unifies around **Supabase Auth** as the single source of truth. The dual authentication system (PyJWT on backend + Supabase on frontend) has been removed to eliminate session inconsistency issues and improve scalability.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters email + password                                │
│  2. supabase.auth.signUp() / supabase.auth.signIn()             │
│  3. Supabase returns JWT access token (valid 1 hour)            │
│  4. localStorage stores JWT                                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Axios API Interceptor                                    │   │
│  │ ────────────────────────────────────────────────────────│   │
│  │ On every API call:                                       │   │
│  │ 1. Get current session: supabase.auth.getSession()      │   │
│  │ 2. Extract access_token from session                     │   │
│  │ 3. Add to header: Authorization: Bearer <access_token>  │   │
│  │ 4. Send request to FastAPI                              │   │
│  │                                                          │   │
│  │ On 401 Unauthorized:                                    │   │
│  │ 1. Call supabase.auth.refreshSession()                  │   │
│  │ 2. Get new access_token                                 │   │
│  │ 3. Retry original request                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP + Bearer JWT
                               │ (Supabase-signed)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FastAPI BACKEND (Python)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Dependency: get_current_user_id()                       │   │
│  │ ────────────────────────────────────────────────────────│   │
│  │ For EVERY protected route:                              │   │
│  │                                                          │   │
│  │ 1. Extract JWT from Authorization header                │   │
│  │ 2. Validate signature using Supabase JWKS              │   │
│  │    URL: https://<project>.supabase.co/auth/v1/keys      │   │
│  │ 3. Verify:                                              │   │
│  │    - Signature (RS256)                                  │   │
│  │    - Expiration (exp claim)                             │   │
│  │    - Audience (authenticated)                           │   │
│  │    - Issuer (Supabase project)                          │   │
│  │ 4. Extract user_id from 'sub' claim                     │   │
│  │ 5. Return user_id to route handler                      │   │
│  │                                                          │   │
│  │ On invalid/expired token:                               │   │
│  │ → Return 401 Unauthorized                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Route Handlers (with authentication):                          │
│  ────────────────────────────────────────────────────────────   │
│  ✓ GET  /api/v1/auth/me           → Get current user profile   │
│  ✓ PUT  /api/v1/auth/profile      → Update user profile        │
│  ✓ POST /api/v1/expenses/cash     → Create expense              │
│  ✓ GET  /api/v1/expenses          → List user expenses         │
│  ✓ ... all other protected routes                              │
│                                                                  │
│  Response Format:                                               │
│  {                                                              │
│    \"status\": \"success\",                                       │
│    \"data\": { user_id, email, full_name, ... }                 │
│  }                                                              │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ SQL Queries +
                               │ User ID lookup
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE POSTGRESQL DATABASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ auth.users (managed by Supabase)                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ id              (UUID)                                   │   │
│  │ email           (string)                                │   │
│  │ encrypted_password (bcrypt, never visible to apps)      │   │
│  │ email_confirmed_at (timestamp)                          │   │
│  │ last_sign_in_at (timestamp)                             │   │
│  │ user_metadata   (JSON - contains full_name)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ public.profiles (created by trigger on user signup)     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ id              (UUID, PK, FK → auth.users.id)          │   │
│  │ full_name       (string)                                │   │
│  │ currency_code   (string, default: INR)                  │   │
│  │ timezone        (string, default: Asia/Kolkata)         │   │
│  │ created_at      (timestamp)                             │   │
│  │ updated_at      (timestamp)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ public.expenses, transactions, categories, etc.         │   │
│  │ (All linked to profiles.id via user_id FK)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow - Step by Step

### 1. User Signup

```
Frontend:
1. User fills signup form (email, password, full_name)
2. Call: await supabase.auth.signUp({
     email, password,
     options: { data: { full_name } }
   })
3. Supabase:
   - Creates auth.users entry
   - Sends confirmation email (if enabled)
   - Triggers database function to create public.profiles row
   - Returns JWT access token

Frontend:
4. Store JWT in Supabase session (automatically handled by SDK)
5. localStorage.setItem('user', JSON.stringify(userProfile))
```

### 2. User Login

```
Frontend:
1. User fills login form (email, password)
2. Call: await supabase.auth.signInWithPassword({ email, password })
3. Supabase:
   - Validates credentials
   - Returns JWT access token (valid 1 hour)

Frontend:
4. Fetch user profile via API: await api.get('/auth/me')
5. Backend (FastAPI):
   - Extract JWT from Authorization header
   - Validate JWT using Supabase JWKS
   - Extract user_id from 'sub' claim
   - Query database: SELECT * FROM profiles WHERE id = user_id
   - Return user profile

Frontend:
6. localStorage.setItem('user', JSON.stringify(userProfile))
```

### 3. API Call with Authentication

```
Frontend:
1. Axios interceptor before request:
   - Get Supabase session: await supabase.auth.getSession()
   - Extract access_token
   - Add header: Authorization: Bearer <access_token>

2. Send request to backend with JWT

Backend:
1. FastAPI dependency get_current_user_id() is called:
   - Extract JWT from Authorization header
   - Validate signature using Supabase JWKS
   - Check expiration, audience, issuer
   - Extract user_id from 'sub' claim
   
2. Route handler receives user_id
3. Execute business logic with user_id
4. Return response

Frontend:
- If 200 OK: Use response
- If 401 Unauthorized: 
  - Axios interceptor calls supabase.auth.refreshSession()
  - Retry original request with new token
  - If refresh fails: Redirect to /login
```

### 4. Token Refresh

```
Frontend (Automatic):
1. When access_token is about to expire (< 60 seconds):
   - Supabase SDK automatically refreshes using refresh_token
   - New access_token is returned

Alternative (Manual):
1. When 401 received:
   - Call: await supabase.auth.refreshSession()
   - Get new access_token and refresh_token
   - Retry original request
```

---

## Key Components

### Frontend: Supabase Client (`frontend/src/services/supabaseClient.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Purpose:** Initialize Supabase client with project URL and anon key. Used for auth operations only.

### Frontend: Axios API Interceptor (`frontend/src/services/api.ts`)

```typescript
// Request interceptor: Attach Supabase JWT
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Response interceptor: Handle 401 + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      const { data } = await supabase.auth.refreshSession()
      error.config._retry = true
      error.config.headers.Authorization = `Bearer ${data.session?.access_token}`
      return api(error.config)
    }
    return Promise.reject(error)
  }
)
```

**Purpose:** 
- Inject Supabase JWT token into every API call
- Automatically refresh expired tokens
- Redirect to login on persistent auth failure

### Backend: Supabase JWT Validator (`backend/app/utils/supabase_jwt.py`)

```python
class SupabaseJWTValidator:
    def __init__(self, supabase_url: str):
        self.jwks_url = f"{supabase_url}/auth/v1/keys"
        self.issuer = f"{supabase_url}/auth/v1"
        self.jwks_client = PyJWKClient(self.jwks_url)
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        signing_key = self.jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=self.issuer,
        )
        return payload
    
    def extract_user_id(self, token: str) -> str:
        payload = self.validate_token(token)
        return payload.get("sub")  # User ID
```

**Purpose:**
- Validate JWT signature using Supabase JWKS public keys
- Check token expiration
- Verify issuer and audience
- Extract user ID from 'sub' claim

### Backend: Authentication Dependency (`backend/app/dependencies.py`)

```python
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    FastAPI dependency to extract and validate user ID from Supabase JWT.
    Used on all protected routes.
    """
    token = credentials.credentials
    try:
        validator = get_supabase_validator()
        user_id = validator.extract_user_id(token)
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Purpose:** Dependency injection for route protection. Returns user_id if token is valid.

### Backend: Auth Endpoints

```python
@router.get("/auth/me")
async def get_current_user_info(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Return current user profile from database"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    return { "status": "success", "data": UserResponse.from_orm(user) }

@router.put("/auth/profile")
async def update_profile(
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update current user profile"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    # Update profile fields
    db.commit()
    return { "status": "success", "data": UserResponse.from_orm(user) }
```

**Purpose:** 
- `/auth/me`: Fetch user profile (replaces direct Supabase DB access)
- `/auth/profile`: Update profile (replaces direct Supabase DB access)

---

## What Was Removed

### ❌ Backend Authentication (PyJWT)

- **Removed:**
  - `app/utils/jwt.py` - Custom token creation/validation
  - `app/utils/password.py` - Password hashing (passlib)
  - `app/services/auth_service.py` - Custom auth logic
  - Auth routes: `/auth/register`, `/auth/login`, `/auth/refresh`
  - `User.password_hash` field (no longer needed)

- **Why?**
  - Supabase already handles auth securely
  - Dual auth created session inconsistency
  - Removed single source of truth

### ❌ Frontend Dependency on Backend Tokens

- **Removed:**
  - localStorage access_token / refresh_token
  - API refresh endpoint calls
  - Custom token refresh logic

- **Why?**
  - Supabase SDK manages tokens automatically
  - No need to manually store/refresh backend tokens

### ❌ Frontend Direct Supabase DB Access

- **Removed:**
  - `supabase.from('profiles').select/insert/update`
  - Frontend database queries

- **Why?**
  - Backend now provides profile endpoints
  - Centralized control and consistency
  - Security: User ID comes from validated JWT, not frontend

---

## Security Improvements

### 1. Token Signature Validation

- **Before:** Backend accepted tokens without verification
- **After:** Backend validates every token using Supabase JWKS
  - Ensures token was signed by Supabase
  - Detects forged or tampered tokens

### 2. Token Expiration

- **Before:** Backend tokens had no clear expiration
- **After:** Supabase tokens expire in 1 hour
  - Automatic refresh via SDK
  - Reduced window for token theft

### 3. User Identity Verification

- **Before:** Frontend could claim any user_id
- **After:** User ID comes from JWT signed by Supabase
  - Frontend cannot forge user identity
  - Backend trusts JWT signature

### 4. Centralized Auth State

- **Before:** Auth managed in two places (frontend + backend)
- **After:** Single source of truth (Supabase)
  - No sync issues
  - Consistent user state

---

## Environment Variables

### Frontend (`.env`)

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`.env`)

```bash
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET_KEY=(no longer used)  # Can be removed
JWT_ALGORITHM=HS256              # Can be removed
```

---

## Deployment Checklist

- [ ] Update backend requirements.txt (remove PyJWT, passlib)
- [ ] Deploy new FastAPI version with Supabase JWT validation
- [ ] Update frontend to use Supabase JWT in API interceptor
- [ ] Test login/signup flow with Supabase
- [ ] Test API calls with Supabase JWT
- [ ] Test token refresh on 401
- [ ] Verify all protected routes enforce authentication
- [ ] Test logout and session cleanup
- [ ] Monitor JWT validation errors in logs
- [ ] Verify profile endpoints work correctly

---

## Troubleshooting

### Issue: "Invalid token" on API calls

**Solution:**
1. Verify Supabase URL in backend config
2. Check JWKS endpoint is accessible: `https://<project>.supabase.co/auth/v1/keys`
3. Ensure frontend is sending JWT in Authorization header
4. Check token is not expired

### Issue: 401 on refresh

**Solution:**
1. Verify refresh_token is valid in Supabase session
2. Check `supabase.auth.refreshSession()` response
3. Ensure internet connection is stable
4. Clear browser cache and localStorage

### Issue: Profile endpoints return 404

**Solution:**
1. Verify `public.profiles` table exists
2. Check database trigger creates profile on auth.users signup
3. Ensure user_id matches between auth.users and profiles
4. Check RLS policies allow profile access

---

## Production Considerations

### Rate Limiting

Add rate limiting to `/auth/*` endpoints:

```python
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Implement per-user rate limiting
    pass
```

### Logging

Log authentication events:

```python
logger.info(f"User authenticated: {user_id}")
logger.warning(f"Invalid token attempt: {error}")
```

### Monitoring

Monitor JWT validation failures:

```python
metrics.counter("jwt.validation_error", tags={"error": error_type})
```

---

## References

- [Supabase JWT Docs](https://supabase.com/docs/learn/auth-deep-dive/jwts)
- [Supabase JWKS Endpoint](https://supabase.com/docs/guides/auth/jwts)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

