"""
Development schema sync helpers.

This app did not have Alembic version files committed, so create_all() can
create missing tables but cannot add columns to existing Supabase tables. This
module adds the columns the current models need without dropping data.
"""

from sqlalchemy import text
from app.database.connection import engine

# Import chat schema only when needed to avoid circular imports
try:
    from app.utils.chat_schema import CHAT_HISTORY_TABLE_SQL, RAG_CONTEXT_TABLE_SQL, SIMILARITY_SEARCH_FUNCTION_SQL
    CHAT_ENABLED = True
except ImportError:
    CHAT_ENABLED = False
    CHAT_HISTORY_TABLE_SQL = ""
    RAG_CONTEXT_TABLE_SQL = ""
    SIMILARITY_SEARCH_FUNCTION_SQL = ""


def run_schema_sync() -> None:
    with engine.begin() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) DEFAULT 'supabase-auth',
                full_name VARCHAR(255),
                currency_code VARCHAR(3) DEFAULT 'INR',
                timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW(),
                last_login TIMESTAMP
            )
        """))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT 'supabase-auth'"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR'"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP"))

        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                transaction_type VARCHAR(20) DEFAULT 'BORROWED',
                person_name VARCHAR(255) DEFAULT 'Unknown',
                purpose VARCHAR(255),
                amount DOUBLE PRECISION DEFAULT 0,
                given_date DATE DEFAULT CURRENT_DATE,
                expected_return_date DATE,
                actual_return_date DATE,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        connection.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'transactions'
                      AND column_name = 'type'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'transactions'
                      AND column_name = 'transaction_type'
                ) THEN
                    ALTER TABLE transactions RENAME COLUMN type TO transaction_type;
                END IF;
            END $$;
        """))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'BORROWED'"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS person_name VARCHAR(255) DEFAULT 'Unknown'"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS purpose VARCHAR(255)"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION DEFAULT 0"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS given_date DATE DEFAULT CURRENT_DATE"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expected_return_date DATE"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS actual_return_date DATE"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"))

        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS transaction_media (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_url VARCHAR(1000),
                file_type VARCHAR(20),
                file_size INTEGER,
                uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
                type VARCHAR(20) DEFAULT 'CASH',
                purpose VARCHAR(255) DEFAULT 'Unknown',
                amount DOUBLE PRECISION DEFAULT 0,
                description TEXT,
                date DATE DEFAULT CURRENT_DATE,
                location VARCHAR(255),
                payment_method VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS expense_media (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_url VARCHAR(1000),
                file_type VARCHAR(20),
                file_size INTEGER,
                uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        """))
        
        # Add performance indexes
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_at DESC)"))
        
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC)"))
        
        for table_name in ("expense_media", "transaction_media"):
            connection.execute(text(f"ALTER TABLE IF EXISTS {table_name} ADD COLUMN IF NOT EXISTS file_url VARCHAR(1000)"))
            connection.execute(text(f"ALTER TABLE IF EXISTS {table_name} ADD COLUMN IF NOT EXISTS file_type VARCHAR(20)"))
            connection.execute(text(f"ALTER TABLE IF EXISTS {table_name} ADD COLUMN IF NOT EXISTS file_size INTEGER"))
            connection.execute(text(f"ALTER TABLE IF EXISTS {table_name} ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT NOW()"))
        
        # Chat tables (conversations + messages) — always created
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                title VARCHAR(255) DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)"
        ))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        """))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)"
        ))

        # User settings (salary day + WhatsApp number + initial balance)
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                salary_day INTEGER,
                whatsapp_number VARCHAR(20),
                initial_balance DOUBLE PRECISION DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """))
        connection.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS salary_day INTEGER"))
        connection.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)"))
        connection.execute(text("ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS initial_balance DOUBLE PRECISION DEFAULT 0"))

        # Monthly income and savings
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS monthly_income (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                income DOUBLE PRECISION DEFAULT 0,
                savings DOUBLE PRECISION DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, year, month)
            )
        """))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_monthly_income_user ON monthly_income(user_id)"))

    # Legacy RAG chat tables in a SEPARATE transaction so a failure there
    # does not abort and roll back the main tables above.
    if CHAT_ENABLED:
        try:
            with engine.begin() as conn2:
                conn2.execute(text(CHAT_HISTORY_TABLE_SQL))
                conn2.execute(text(RAG_CONTEXT_TABLE_SQL))
                conn2.execute(text(SIMILARITY_SEARCH_FUNCTION_SQL))
        except Exception as e:
            print(f"Warning: Failed to create legacy chat tables: {e}")


if __name__ == "__main__":
    run_schema_sync()
    print("Database schema is synced.")
