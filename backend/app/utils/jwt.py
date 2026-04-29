"""
JWT Token Utility Functions
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import jwt
from app.config import settings


def create_access_token(user_id: UUID, email: str) -> str:
    """Create JWT access token."""
    payload = {
        "user_id": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: UUID, email: str) -> str:
    """Create JWT refresh token."""
    payload = {
        "user_id": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS),
        "iat": datetime.utcnow(),
        "type": "refresh",
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
