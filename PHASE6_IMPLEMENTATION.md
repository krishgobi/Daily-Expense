# Phase 6: Search & Calendar - Implementation Complete

## Overview
Phase 6 adds comprehensive search functionality and calendar event management to the Tracksy.AI. Users can search across all entities (expenses, transactions, categories) and visualize financial obligations in a calendar view.

## Backend Implementation

### Search Service (`backend/app/services/search_service.py`)
- **search_expenses()**: Full-text search on expenses with filters (type, category, date range)
  - Searches: purpose, description, location fields
  - Supports pagination with limit/offset
  
- **search_transactions()**: Full-text search on transactions
  - Searches: person_name, purpose fields
  - Supports filtering by type (BORROWED/LENT), status (PENDING/COMPLETED)
  
- **global_search()**: Unified search across all entities
  - Returns matching expenses, transactions, and categories
  - Default limit: 10 results per entity type
  
- **get_recent_searches()**: Retrieves recent search terms
  - Based on distinct purposes and person names

### Calendar Service (`backend/app/services/calendar_service.py`)
- **get_month_events()**: Returns all PENDING transactions for a month
  - Day-indexed events with overdue detection
  - Calculates days overdue for past due dates
  
- **get_upcoming_events()**: Transactions in next N days
  - Includes is_today and is_tomorrow flags
  - Default: 30 days ahead
  
- **get_overdue_events()**: All PENDING transactions with past due dates
  - Sorted by date (oldest first)
  - Includes days overdue calculation
  
- **get_calendar_summary()**: Aggregated calendar data
  - This week count/total
  - This month count/total
  - Overdue count/total

### API Endpoints

#### Search Routes (`backend/app/api/v1/search.py`)
```
GET /api/v1/search/expenses?q=query&expense_type=CASH&category_id=...&date_from=...&date_to=...&limit=20&offset=0
GET /api/v1/search/transactions?q=query&transaction_type=BORROWED&status=PENDING&date_from=...&date_to=...&limit=20&offset=0
GET /api/v1/search/global?q=query&limit=10
GET /api/v1/search/recent?limit=5
```

#### Calendar Routes (`backend/app/api/v1/calendar.py`)
```
GET /api/v1/calendar/month?year=2026&month=4
GET /api/v1/calendar/upcoming?days_ahead=30
GET /api/v1/calendar/overdue
GET /api/v1/calendar/summary
```

## Frontend Implementation

### Services

#### Search Service (`frontend/src/services/searchService.ts`)
- Typed interfaces: SearchExpense, SearchTransaction, SearchCategory, RecentSearch
- Methods for searching expenses, transactions, global search, recent searches
- Proper parameter passing to backend API

#### Calendar Service (`frontend/src/services/calendarService.ts`)
- Typed interfaces for calendar data structures
- Methods for month events, upcoming events, overdue events, summary
- Proper date/time handling

### Custom Hooks

#### Search Hooks (`frontend/src/hooks/useSearch.ts`)
- `useSearchExpenses()`: Query hook for expense search
- `useSearchTransactions()`: Query hook for transaction search
- `useGlobalSearch()`: Query hook for global search
- `useRecentSearches()`: Query hook for recent searches
- All hooks respect query enable conditions (only fetch when query exists)

#### Calendar Hooks (`frontend/src/hooks/useCalendar.ts`)
- `useMonthEvents()`: Fetches events for specific month
- `useUpcomingEvents()`: Fetches upcoming transactions
- `useOverdueEvents()`: Fetches overdue transactions
- `useCalendarSummary()`: Fetches aggregated calendar data

### Pages

#### Search Page (`frontend/src/pages/SearchPage.tsx`)
Features:
- Search input with debouncing support
- Tabbed interface (All, Expenses, Transactions, Categories)
- Recent searches display
- Results count in tabs
- Result cards with action buttons
- Empty state handling
- Loading state with spinner
- Responsive design
- Integration with navigation

Display formats:
- Expenses: Purpose, description, amount, type, date, location
- Transactions: Person name, amount, type, status, date
- Categories: Simple list view

#### Calendar Page (`frontend/src/pages/CalendarPage.tsx`)
Features:
- Full month calendar grid
- Navigation (previous/next month)
- Day-of-week headers
- Event indicators on calendar days
- Overdue highlighting (red background)
- Event type color coding:
  - Red for BORROWED
  - Green for LENT
  - Red for overdue items
- Sidebar with overdue alerts (max 5 displayed)
- Today highlighting (blue background)
- Click events to navigate to transaction details
- Responsive layout (2/3 + 1/3 split)

Display:
- Calendar shows PENDING transactions only
- Overdue section at bottom of calendar
- Sidebar shows all overdue items with days overdue

### Navigation Integration
Updated all main pages to include Search and Calendar links:
- DashboardPage
- AnalyticsPage
- ReportsPage
- SearchPage
- CalendarPage

### Routing (`frontend/src/App.tsx`)
- `/search` - Protected route to SearchPage
- `/calendar` - Protected route to CalendarPage
- Both routes wrapped with ProtectedRoute

## Data Flow

