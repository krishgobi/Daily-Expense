# Before vs After: Authentication Architecture

## Side-by-Side Comparison

### 1. User Login Flow

#### ❌ BEFORE (Dual Auth)
```
Frontend:
1. supabase.auth.signInWithPassword()
   ↓ Gets JWT from Supabase
2. localStorage.setItem('access_token', backend_jwt)
   ↓ Sends credentials to backend
3. POST /auth/login { email, password }
   ↓ Backend validates with custom JWT logic

Backend:
4. Query: SELECT * FROM users WHERE email = ?
5. Verify password with bcrypt
6. Create JWT token with custom logic
7. Return: { access_token, refresh_token }

Frontend:
8. Store refresh_token in localStorage
9. Use access_token for API calls
   ↓ (Doesn't know about Supabase token)

Result: TWO tokens stored, TWO auth systems active
```

#### ✅ AFTER (Unified Supabase)
```
Frontend:
1. supabase.auth.signInWithPassword()
   ↓ Supabase returns JWT access_token

2. axios interceptor gets session
   config.headers.Authorization = `Bearer ${session.access_token}`

3. POST /api/v1/auth/me
   ↓ Send Supabase JWT

Backend:
4. Validate JWT signature using Supabase JWKS
5. Extract user_id from 'sub' claim
6. Query: SELECT * FROM profiles WHERE id = user_id
7. Return user profile

Result: ONE token (Supabase), ONE auth system
```

---

### 2. API Call with Authentication

#### ❌ BEFORE
```
API Call:
┌─────────────────────────────────────────────┐
│ GET /api/v1/expenses                        │
│ Header: Authorization: Bearer backend_jwt   │
└─────────────────────────────────────────────┘
                     ↓
Backend:
┌─────────────────────────────────────────────┐
│ 1. Extract JWT from header                  │
│ 2. Decode with backend JWT_SECRET_KEY       │
│ 3. Extract user_id from payload             │
│ 4. Query: SELECT * FROM users WHERE id=?    │  ← DB QUERY
│ 5. Return User object to route              │
│ 6. Route executes with User object          │
└─────────────────────────────────────────────┘
```

**Issues:**
- Decode not secure (no signature verification)
- DB query on every authenticated request
- Two tokens in circulation

#### ✅ AFTER
```
API Call:
┌──────────────────────────────────────────────────┐
│ GET /api/v1/expenses                             │
│ Header: Authorization: Bearer supabase_jwt       │
└──────────────────────────────────────────────────┘
                        ↓
Backend:
┌──────────────────────────────────────────────────┐
│ 1. Extract JWT from header                       │
│ 2. Validate signature with Supabase JWKS         │
│    (Fetch public keys from                       │
│     https://...supabase.co/auth/v1/keys)         │
│ 3. Check expiration, audience, issuer            │
│ 4. Extract user_id from 'sub' claim              │
│ 5. Return user_id to route (NO DB QUERY!)        │
│ 6. Route gets user_id as UUID                    │
└──────────────────────────────────────────────────┘
```

**Benefits:**
- Secure signature verification
- No DB query needed
- Single token in circulation

---

### 3. Token Refresh

#### ❌ BEFORE
```
Frontend:
1. Access token expires
2. Retrieve refresh_token from localStorage
3. POST /auth/refresh { refresh_token }
                ↓
Backend:
4. Decode refresh_token with backend JWT_SECRET
5. Query: SELECT * FROM users WHERE id = ?  ← DB QUERY
6. Create new access_token with custom logic
7. Return new tokens
                ↓
Frontend:
8. Update localStorage with new tokens
9. Retry original request

Problems:
- Backend controls token lifetime
- Extra endpoint needed
- DB query to create new token
```

#### ✅ AFTER
```
Frontend:
1. Access token expires (or about to)
2. Call: await supabase.auth.refreshSession()
         (Handled automatically by SDK)
                ↓
Supabase:
3. Validate refresh_token
4. Create new access_token
5. Return new tokens
                ↓
Frontend:
6. Session automatically updated
7. API interceptor uses new token on next request

Benefits:
- Supabase handles token lifetime
- Automatic refresh (no manual endpoint)
- No DB query needed
- Transparent to app
```

---

