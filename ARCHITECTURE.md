# Tracksy.AI - System Architecture

**Version:** 1.0  
**Date:** 2026-04-29  
**Status:** Design Review - Awaiting Approval

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Technology Stack Rationale](#technology-stack-rationale)
4. [System Architecture Diagram](#system-architecture-diagram)
5. [Database Schema Design](#database-schema-design)
6. [API Design & Contracts](#api-design--contracts)
7. [Folder Structure](#folder-structure)
8. [Feature Breakdown](#feature-breakdown)
9. [Development Roadmap](#development-roadmap)
10. [Best Practices](#best-practices)
11. [Scalability & Performance](#scalability--performance)

---

## System Overview

### Problem Statement
Personal expense tracking with complex requirements: daily expenses (cash/digital), borrowed/lent money tracking, overdue detection, multi-format reporting, and calendar-based insights.

### Solution Approach
A full-stack web application with:
- **Real-time** expense tracking dashboard
- **Automatic** overdue detection & alerts
- **Modular** architecture for scalability
- **Document storage** for proof/receipts
- **Intelligent search** and reporting

### Key Characteristics
- **User-centric**: One user, simplified auth (email/password)
- **Audit-friendly**: Complete transaction history
- **Report-heavy**: Multiple export formats
- **Reminder-based**: Calendar integration with overdue alerts

---

## Architecture Decisions

### 1. **Monolithic Backend vs. Microservices**
**Decision: Monolithic FastAPI Backend**

**Why:**
- Single user → no multi-tenancy complexity
- Moderate data volume → no sharding needed
- Simpler deployment, debugging, and maintenance
- Can scale horizontally with load balancers if needed

**Trade-off:**
- Start with monolith, extract services later if needed

### 2. **Database Approach**
**Decision: Supabase PostgreSQL (RLS-ready)**

**Why:**
- Built-in Row-Level Security (future: if multi-user)
- Real-time subscriptions via WebSockets
- PostgreSQL power + managed service reliability
- File storage integrated (Supabase Storage)

### 3. **Authentication Strategy**
**Decision: JWT + Supabase Auth**

**Why:**
- Stateless (scales horizontally)
- Works with RLS policies
- Built-in session management
- No separate auth service needed

### 4. **State Management (Frontend)**
**Decision: React Context API + Custom Hooks**

**Why:**
- App is single-user, non-complex state
- No need for Redux overhead
- Better for small-to-medium apps
- Easy to transition to Zustand later if needed

### 5. **Report Generation**
**Decision: Backend-generated PDFs (via FastAPI)**

**Why:**
- Server-side rendering for consistency
- Sensitive financial data stays on server
- Can generate large reports efficiently
- Libraries: `reportlab` (PDF), `openpyxl` (Excel), `python-docx` (Word)

### 6. **File Storage**
**Decision: Supabase Storage (S3-compatible)**

**Why:**
- No separate cloud storage service
- Integrated with authentication
- Cost-effective for personal use
- Easy to manage access via RLS

### 7. **Search Strategy**
**Decision: PostgreSQL Full-Text Search (not Elasticsearch)**

**Why:**
- Overkill would be Elasticsearch for single user
- PostgreSQL FTS sufficient for this scale
- Can add Elasticsearch later if needed

---

## Technology Stack Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript | Type safety, ecosystem, performance |
| **Frontend State** | Context API + Custom Hooks | Simplicity for single-user app |
| **Frontend HTTP** | Axios + React Query | Better cache management than fetch |
| **Frontend UI** | Shadcn/ui + TailwindCSS | Pre-built accessible components + styling |
| **Frontend Forms** | React Hook Form + Zod | Minimal re-renders + schema validation |
| **Frontend Date** | date-fns | Lightweight date utilities |
| **Backend Framework** | FastAPI | Async, auto-documentation (OpenAPI), modern |
| **Backend ORM** | SQLAlchemy + Alembic | Migrations, type hints, production-ready |
| **Backend Validation** | Pydantic | Type checking at runtime |
| **Backend Auth** | JWT + Supabase | Stateless, scalable |
| **Backend PDF** | reportlab | Programmatic PDF generation |
| **Backend Excel** | openpyxl | Excel workbook creation |
| **Backend Word** | python-docx | Word document creation |
| **Database** | PostgreSQL (Supabase) | ACID compliance, JSON support, FTS |
| **Storage** | Supabase Storage | S3-compatible, built-in auth |
| **Hosting** | Vercel (Frontend) + Railway/Fly.io (Backend) | Scalable, auto-deploys |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
├─────────────────────────────────────────────────────────────────┤
│  Browser → React App (TypeScript)                               │
│  ├─ Dashboard (Home, Summary, Analytics)                        │
│  ├─ Expense Module (Cash, Digital)                              │
│  ├─ Borrowed/Lent Tracking                                      │
│  ├─ Calendar & Reminders                                        │
│  ├─ Search & Filters                                            │
│  ├─ Reports View                                                │
│  └─ Settings & Profile                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WebSockets
                         │ (Axios + React Query)
┌────────────────────────┴────────────────────────────────────────┐
│                    API GATEWAY TIER                             │
├─────────────────────────────────────────────────────────────────┤
│  FastAPI Server (Async)                                         │
│  ├─ Request Validation (Pydantic)                               │
│  ├─ JWT Authentication Middleware                               │
│  ├─ CORS & Security Headers                                     │
│  ├─ Rate Limiting                                               │
│  ├─ Request/Response Logging                                    │
│  └─ Error Handling                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐   ┌──────────┐   ┌──────────────┐
    │ Service │   │Repository│   │Report Engine │
    │ Layer   │   │Layer     │   │              │
    │         │   │          │   │ • PDF Gen    │
    │ Business│   │Database  │   │ • Excel Gen  │
    │ Logic   │   │Queries   │   │ • Word Gen   │
    └─────────┘   └──────────┘   └──────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                   DATA PERSISTENCE TIER                         │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Supabase)                                          │
│  ├─ Users                                                       │
│  ├─ Expenses (Cash & Digital)                                  │
│  ├─ Transactions (Borrowed/Lent)                               │
│  ├─ Categories                                                  │
│  ├─ Reports (Generated metadata)                               │
│  └─ Audit Log                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                    FILE STORAGE TIER                            │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Storage (S3-compatible)                               │
│  ├─ Digital payment screenshots/PDFs                            │
│  ├─ Borrowed/Lent proof documents                               │
│  └─ Generated reports (temporary)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### Core Entities

#### 1. **users** (Authentication & Profile)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    currency_code VARCHAR(3) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

#### 2. **expense_categories** (For expense type classification)
```sql
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);
```

#### 3. **expenses** (Cash & Digital Combined)
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id),
    type VARCHAR(20) NOT NULL, -- 'CASH' | 'DIGITAL'
    purpose VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(255),
    
    -- Digital only
    payment_method VARCHAR(50), -- GPay, PhonePe, UPI, Bank, etc.
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_date (user_id, date),
    INDEX idx_user_type (user_id, type)
);
```

#### 4. **expense_media** (Proof documents for expenses)
```sql
CREATE TABLE expense_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase Storage path
    file_type VARCHAR(20), -- 'PDF' | 'IMAGE' | 'SCREENSHOT'
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. **transactions** (Borrowed & Lent Money)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'BORROWED' | 'LENT'
    person_name VARCHAR(255) NOT NULL,
    purpose VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL,
    given_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING' | 'COMPLETED'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Derived: overdue days calculated in app layer
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_date (user_id, expected_return_date)
);
```

#### 6. **transaction_media** (Proof for borrowed/lent)
```sql
CREATE TABLE transaction_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. **reports** (Generated reports metadata)
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_expenses NUMERIC(12,2),
    total_borrowed NUMERIC(12,2),
    total_lent NUMERIC(12,2),
    file_path VARCHAR(500), -- Supabase path if stored
    generated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_date (user_id, generated_at)
);
```

#### 8. **audit_logs** (For compliance & debugging)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_created (user_id, created_at)
);
```

### Indexing Strategy

```sql
-- Performance critical indexes
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_transactions_expected_return ON transactions(user_id, expected_return_date);

-- Full-text search
CREATE INDEX idx_expenses_purpose_fts ON expenses USING GIN(to_tsvector('english', purpose));
CREATE INDEX idx_transactions_person_fts ON transactions USING GIN(to_tsvector('english', person_name));

-- Foreign key lookups
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expense_media_expense ON expense_media(expense_id);
CREATE INDEX idx_transaction_media_transaction ON transaction_media(transaction_id);
```

### Computed/Derived Data Strategy

**Why NOT store computed fields:**
- Dashboard sums (total today, total week, etc.) → Calculate in query time
- Overdue days → Calculate in application layer (for timezone-awareness)
- Analytics trends → Query-time aggregation with GROUP BY

**Why:**
- Avoids sync issues
- Single source of truth
- Easier to maintain and update

---

## API Design & Contracts

### Base URL
```
https://api.expensemanager.local/api/v1
```

### Authentication
- **Type:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Refresh:** Token expires in 24 hours, refresh endpoint available

---

### API Endpoints Structure

#### **1. Authentication Endpoints**
```
POST   /auth/register          → Register new user
POST   /auth/login             → Login (returns JWT + refresh token)
POST   /auth/refresh           → Refresh JWT token
POST   /auth/logout            → Invalidate token
GET    /auth/me                → Current user profile
PUT    /auth/profile           → Update user profile
```

#### **2. Expense Endpoints**
```
POST   /expenses               → Create expense (cash or digital)
GET    /expenses               → List expenses (with filters)
  Query params: 
  - type: CASH | DIGITAL
  - category_id: UUID
  - date_from: YYYY-MM-DD
  - date_to: YYYY-MM-DD
  - limit: 20, offset: 0

GET    /expenses/{id}          → Get single expense details
PUT    /expenses/{id}          → Update expense
DELETE /expenses/{id}          → Delete expense
POST   /expenses/{id}/media    → Upload media/proof for expense
DELETE /expenses/{id}/media/{media_id} → Delete media

GET    /expenses/summary/today → Today's total
GET    /expenses/summary/week  → Week's total
GET    /expenses/summary/month → Month's total
GET    /expenses/summary/year  → Year's total
```

#### **3. Categories Endpoints**
```
GET    /categories             → List all categories
POST   /categories             → Create custom category
PUT    /categories/{id}        → Update category
DELETE /categories/{id}        → Delete category
```

#### **4. Transactions (Borrowed/Lent) Endpoints**
```
POST   /transactions           → Create transaction
  Body: {
    transaction_type: "BORROWED" | "LENT",
    person_name: string,
    amount: number,
    given_date: YYYY-MM-DD,
    expected_return_date: YYYY-MM-DD,
    purpose?: string,
    status: "PENDING"
  }

GET    /transactions           → List transactions
  Query params:
  - type: BORROWED | LENT
  - status: PENDING | COMPLETED
  - person_name: string (search)
  - date_from, date_to
  - limit, offset

GET    /transactions/{id}      → Get transaction details
PUT    /transactions/{id}      → Update transaction
PUT    /transactions/{id}/complete → Mark as completed
DELETE /transactions/{id}      → Delete transaction
POST   /transactions/{id}/media → Upload media/proof
DELETE /transactions/{id}/media/{media_id} → Delete media

GET    /transactions/summary/pending-repayment   → Money I need to pay
GET    /transactions/summary/pending-collection  → Money I need to receive
GET    /transactions/summary/overdue             → Overdue transactions
```

#### **5. Search Endpoints**
```
GET    /search/expenses        → Search expenses by purpose/location
  Query: q=string, type=CASH|DIGITAL, date_from, date_to

GET    /search/transactions    → Search by person/purpose
  Query: q=string, type=BORROWED|LENT, date_from, date_to
```

#### **6. Dashboard/Analytics Endpoints**
```
GET    /analytics/dashboard    → Complete dashboard data
  Returns: {
    today: {total, count},
    week: {total, trend},
    month: {total, trend},
    year: {total},
    pending_repayments: [...],
    pending_collections: [...],
    overdue: [...]
  }

GET    /analytics/weekly       → Weekly breakdown
GET    /analytics/monthly      → Monthly breakdown
GET    /analytics/yearly       → Yearly breakdown
GET    /analytics/category     → Category-wise breakdown
GET    /analytics/digital-vs-cash → Comparison chart data
```

#### **7. Reports Endpoints**
```
POST   /reports/generate       → Generate report
  Body: {
    report_type: "MONTHLY" | "QUARTERLY" | "YEARLY",
    period_start: YYYY-MM-DD,
    period_end: YYYY-MM-DD,
    format: "PDF" | "EXCEL" | "WORD"
  }
  Returns: { report_id: UUID, status: "GENERATING" }

GET    /reports/{id}/status    → Check generation status
GET    /reports/{id}/download  → Download generated report
GET    /reports                → List all generated reports

POST   /reports/{id}/email     → Email report to address
```

#### **8. Calendar/Reminders Endpoints**
```
GET    /calendar/events        → Get calendar events
  Returns: {
    repayment_due: [{date, amount, person, ...}],
    collection_due: [{date, amount, person, ...}]
  }

GET    /calendar/overdue       → Get overdue items
POST   /reminders              → Create reminder (optional)
```

---

### Error Response Format

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "field": ["error message"]
  },
  "timestamp": "2026-04-29T10:30:00Z"
}
```

**Common Codes:**
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)

---

## Folder Structure

### Frontend Structure
```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── Dashboard/
│   │   │   ├── ExpensesSummary.tsx
│   │   │   ├── AnalyticsSection.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   ├── BorrowedSummary.tsx
│   │   │   ├── LentSummary.tsx
│   │   │   └── CalendarView.tsx
│   │   ├── Expenses/
│   │   │   ├── ExpenseForm.tsx
│   │   │   ├── CashExpenseForm.tsx
│   │   │   ├── DigitalExpenseForm.tsx
│   │   │   ├── ExpenseList.tsx
│   │   │   ├── ExpenseCard.tsx
│   │   │   └── MediaUpload.tsx
│   │   ├── Transactions/
│   │   │   ├── BorrowedForm.tsx
│   │   │   ├── LentForm.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionCard.tsx
│   │   │   └── TransactionTimeline.tsx
│   │   ├── Reports/
│   │   │   ├── ReportsList.tsx
│   │   │   ├── ReportGenerator.tsx
│   │   │   └── ReportViewer.tsx
│   │   ├── Calendar/
│   │   │   ├── CalendarGrid.tsx
│   │   │   ├── EventPopover.tsx
│   │   │   └── OverdueAlert.tsx
│   │   ├── Search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchResults.tsx
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Footer.tsx
│   │       └── MainLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── 404Page.tsx
│   ├── hooks/
│   │   ├── useExpenses.ts
│   │   ├── useTransactions.ts
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   ├── useReports.ts
│   │   └── useForm.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── UserPreferencesContext.tsx
│   ├── services/
│   │   ├── api.ts (Axios instance)
│   │   ├── authService.ts
│   │   ├── expenseService.ts
│   │   ├── transactionService.ts
│   │   ├── reportService.ts
│   │   ├── searchService.ts
│   │   └── storageService.ts
│   ├── types/
│   │   ├── expense.ts
│   │   ├── transaction.ts
│   │   ├── user.ts
│   │   ├── report.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── formatters.ts (number, date formats)
│   │   ├── validators.ts
│   │   ├── errorHandler.ts
│   │   ├── chartUtils.ts
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── animations.css
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx (or index.tsx)
├── .env.example
├── .env.local (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts (or create-react-app config)
└── README.md
```

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 (FastAPI app setup)
│   ├── config.py               (Configuration & settings)
│   ├── dependencies.py         (Dependency injection)
│   ├── middleware.py           (CORS, logging, etc.)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         (Auth routes)
│   │   │   ├── expenses.py     (Expense routes)
│   │   │   ├── categories.py   (Category routes)
│   │   │   ├── transactions.py (Borrowed/Lent routes)
│   │   │   ├── search.py       (Search routes)
│   │   │   ├── analytics.py    (Dashboard/Analytics)
│   │   │   ├── reports.py      (Reports routes)
│   │   │   ├── calendar.py     (Calendar routes)
│   │   │   └── router.py       (Main router combining all)
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── expense_service.py
│   │   ├── transaction_service.py
│   │   ├── report_service.py
│   │   ├── search_service.py
│   │   ├── analytics_service.py
│   │   ├── file_service.py
│   │   └── notification_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base_repository.py  (Abstract base class)
│   │   ├── expense_repository.py
│   │   ├── transaction_repository.py
│   │   ├── category_repository.py
│   │   ├── report_repository.py
│   │   ├── user_repository.py
│   │   └── audit_repository.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── expense.py
│   │   ├── transaction.py
│   │   ├── category.py
│   │   ├── report.py
│   │   ├── response.py
│   │   └── error.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── expense.py
│   │   ├── transaction.py
│   │   ├── category.py
│   │   ├── media.py
│   │   ├── report.py
│   │   └── audit_log.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── jwt.py             (JWT token handling)
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   ├── date_utils.py
│   │   ├── file_utils.py
│   │   ├── error_handler.py
│   │   └── logger.py
│   │
│   ├── reports/
│   │   ├── __init__.py
│   │   ├── pdf_generator.py
│   │   ├── excel_generator.py
│   │   ├── word_generator.py
│   │   └── report_builder.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py       (Supabase connection)
│   │   ├── session.py
│   │   └── migrations/         (Alembic migrations)
│   │       ├── env.py
│   │       ├── script.py.mako
│   │       └── versions/
│   │           ├── 001_init.py
│   │           ├── 002_add_indexes.py
│   │           └── ...
│   │
│   ├── constants/
│   │   ├── __init__.py
│   │   ├── expense_types.py
│   │   ├── transaction_types.py
│   │   ├── payment_methods.py
│   │   └── status_codes.py
│   │
│   └── exceptions/
│       ├── __init__.py
│       ├── base.py
│       ├── auth_exceptions.py
│       ├── validation_exceptions.py
│       └── business_exceptions.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             (Pytest fixtures)
│   ├── unit/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   └── fixtures/
│       ├── expense_fixtures.py
│       └── transaction_fixtures.py
│
├── .env.example
├── .env (gitignored)
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Feature Breakdown

### Module 1: Authentication & User Management
**Priority:** P0 (Critical)  
**Effort:** 3 days

- User registration (email/password)
- User login (JWT token)
- Token refresh mechanism
- Profile management (name, currency, timezone)
- Password reset (optional for MVP)
- Logout with token invalidation

**Deliverables:**
- Auth API endpoints
- JWT utilities
- Supabase auth integration
- Protected routes (frontend)

---

### Module 2: Expense Management
**Priority:** P0 (Critical)  
**Effort:** 5 days

**Sub-modules:**
- **2a. Cash Expenses** - Simple local transaction tracking
- **2b. Digital Expenses** - Payment method + media upload
- **2c. Categories** - User-defined or preset categories
- **2d. Media Management** - Upload/download receipts

**Deliverables:**
- CRUD endpoints for expenses
- Media upload to Supabase Storage
- Category management
- List with filtering (by type, date, category)
- Quick "Add Next Expense" flow

---

### Module 3: Borrowed/Lent Money Tracking
**Priority:** P0 (Critical)  
**Effort:** 4 days

- Create transactions (borrowed/lent)
- Track person name, amount, dates
- Status tracking (pending/completed)
- Overdue detection
- Media upload for proof
- Mark as completed
- Timeline view

**Deliverables:**
- Transaction CRUD endpoints
- Status update logic
- Overdue calculation (app layer)
- Media handling
- Pending/completed filtering

---

### Module 4: Dashboard & Analytics
**Priority:** P1 (High)  
**Effort:** 4 days

**Components:**
- Expense summary (today/week/month/year)
- Spending trends (increasing/decreasing)
- Category breakdown (pie/bar charts)
- Digital vs cash comparison
- Pending repayments summary
- Pending collections summary
- Quick action buttons
- Calendar view with color coding

**Deliverables:**
- Analytics aggregation queries
- Dashboard data endpoint
- Chart libraries setup (Recharts/Chart.js)
- Component implementation

---

### Module 5: Search & Filters
**Priority:** P1 (High)  
**Effort:** 3 days

- Search expenses by purpose/location
- Search transactions by person/date
- Date range filtering
- Type filtering (cash/digital, borrowed/lent)
- Full-text search (PostgreSQL FTS)

**Deliverables:**
- Search service
- FTS query builders
- Frontend search UI
- Results pagination

---

### Module 6: Reports & Export
**Priority:** P1 (High)  
**Effort:** 5 days

- Monthly/quarterly/yearly reports
- Export in PDF/Excel/Word
- Report includes:
  - Expense summary
  - Category breakdown
  - Digital vs cash usage
  - Borrowed/lent pending summary
  - Overdue alerts
- Report generation async job
- Email report capability (optional)

**Deliverables:**
- Report generation service
- PDF generator (reportlab)
- Excel generator (openpyxl)
- Word generator (python-docx)
- Report storage & retrieval
- Background task handling (Celery optional)

---

### Module 7: Calendar & Reminders
**Priority:** P2 (Medium)  
**Effort:** 2 days

- Calendar grid view
- Show repayment due dates (red)
- Show collection due dates (green)
- Overdue highlighting
- Calendar event popover
- Reminder system (optional)

**Deliverables:**
- Calendar component
- Event data endpoint
- Color coding logic
- Popover component

---

### Module 8: Settings & Profile
**Priority:** P2 (Medium)  
**Effort:** 2 days

- User profile settings
- Currency preference
- Timezone preference
- Theme (light/dark)
- Language preference (optional)
- Data export (optional)

**Deliverables:**
- Settings page
- Profile update endpoints
- Local preference storage

---

## Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (React + FastAPI)
- [ ] Database schema & migrations
- [ ] Authentication (register/login/JWT)
- [ ] Basic API scaffolding
- [ ] Frontend routing & layout

**Go/No-Go:** Test full auth flow end-to-end

---

### Phase 2: Core Expense Module (Week 3-4)
- [ ] Expense creation (cash & digital)
- [ ] Expense listing with filters
- [ ] Category management
- [ ] Media upload integration
- [ ] "Add Next Expense" flow

**Go/No-Go:** Can create, list, filter expenses

---

### Phase 3: Borrowed/Lent Tracking (Week 5)
- [ ] Transaction creation
- [ ] Status management
- [ ] Overdue detection
- [ ] Search by person/date
- [ ] Media handling

**Go/No-Go:** Can track borrowed/lent with status

---

### Phase 4: Dashboard & Analytics (Week 6)
- [ ] Dashboard aggregation queries
- [ ] Chart component setup
- [ ] Summary cards (today/week/month/year)
- [ ] Trends calculation
- [ ] Category breakdown

**Go/No-Go:** Dashboard displays accurate summaries

---

### Phase 5: Reports Generation (Week 7)
- [ ] Report generation backend
- [ ] PDF export
- [ ] Excel export
- [ ] Word export
- [ ] Report listing

**Go/No-Go:** Can generate & download reports

---

### Phase 6: Search & Calendar (Week 8)
- [ ] Full-text search implementation
- [ ] Advanced filtering
- [ ] Calendar grid & events
- [ ] Color coding & reminders

**Go/No-Go:** Search finds transactions accurately

---

### Phase 7: Polish & Testing (Week 9)
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Error handling & edge cases
- [ ] Accessibility audit
- [ ] Security audit

**Go/No-Go:** App passes test suite & security review

---

### Phase 8: Deployment (Week 10)
- [ ] Frontend deploy (Vercel)
- [ ] Backend deploy (Railway/Fly.io)
- [ ] Database backups & monitoring
- [ ] CDN setup
- [ ] Production checklist

---

## Best Practices

### 1. **Code Organization**
✅ **Service → Repository → Database** layering
- Services: Business logic
- Repositories: Data access abstraction
- Models: Database schema

✅ **Feature-based folder structure**
- Easier to find related code
- Scaling new modules

✅ **Type safety**
- TypeScript for frontend
- Python type hints + Pydantic for backend

---

### 2. **API Design**
✅ **RESTful conventions**
- GET, POST, PUT, DELETE (not custom verbs)
- Resource-based URLs
- Status codes (2xx, 4xx, 5xx)

✅ **Pagination for list endpoints**
- Default limit: 20, offset-based
- Always support sorting

✅ **Versioning** (`/api/v1/...`)
- Allows backward compatibility

✅ **Consistent response format**
```json
{
  "status": "success" | "error",
  "data": {...},
  "meta": {pagination info}
}
```

---

### 3. **Database**
✅ **Normalized schema**
- No data duplication
- Referential integrity

✅ **Indexes on query paths**
- user_id + date for date-range queries
- person_name for search

✅ **Soft deletes** (optional)
- Add `deleted_at` column
- Keep audit trail

✅ **Migrations with Alembic**
- Version control DB changes
- Reproducible deployments

---

### 4. **Frontend**
✅ **Component composition**
- Small, reusable components
- Props over global state

✅ **Custom hooks for logic**
- `useExpenses()`, `useDashboard()`
- React Query for data fetching

✅ **Form validation**
- Schema validation with Zod
- Client-side + server-side

✅ **Error boundaries**
- Graceful error handling
- User-friendly messages

---

### 5. **Security**
✅ **JWT token handling**
- Store in httpOnly cookie (not localStorage)
- Short expiration (1 hour) + refresh token (7 days)

✅ **Input validation**
- Pydantic on backend
- Zod on frontend

✅ **SQL injection prevention**
- SQLAlchemy ORM (parameterized queries)
- Never concatenate SQL strings

✅ **CORS configuration**
- Whitelist only frontend domain
- No `*` in production

✅ **Rate limiting**
- FastAPI Limiter middleware
- Prevent brute force attacks

✅ **File upload validation**
- Check file type (MIME)
- Max file size (10MB for receipts)
- Scan for malware (optional)

---

### 6. **Performance**
✅ **Database query optimization**
- Indexes on frequently queried columns
- Avoid N+1 queries (use joins)
- Pagination for large datasets

✅ **Frontend optimization**
- Code splitting (React.lazy)
- Image optimization
- Memoization (React.memo, useMemo)

✅ **Caching strategy**
- Browser cache (HTTP headers)
- React Query cache
- Redis (optional for dashboard)

✅ **API response compression**
- gzip middleware in FastAPI

---

### 7. **Testing**
✅ **Unit tests**
- Services: 80%+ coverage
- Repositories: 60%+ coverage

✅ **Integration tests**
- API endpoint tests
- Database transaction tests

✅ **Fixture-based testing**
- Pre-built test data

✅ **E2E tests** (future)
- Cypress or Playwright
- Critical user flows

---

### 8. **Logging & Monitoring**
✅ **Structured logging**
```python
logger.info("expense_created", extra={
    "user_id": user_id,
    "amount": amount,
    "category_id": category_id
})
```

✅ **Error tracking**
- Sentry integration (optional)
- Error rate alerts

✅ **Audit logs**
- Track all data changes
- For compliance

---

### 9. **Documentation**
✅ **API documentation**
- FastAPI auto-generates OpenAPI (Swagger)
- Document all query params, response codes

✅ **Code comments**
- Complex logic only
- Explain "why", not "what"

✅ **README**
- Setup instructions
- Configuration guide
- Deployment checklist

---

## Scalability & Performance Considerations

### Current Scale (MVP)
- **Users:** 1 (you)
- **Data:** Months of daily expenses
- **Queries:** Dashboard < 100ms
- **Storage:** Receipts < 1GB

### Architecture Decisions for Scale

#### 1. **Horizontal Scaling (Multi-user)**
When moving to multi-user:
- Supabase RLS policies (already designed)
- Partition expenses table by `(user_id, date)` (>100M rows)
- Cache user summaries in Redis

#### 2. **Report Generation**
Current: Synchronous (OK for <100 reports/month)
Future: Async with Celery + Redis

```python
# Future async task
@celery_app.task
def generate_report(user_id, report_type):
    # Long-running task
    pass
```

#### 3. **Full-Text Search**
Current: PostgreSQL FTS (sufficient)
Future: Elasticsearch if >1M transactions

#### 4. **File Storage**
Current: Supabase Storage (CDN-backed)
Future: Add Cloudflare Workers for optimization

#### 5. **Database Connection Pooling**
Use PgBouncer (Supabase built-in) to manage connections

#### 6. **Caching Layers**
```
Browser Cache (HTTP headers)
    ↓
React Query (client-side)
    ↓
Redis (optional backend)
    ↓
Database
```

#### 7. **Query Optimization**
- Materialized views for monthly/yearly summaries
- Pre-computed trending calculations
- Denormalize read-heavy fields if needed

#### 8. **Load Testing**
Tools: `k6` or Apache JMeter
- Dashboard should handle 100 concurrent users
- Report generation < 5 seconds for 1 year of data

---

## Security Audit Checklist

- [ ] JWT secret stored in env variable
- [ ] HTTPS enforced in production
- [ ] CORS whitelist configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (ORM only)
- [ ] CSRF tokens for state-changing operations
- [ ] File upload scanning
- [ ] Password hashing (bcrypt)
- [ ] Audit logs enabled
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated & scanned (Snyk)
- [ ] Secrets not in git history
- [ ] Database backups configured
- [ ] Monitoring & alerts configured

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Security audit complete
- [ ] Performance benchmarks met
- [ ] Database backup strategy
- [ ] Environment variables configured
- [ ] API documentation complete

### Frontend (Vercel)
- [ ] Build size < 300KB
- [ ] Lighthouse score > 80
- [ ] All images optimized
- [ ] Analytics configured

### Backend (Railway/Fly.io)
- [ ] Error tracking (Sentry)
- [ ] Logging configured
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Health check endpoint `/health`
- [ ] Auto-scaling configured

### Monitoring
- [ ] CPU/Memory alerts
- [ ] Error rate alerts
- [ ] API latency alerts
- [ ] Database alerts
- [ ] Storage alerts

---

## Summary

This is a **production-ready architecture** designed for:
- ✅ Single-user simplicity (no multi-tenancy complexity)
- ✅ Scalability to multi-user without major refactoring
- ✅ Clean code separation (services → repositories)
- ✅ Type-safe implementation (TypeScript + Pydantic)
- ✅ Security by design (JWT, validation, audit logs)
- ✅ Performance optimization (indexing, caching)
- ✅ Comprehensive testing & monitoring

---

**Next Steps:**

1. ✅ Review this architecture document
2. ✅ Approve technology choices
3. ✅ Approve folder structure
4. ✅ Approve database schema
5. ✅ Ask for clarifications/modifications
6. Once approved → Begin Phase 1 implementation

