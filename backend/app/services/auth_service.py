"""
Authentication Service
Handles user registration, login, and token management
"""

from sqlalchemy.orm import Session
from datetime import datetime
import logging
from uuid import UUID

from app.models import User
from app.schemas import UserCreate, UserUpdate, TokenResponse, UserResponse
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token, decode_token
from app.exceptions import AuthException

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service for user management."""

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> dict:
        """Register a new user."""
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise AuthException("User with this email already exists")

        # Create new user
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            full_name=user_data.full_name,
            currency_code=user_data.currency_code,
            timezone=user_data.timezone,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"User registered: {user.email}")

        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)

        return {
            "user": UserResponse.from_orm(user),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 86400,  # 24 hours
            },
        }

    @staticmethod
    def login_user(db: Session, email: str, password: str) -> dict:
        """Login user with email and password."""
        user = db.query(User).filter(User.email == email).first()

        if not user or not verify_password(password, user.password_hash):
            raise AuthException("Invalid email or password")

        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()

        logger.info(f"User logged in: {user.email}")

        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)

        return {
            "user": UserResponse.from_orm(user),
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": 86400,
            },
        }

    @staticmethod
    def refresh_token(refresh_token: str) -> dict:
        """Refresh access token using refresh token."""
        payload = decode_token(refresh_token)

        if not payload or payload.get("type") == "refresh":
            raise AuthException("Invalid refresh token")

        user_id = payload.get("user_id")
        email = payload.get("email")

        access_token = create_access_token(UUID(user_id), email)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 86400,
        }

    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID) -> User:
        """Get user by ID."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AuthException("User not found")
        return user

    @staticmethod
    def update_user_profile(db: Session, user_id: UUID, update_data: UserUpdate) -> User:
        """Update user profile."""
        user = AuthService.get_user_by_id(db, user_id)

        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(user, key, value)

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

        logger.info(f"User profile updated: {user.email}")
        return user
