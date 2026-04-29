# Backend - Smart Expense Manager

FastAPI + SQLAlchemy + PostgreSQL (Supabase)

## Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Run Development Server
```bash
python -m uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000  
API Docs: http://localhost:8000/docs  
ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── api/v1/           # API routes
├── services/         # Business logic
├── repositories/     # Data access layer
├── models/           # Database models
├── schemas/          # Pydantic schemas
├── database/         # DB connection & migrations
├── utils/            # Helper functions
├── constants/        # App constants
├── exceptions/       # Custom exceptions
├── reports/          # Report generation
├── config.py         # Configuration
└── main.py           # FastAPI app entry
```

## Database Migrations

Using Alembic for schema management:

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Expenses
- `GET /api/v1/expenses` - List expenses
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses/{id}` - Get expense
- `PUT /api/v1/expenses/{id}` - Update expense
- `DELETE /api/v1/expenses/{id}` - Delete expense

### Transactions
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions` - Create transaction
- `PUT /api/v1/transactions/{id}` - Update transaction
- `PUT /api/v1/transactions/{id}/complete` - Mark as completed

See ARCHITECTURE.md for full API specification.

## Running Tests

```bash
pytest
```

## Code Style

- Format: Black
- Linting: Flake8
- Type checking: Mypy

Run all checks:
```bash
black .
flake8 .
mypy .
```
