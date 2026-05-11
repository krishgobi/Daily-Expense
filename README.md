# Tracksy.AI

A production-ready personal expense tracking application built with React, FastAPI, and Supabase.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git
- Supabase account

### Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
python -m alembic upgrade head  # Run migrations
python -m uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8001
API Docs: http://localhost:8001/docs

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

Frontend runs on: http://localhost:5173

## Project Structure

```
expense/
├── backend/              # FastAPI server
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Data access
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── database/    # DB migrations
│   └── requirements.txt
│
├── frontend/             # React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API clients
│   │   ├── hooks/       # Custom hooks
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── ARCHITECTURE.md       # System design
└── README.md            # This file
```

## Documentation

- **ARCHITECTURE.md** - Complete system design, API contracts, database schema
- **backend/README.md** - Backend setup & API documentation
- **frontend/README.md** - Frontend setup & component documentation

## Development Phases

1. **Phase 1: Foundation** - Auth, DB, basic API
2. **Phase 2: Expense Module** - Cash/Digital expenses
3. **Phase 3: Borrowed/Lent** - Transaction tracking
4. **Phase 4: Dashboard** - Analytics & summaries
5. **Phase 5: Reports** - PDF/Excel/Word export
6. **Phase 6: Search & Calendar** - Advanced search & UI
7. **Phase 7: Polish** - Testing & optimization
8. **Phase 8: Deployment** - Production deployment

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, Pydantic, Python 3.10+
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Auth**: JWT + Supabase Auth
- **Deployment**: Vercel (Frontend), Railway/Fly.io (Backend)

## License

MIT
