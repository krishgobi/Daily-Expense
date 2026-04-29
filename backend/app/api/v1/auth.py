"""
Authentication Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    TokenResponse,
    UserUpdate,
)
from app.services.auth_service import AuthService
from app.exceptions import AuthException
from app.models import User

router = APIRouter()


@router.post("/register", response_model=dict, tags=["auth"])
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        result = AuthService.register_user(db, user_data)
        return {
            "status": "success",
            "data": result,
            "message": "User registered successfully",
        }
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=dict, tags=["auth"])
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login user with email and password."""
    try:
        result = AuthService.login_user(db, credentials.email, credentials.password)
        return {
            "status": "success",
            "data": result,
            "message": "Login successful",
        }
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=dict, tags=["auth"])
async def refresh(refresh_token: dict):
    """Refresh access token."""
    try:
        token = refresh_token.get("refresh_token")
        if not token:
            raise AuthException("Refresh token required")

        result = AuthService.refresh_token(token)
        return {
            "status": "success",
            "data": result,
            "message": "Token refreshed successfully",
        }
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=dict, tags=["auth"])
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return {
        "status": "success",
        "data": UserResponse.from_orm(current_user),
        "message": "User information retrieved",
    }


@router.put("/profile", response_model=dict, tags=["auth"])
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile."""
    try:
        updated_user = AuthService.update_user_profile(db, current_user.id, update_data)
        return {
            "status": "success",
            "data": UserResponse.from_orm(updated_user),
            "message": "Profile updated successfully",
        }
    except AuthException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
