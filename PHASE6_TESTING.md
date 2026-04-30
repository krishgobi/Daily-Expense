# Phase 6: Search & Calendar - Testing Guide

## Environment Setup (Same as Phase 1)

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

## Phase 6 Test Scenarios

### Setup: Create Test Data

Before testing search and calendar, create some test data:

#### 1. Create Test Expenses
```bash
curl -X POST http://localhost:8000/api/v1/expenses/cash \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Grocery shopping",
    "amount": 2500,
    "description": "Weekly vegetables and staples",
    "location": "Big Bazaar",
    "date": "2026-04-27"
  }'

curl -X POST http://localhost:8000/api/v1/expenses/digital \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Netflix subscription",
    "amount": 199,
    "payment_method": "UPI",
    "date": "2026-04-28"
  }'
```

#### 2. Create Test Transactions
```bash
curl -X POST http://localhost:8000/api/v1/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "person_name": "Rahul Kumar",
    "amount": 5000,
    "transaction_type": "BORROWED",
    "purpose": "Movie tickets and dinner",
    "given_date": "2026-04-20",
    "expected_return_date": "2026-04-30"
  }'

curl -X POST http://localhost:8000/api/v1/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "person_name": "Priya Singh",
    "amount": 1000,
    "transaction_type": "LENT",
    "purpose": "Coffee money",
    "given_date": "2026-04-25",
    "expected_return_date": "2026-04-26"
  }'

curl -X POST http://localhost:8000/api/v1/transactions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "person_name": "Amit Patel",
    "amount": 2000,
    "transaction_type": "BORROWED",
    "purpose": "Lunch money",
    "given_date": "2026-04-15",
    "expected_return_date": "2026-04-20"
  }'
```

### 1. Search - Basic Functionality

#### Test 1.1: Search Expenses by Purpose
**Steps:**
1. Go to http://localhost:5173/search
2. Enter "grocery" in search box
3. Verify results show expense with "Grocery shopping" purpose

**Expected:**
- ✅ Search results displayed
- ✅ Correct expense shows in results
- ✅ Shows purpose, amount, type, date, location

#### Test 1.2: Search Transactions by Person
**Steps:**
1. Go to http://localhost:5173/search
2. Enter "Rahul" in search box
3. Verify transaction with "Rahul Kumar" appears

**Expected:**
- ✅ Transaction appears in results
- ✅ Shows person name, amount, type, status
- ✅ Clickable to view details

#### Test 1.3: Global Search
**Steps:**
1. Go to http://localhost:5173/search
2. Enter "money" in search box
3. Verify results show transactions with "money" in purpose

**Expected:**
- ✅ Multiple result types (transactions) shown
- ✅ Tabbed interface shows counts for each type
- ✅ All/Expenses/Transactions/Categories tabs visible

### 2. Search - Filters

#### Test 2.1: Filter by Type
**Steps:**
1. Go to http://localhost:5173/search
2. Search for "subscription" 
3. Filter by DIGITAL type
4. Verify only digital expenses shown

**Expected:**
- ✅ Only DIGITAL type expenses in results
- ✅ CASH expenses filtered out

#### Test 2.2: Filter by Status
**Steps:**
1. Go to http://localhost:5173/search
2. Search for "Rahul" (transaction)
3. Filter by PENDING status
4. Verify only pending transactions shown

**Expected:**
- ✅ Only PENDING status transactions shown
- ✅ Completed transactions filtered out

#### Test 2.3: Date Range Filter
**Steps:**
1. Go to http://localhost:5173/search
2. Search for "money" 
3. Set date_from: 2026-04-20, date_to: 2026-04-30
4. Verify only transactions in date range shown

**Expected:**
- ✅ Only transactions within date range shown
- ✅ Transactions outside range excluded

### 3. Search - Special Cases

#### Test 3.1: Recent Searches
**Steps:**
1. Go to http://localhost:5173/search
2. Search for "Netflix"
3. Clear search box
4. Verify "Netflix" appears in recent searches
5. Click on recent search chip
6. Verify search re-runs

**Expected:**
- ✅ Recent searches appear as chips
- ✅ Clicking chip re-searches with that term