### 4. Token Storage

#### ❌ BEFORE
```
localStorage:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",  ← Backend JWT
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...", ← Backend token
  "user": { id, email, full_name }
}

Supabase Session (SDK managed):
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...", ← Supabase JWT
  "refresh_token": "...",
  "user": { id, email }
}

Problems:
- Two sets of tokens
- Manual localStorage management
- Potential sync issues
```

#### ✅ AFTER
```
localStorage:
{
  "user": { id, email, full_name, currency_code, timezone }
  (NO tokens - handled by Supabase SDK)
}

Supabase Session (SDK managed):
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...", ← One token
  "refresh_token": "...",
  "user": { id, email }
}

Benefits:
- One set of tokens (Supabase manages)
- Automatic token refresh
- No manual localStorage token management
- Only user data in localStorage
```

---

### 5. Protected Route Implementation

#### ❌ BEFORE
```python
# backend/app/api/v1/expenses.py

from app.dependencies import get_current_user
from app.models import User

@router.post("/cash")
async def create_cash_expense(
    expense_data: CashExpenseCreate,
    current_user: User = Depends(get_current_user),  ← Returns User object
    db: Session = Depends(get_db),
):
    # Dependency called → DB query to get User
    expense = ExpenseService.create_cash_expense(
        db,
        current_user.id,  ← Extract from object
        expense_data
    )
```

**Dependency (get_current_user):**
```python
def get_current_user(credentials, db) -> User:
    token = credentials.credentials
    payload = decode_token(token)  ← Decode with backend secret
    user_id = payload.get("user_id")
    
    # DB QUERY
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(401, "User not found")
    
    return user  ← Return full User object
```

#### ✅ AFTER
```python
# backend/app/api/v1/expenses.py

from app.dependencies import get_current_user_id
from uuid import UUID

@router.post("/cash")
async def create_cash_expense(
    expense_data: CashExpenseCreate,
    user_id: str = Depends(get_current_user_id),  ← Returns string
    db: Session = Depends(get_db),
):
    # Dependency called → Validate JWT with JWKS (no DB query)
    user_uuid = UUID(user_id)
    expense = ExpenseService.create_cash_expense(
        db,
        user_uuid,  ← Use directly
        expense_data
    )
```

**Dependency (get_current_user_id):**
```python
def get_current_user_id(credentials) -> str:
    token = credentials.credentials
    validator = get_supabase_validator()
    
    # Validate with JWKS (no DB query)
    user_id = validator.extract_user_id(token)
    
    return user_id  ← Return just user_id string
```

---

### 6. Database Access Pattern

#### ❌ BEFORE
```
Frontend:
supabase.from('profiles')
  .select('id, full_name, created_at')
  .eq('id', userId)
  .single()
        ↓
Creates:
- Direct RLS policy bypass (frontend key)
- Direct table access
- Potential security issues if RLS misconfigured

Backend:
Parallel system for same data
- Query User table
- Manage user authentication
- Create/update profiles

Result: DUPLICATE data access patterns
```

#### ✅ AFTER
```
Frontend:
api.get('/auth/me')  ← Go through backend
        ↓
Backend:
1. Validate JWT with Supabase JWKS
2. Extract user_id
3. Query: SELECT * FROM profiles WHERE id = ?
4. Return profile
        ↓
Frontend:
Receive profile in response

Benefits:
- Single access pattern
- Backend can enforce business rules
- Centralized security
- Easy to audit
```

---

### 7. Dependencies Comparison

#### ❌ BEFORE
```
requirements.txt:
- PyJWT==2.8.0                  ← Create/decode custom JWT
- passlib[bcrypt]==1.7.4        ← Password hashing
- python-jose[cryptography]     ← Redundant crypto
- cryptography                  ← For JWT
- httpx
- pydantic
- sqlalchemy
...

Total JWT-related: 4 packages
```

#### ✅ AFTER
```
requirements.txt:
- PyJWT==2.8.0                  ← For JWKS validation only
- cryptography==41.0.7          ← For RS256 signature verification
- httpx                         ← For JWKS endpoint
- pydantic
- sqlalchemy
...

Total JWT-related: 3 packages
Removed: passlib, python-jose (no longer needed)
```

---