### Search Flow
1. User enters search query in SearchPage
2. Query typed into search input
3. useGlobalSearch hook triggered (if query not empty)
4. Frontend calls searchService.globalSearch()
5. API calls /api/v1/search/global endpoint
6. Backend SearchService.global_search() executes
7. Results fetched from database with ILIKE pattern matching
8. Results displayed in tabbed interface
9. User can click on results to navigate to detail views

### Calendar Flow
1. CalendarPage loads with current month
2. useMonthEvents hook fetches data for current month
3. API calls /api/v1/calendar/month endpoint
4. Backend CalendarService.get_month_events() returns month's events
5. Events displayed on calendar grid
6. useOverdueEvents hook fetches all overdue items
7. Overdue items displayed in sidebar
8. User can click event to navigate to transaction detail

## Testing Scenarios

### Search Testing
1. **Basic Search**
   - Search for "groceries" → Should find all expense with "groceries" in purpose
   - Search for "Rahul" → Should find transactions with Rahul as person_name

2. **Filtered Search**
   - Search "food" with type=CASH → Only cash expenses with "food"
   - Search "Priya" with status=PENDING → Only pending transactions with Priya

3. **Global Search**
   - Search for general term → Results across all three entities
   - Verify each entity section populated with relevant results

4. **Recent Searches**
   - Perform multiple searches
   - Navigate to search page
   - Recent searches should appear as clickable chips

5. **Pagination**
   - Create 50+ expenses
   - Search query with limit=20
   - Verify pagination working (offset parameter)

### Calendar Testing
1. **Month Navigation**
   - Click previous/next buttons
   - Verify correct month/year displayed
   - Verify events change per month

2. **Event Display**
   - Create PENDING transactions with various dates
   - Verify events appear on correct days
   - Verify event colors (red/green based on type)

3. **Overdue Highlighting**
   - Create transaction with past due date
   - Navigate to that month
   - Verify red background on overdue events
   - Verify overdue section shows at bottom

4. **Sidebar Overdue**
   - Create multiple overdue items
   - Verify all shown in sidebar (max 5)
   - Verify "+X more overdue" message if > 5

5. **Today Highlighting**
   - View current month calendar
   - Today's date should have blue background

6. **Event Interaction**
   - Click on calendar event
   - Should navigate to transaction details
   - Should be able to edit/mark complete

## API Response Examples

### Search Expenses Response
```json
{
  "status": "success",
  "data": {
    "expenses": [
      {
        "id": "uuid",
        "purpose": "Grocery shopping",
        "description": "Weekly groceries",
        "amount": 2500,
        "type": "CASH",
        "date": "2026-04-29",
        "category_id": "uuid",
        "location": "Big Bazaar"
      }
    ],
    "total": 15,
    "limit": 20,
    "offset": 0,
    "query": "grocery"
  }
}
```

### Calendar Month Response
```json
{
  "status": "success",
  "data": {
    "events": {
      "15": [
        {
          "id": "uuid",
          "person": "Rahul",
          "amount": 5000,
          "type": "BORROWED",
          "purpose": "Movie tickets",
          "date": "2026-04-15",
          "is_overdue": false,
          "overdue_days": 0
        }
      ],
      "20": [...]
    },
    "overdue": [
      {
        "person": "Priya",
        "amount": 1000,
        "type": "LENT",
        "overdue_days": 3
      }
    ],
    "year": 2026,
    "month": 4,
    "month_name": "April"
  }
}
```

## Files Modified/Created

### Backend
- Created: `backend/app/api/v1/search.py` (4 endpoints)
- Created: `backend/app/api/v1/calendar.py` (4 endpoints)
- Modified: `backend/app/api/v1/__init__.py` (added routes)
- Existing: `backend/app/services/search_service.py` (from context)
- Existing: `backend/app/services/calendar_service.py` (from context)

### Frontend
- Created: `frontend/src/services/searchService.ts`
- Created: `frontend/src/services/calendarService.ts`
- Created: `frontend/src/hooks/useSearch.ts`
- Created: `frontend/src/hooks/useCalendar.ts`
- Created: `frontend/src/pages/SearchPage.tsx`
- Created: `frontend/src/pages/CalendarPage.tsx`
- Modified: `frontend/src/App.tsx` (added routes and imports)
- Modified: `frontend/src/pages/DashboardPage.tsx` (navigation)
- Modified: `frontend/src/pages/AnalyticsPage.tsx` (navigation)
- Modified: `frontend/src/pages/ReportsPage.tsx` (navigation)

## Next Steps / Future Enhancements

1. **Search Enhancements**
   - Add date range picker with calendar UI
   - Add category multi-select filter
   - Save frequent searches as favorites
   - Search history with timestamps
   - Advanced filters sidebar

2. **Calendar Enhancements**
   - Week/day view options
   - Drag & drop to reschedule transactions
   - Event details modal
   - Color customization per transaction type
   - Integration with system calendar apps

3. **Performance**
   - Add search result caching
   - Implement debouncing on search input
   - Lazy load calendar months
   - Index frequently searched fields

4. **Export**
   - Export search results to CSV
   - Export calendar to ICS format
   - Print calendar view

## Dependencies
- Frontend: React Query (useQuery), React Router (useNavigate)
- Backend: SQLAlchemy, FastAPI, Pydantic
- No new external dependencies added

## Status
✅ **COMPLETE** - Phase 6 fully implemented with all search and calendar features operational.
