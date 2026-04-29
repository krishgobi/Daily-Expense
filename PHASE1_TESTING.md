# Phase 1: Authentication - Testing Guide

## Environment Setup

### Backend Setup
```bash
cd backend
source venv/bin/activate  # Already done
cp .env.example .env
```

Edit `.env` with:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET_KEY=your-secret-key-here
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Running the Application

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

## Test Scenarios

### 1. Register New User
**Steps:**
1. Go to http://localhost:5173/register
2. Fill in:
   - Email: `test@example.com`
   - Password: `testpassword123`
   - Confirm Password: `testpassword123`
   - Full Name: `Test User`
3. Click "Create account"

**Expected:**
- ✅ User registered successfully
- ✅ Redirected to dashboard
- ✅ User name shown in navbar

### 2. Login
**Steps:**
1. Go to http://localhost:5173/login
2. Fill in:
   - Email: `test@example.com`
   - Password: `testpassword123`
3. Click "Sign in"

**Expected:**
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ Dashboard displays user name

### 3. Protected Route
**Steps:**
1. Open DevTools (F12)
2. Go to Application → Cookies → Delete `access_token`
3. Refresh page or go to http://localhost:5173

**Expected:**
- ✅ Redirected to login page
- ✅ Cannot access dashboard without token

### 4. Token Refresh
**Steps:**
1. Login successfully
2. Wait 1 minute (token expiration is configurable)
3. Make any request to API

**Expected:**
- ✅ Token automatically refreshed
- ✅ User stays logged in

### 5. Logout
**Steps:**
1. Login to dashboard
2. Click "Logout" button

**Expected:**
- ✅ Logged out successfully
- ✅ Redirected to login page
- ✅ Tokens cleared from localStorage

### 6. Update Profile
**Steps:**
1. Login to dashboard
2. (Profile update page to be built in next phase)

**Expected:**
- ✅ Profile updates saved
- ✅ User info updated in context

## API Testing (Postman/cURL)

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Common Issues & Solutions

### Issue: Connection refused (Backend not running)
**Solution:**
```bash
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload
```

### Issue: CORS errors
**Solution:**
- Check backend CORS settings in `app/config.py`
- Ensure frontend URL is in `ALLOWED_ORIGINS`

### Issue: Database connection error
**Solution:**
- Verify `DATABASE_URL` in `.env`
- Test connection: `psql $DATABASE_URL`

### Issue: Invalid token error
**Solution:**
- Check `JWT_SECRET_KEY` is same in `.env`
- Clear localStorage and login again

## Next Steps After Auth Testing

Once auth is working:
1. Database migrations (Alembic)
2. Expense module implementation
3. Dashboard with expense summary
4. Additional features