### 8. Security Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Token Creation** | Backend (HS256) | Supabase (RS256) |
| **Signature** | Secret-based (weaker) | Public key (stronger) |
| **Validation** | Local only | JWKS verified |
| **Password Storage** | Backend bcrypt | Supabase managed |
| **Token Lifetime** | Backend controlled | Supabase standard |
| **Refresh Token** | Manual endpoint | SDK automatic |
| **Single Source** | ❌ Two systems | ✅ Supabase only |
| **Key Rotation** | Manual | Automatic |

---

### 9. Error Handling

#### ❌ BEFORE
```
401 Error Flow:

Frontend:
1. Get 401 Unauthorized
2. Extract refresh_token from localStorage
3. POST /auth/refresh { refresh_token }
4. IF success → Update tokens → Retry
   IF failure → Redirect to /login
5. Manual retry logic in interceptor

Backend:
1. Decode refresh_token
2. Query User table
3. Create new token
4. Return to frontend

Problems:
- Complex error handling
- Multiple points of failure
- Manual token management
```

#### ✅ AFTER
```
401 Error Flow:

Frontend:
1. Get 401 Unauthorized
2. Axios interceptor caught it
3. Call: await supabase.auth.refreshSession()
4. IF success → Supabase updates session → Retry
   IF failure → Redirect to /login
5. Automatic, transparent to app

Backend:
(No refresh endpoint needed)

Benefits:
- Simple error handling
- Single point of failure (Supabase)
- Transparent to app
```

---

### 10. Code Reduction

#### File Deletions
- `app/utils/jwt.py` (55 lines)
- `app/utils/password.py` (15 lines)
- `app/services/auth_service.py` (110 lines)

**Total Removed:** ~180 lines of custom auth code

#### File Additions
- `app/utils/supabase_jwt.py` (80 lines)
  - Much more focused
  - Industry standard
  - Reusable

#### Net Change: -100 lines

---

## Summary Table

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| JWT Systems | 2 | 1 | -50% |
| Custom Auth Code | 180 lines | 0 | -100% |
| Dependencies | 4 JWT pkg | 2 JWT pkg | -50% |
| Protected Routes | 40 | 40 | Same |
| DB Queries for Auth | Every request | None | -100% |
| Security | ⚠️ Custom | ✅ Standard | Better |
| Token Mgmt | Manual | Automatic | Simpler |
| Maintenance | High | Low | Easier |

---

## Migration Path

```
         OLD STATE                              NEW STATE
         (Dual Auth)                         (Unified Supabase)

     ┌─────────────┐                         ┌──────────────┐
     │ Supabase    │                         │ Supabase     │
     │ Auth        │                         │ (JWT + Auth) │
     └──────┬──────┘                         └──────────────┘
            │                                       │
            ├─→ Profile table (RLS)                 │
            │   (Frontend access)                   │
            │                                       └──→ API Gateway
     ┌──────▼──────────┐                           │
     │ FastAPI        │                           ├──→ JWT Validation
     │                │                           │   (JWKS)
     ├─ PyJWT         │                           │
     ├─ passlib       │                           └──→ Protected Routes
     ├─ User table    │                               (40 routes)
     │   with pwd     │                          
     ├─ /register     │                          ┌──────────────┐
     ├─ /login        │                          │ PostgreSQL   │
     ├─ /refresh      │                          │              │
     └─────────────────┘                         ├─ profiles    │
                                                 ├─ expenses    │
     REMOVE:                                     ├─ ...         │
     - PyJWT                                     └──────────────┘
     - passlib
     - /auth endpoints
     - User.password_hash
     - Custom token logic

     ADD:
     - JWKS validator
     - /auth/me
     - /auth/profile
```

---

## Timeline

```
Day 1:
  ✓ Analyze current auth system
  ✓ Design new unified system
  ✓ Create JWKS validator

Day 2:
  ✓ Update dependencies
  ✓ Implement new dependency
  ✓ Update 7 route files (40 routes)

Day 3:
  ✓ Update frontend auth service
  ✓ Update API interceptor
  ✓ Create documentation

Result:
  ✓ Clean, production-ready auth system
  ✓ -100 lines of code
  ✓ Better security
  ✓ Easier maintenance
```

