"""
Development schema sync helpers.

This app did not have Alembic version files committed, so create_all() can
create missing tables but cannot add columns to existing Supabase tables. This
module adds the columns the current models need without dropping data.
"""

from sqlalchemy import text

from app.database.connection import engine


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


if __name__ == "__main__":
    run_schema_sync()
    print("Database schema is synced.")