#### Test 3.2: Empty Results
**Steps:**
1. Go to http://localhost:5173/search
2. Search for "xyz12345xyz"
3. Verify "No results found" message

**Expected:**
- ✅ Appropriate empty state message shown
- ✅ No error or crash

#### Test 3.3: Loading State
**Steps:**
1. Go to http://localhost:5173/search
2. Type search query
3. Observe loading spinner briefly
4. Verify results appear

**Expected:**
- ✅ Loading spinner shows during search
- ✅ Results load and display correctly

### 4. Calendar - Month View

#### Test 4.1: Current Month Display
**Steps:**
1. Go to http://localhost:5173/calendar
2. Observe current month calendar
3. Verify correct days displayed
4. Verify today's date highlighted (blue background)

**Expected:**
- ✅ Correct month/year displayed at top
- ✅ Calendar grid shows correct days
- ✅ Today highlighted in blue
- ✅ Weekday headers correct (Sun-Sat)

#### Test 4.2: Month Navigation
**Steps:**
1. Go to http://localhost:5173/calendar
2. Click "Previous" button
3. Verify previous month displayed
4. Click "Next" button twice
5. Verify forward to next month

**Expected:**
- ✅ Calendar updates when navigating
- ✅ Month/year header updates
- ✅ Events change per month

#### Test 4.3: Events Display
**Steps:**
1. Go to http://localhost:5173/calendar
2. Navigate to April 2026
3. On day 30, verify "Rahul" event appears
4. On day 26, verify "Priya" event appears
5. Color coding: Rahul (red for BORROWED), Priya (green for LENT)

**Expected:**
- ✅ Events appear on correct dates
- ✅ Person's first name shown on calendar
- ✅ Red/green color coding correct
- ✅ Amount visible on hover

#### Test 4.4: Overdue Events
**Steps:**
1. Go to http://localhost:5173/calendar
2. Navigate to current month
3. On April 20 (2026-04-20), Amit's transaction should show
4. Verify it shows overdue status (red background)
5. Check bottom "⚠️ Overdue Items" section

**Expected:**
- ✅ Overdue events highlighted in red
- ✅ Overdue section at bottom shows item
- ✅ "X days overdue" information shown

### 5. Calendar - Sidebar Alerts

#### Test 5.1: Overdue Alert Sidebar
**Steps:**
1. Go to http://localhost:5173/calendar
2. Observe right sidebar
3. Verify overdue transactions listed
4. Verify max 5 shown, with "+X more" if needed

**Expected:**
- ✅ All overdue items visible in sidebar
- ✅ Shows person name, amount, days overdue
- ✅ Clickable to navigate to transaction

#### Test 5.2: Empty Overdue
**Steps:**
1. Create new user account
2. No overdue transactions
3. Go to /calendar
4. Verify "✅ No overdue items" message

**Expected:**
- ✅ Appropriate empty state shown
- ✅ No errors

### 6. Calendar - Interaction

#### Test 6.1: Click Event to View Details
**Steps:**
1. Go to http://localhost:5173/calendar
2. Click on an event (e.g., Rahul on day 30)
3. Observe navigation to transaction detail page

**Expected:**
- ✅ Clicking event navigates to transaction
- ✅ Transaction details visible
- ✅ Can edit or mark as complete from detail page

#### Test 6.2: Multiple Events Per Day
**Steps:**
1. Create 3-4 transactions for same date
2. Go to calendar
3. Navigate to that date's month
4. Verify "+X more" indicator if >2 events

**Expected:**
- ✅ First 2 events shown as pills
- ✅ "+X more" link if >2 events
- ✅ Clicking "+X more" should show all events for that day

### 7. Integration Tests

#### Test 7.1: Create Expense → Search → Find It
**Steps:**
1. Go to dashboard
2. Create new cash expense for "Office supplies"
3. Go to search page
4. Search for "Office"
5. Verify newly created expense appears

**Expected:**
- ✅ Newly created expense searchable
- ✅ Correct details shown in results
- ✅ Search result count updated

#### Test 7.2: Create Transaction → Calendar → View
**Steps:**
1. Go to dashboard
2. Create transaction: borrowed ₹500 from "David" due 2026-05-10
3. Go to calendar
4. Navigate to May 2026
5. Verify event appears on day 10

