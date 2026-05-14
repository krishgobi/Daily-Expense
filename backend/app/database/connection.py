"""
Database Connection & Session Management
Supabase PostgreSQL Setup
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Database Base Class for Models
Base = declarative_base()

# Create Engine
# Using NullPool for serverless/edge deployments
# Normalise URL to psycopg2 regardless of what the env var contains
database_url = (
    settings.DATABASE_URL
    .replace("postgresql+psycopg://", "postgresql+psycopg2://")
    .replace("postgresql://", "postgresql+psycopg2://")
)
engine = create_engine(
    database_url,
    echo=settings.DEBUG,
    poolclass=NullPool,  # No connection pooling for serverless
    connect_args={
        "connect_timeout": 10,
    },
)

# Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
