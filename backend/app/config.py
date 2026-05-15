"""
Configuration Management
Loads settings from environment variables
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application Settings"""

    # Supabase
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_KEY: str = "placeholder-key"
    SUPABASE_SERVICE_KEY: str = "placeholder-service-key"
    SUPABASE_JWT_SECRET: str = ""

    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production-min-32-chars-long-123456789"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_REFRESH_EXPIRATION_DAYS: int = 7

    # Database
    DATABASE_URL: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Groq API
    GROQ_API_KEY: str = ""

    # Twilio WhatsApp
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    TWILIO_WHATSAPP_TO: str = ""
    APP_URL: str = "http://localhost:5173"

    # Email (SMTP) — for non-WhatsApp users
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Tracksy.AI"
    SMTP_FROM_EMAIL: str = ""

    # Routing — only this user gets WhatsApp; all others get email
    WHATSAPP_USER_EMAIL: str = "gobibhuvi1415@gmail.com"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://daily-expense-mocha.vercel.app",
    ]

    # File Upload
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png", "gif"]

    # API
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "Tracksy.AI API"
    API_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def IS_PRODUCTION(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT.lower() == "production"

    @property
    def IS_DEVELOPMENT(self) -> bool:
        """Check if running in development."""
        return self.ENVIRONMENT.lower() == "development"


# Load settings
settings = Settings()