**Expected:**
- ✅ Transaction appears on calendar on correct date
- ✅ Event clickable to view transaction
- ✅ Can mark complete from detail view

#### Test 7.3: Navigation Consistency
**Steps:**
1. Go to dashboard
2. Click "Search" in navbar
3. Verify on search page
4. Click "Calendar" in navbar
5. Verify on calendar page
6. Click "Dashboard" in navbar
7. Verify back on dashboard

**Expected:**
- ✅ Navigation consistent across all pages
- ✅ Active nav link highlighted
- ✅ No errors when switching pages

### 8. Error Handling

#### Test 8.1: Logout and Access Search
**Steps:**
1. Go to /search while logged in
2. Click Logout
3. Verify redirected to login
4. Try to access /search directly
5. Verify redirected to login

**Expected:**
- ✅ Protected routes enforce authentication
- ✅ Logged out user cannot access

#### Test 8.2: Invalid Token
**Steps:**
1. Login successfully
2. Open DevTools → Application → Cookies
3. Modify access_token to invalid value
4. Go to /search
5. Verify error handling

**Expected:**
- ✅ Invalid token detected
- ✅ Redirected to login
- ✅ No crashes or console errors

### 9. API Testing (with Postman/cURL)

#### Test 9.1: Search Expenses API
```bash
curl -X GET "http://localhost:8000/api/v1/search/expenses?q=grocery&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "expenses": [...],
    "total": 1,
    "limit": 10,
    "offset": 0,
    "query": "grocery"
  }
}
```

#### Test 9.2: Global Search API
```bash
curl -X GET "http://localhost:8000/api/v1/search/global?q=money" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Contains expenses, transactions, and categories arrays
- Query field matches search term
- All results match search query

#### Test 9.3: Calendar Month API
```bash
curl -X GET "http://localhost:8000/api/v1/calendar/month?year=2026&month=4" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
- Events indexed by day number
- Overdue array with overdue items
- Year and month fields match request
- month_name field populated

## Common Issues & Solutions

### Issue: Search returns no results
**Solution:**
- Verify test data is created
- Check search query is not empty
- Ensure proper date range if filtering
- Check browser DevTools for API errors

### Issue: Calendar events not showing
**Solution:**
- Create transactions with PENDING status
- Verify expected_return_date is set
- Navigate to correct month for transaction dates
- Check backend logs for errors

### Issue: Navigation links not working
**Solution:**
- Verify App.tsx has all routes imported
- Check route paths match link paths
- Verify ProtectedRoute component working
- Clear browser cache and reload

### Issue: CORS errors
**Solution:**
- Check backend CORS settings
- Verify frontend URL in ALLOWED_ORIGINS
- Restart backend server

### Issue: 401 Unauthorized errors
**Solution:**
- Verify token is valid
- Check Authorization header format
- Re-login and get new token
- Clear localStorage and try again

## Performance Considerations

1. **Search Optimization**
   - First search may be slow for large datasets
   - Pagination helps with large result sets
   - Database indexes on search fields improve performance

2. **Calendar Optimization**
   - Switching months may have slight delay for first load
   - Loading state provides feedback
   - Subsequent month navigation is faster (cached)

## Next Phase

Once Phase 6 testing is complete:
1. Run full integration tests
2. Performance load testing
3. Prepare for production deployment
4. Document any issues for future phases

## Test Completion Checklist

- [ ] Basic search working (expenses, transactions, categories)
- [ ] Search filters working (type, status, date range)
- [ ] Recent searches appearing and clickable
- [ ] Calendar showing current month with today highlighted
- [ ] Calendar navigation working (prev/next)
- [ ] Events displaying on calendar with correct colors
- [ ] Overdue events highlighted and shown in sidebar
- [ ] Click event to view transaction working
- [ ] Navigation between pages consistent
- [ ] Protected routes enforcing authentication
- [ ] API endpoints responding with correct data
- [ ] No console errors or warnings
- [ ] Error handling for empty states
- [ ] Loading states visible during data fetch

**Status: Ready for Testing** ✅
