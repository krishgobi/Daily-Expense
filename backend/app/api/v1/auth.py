"""
Authentication Routes (Supabase-based)
Handles user profile management and current user info
Auth itself is handled entirely by Supabase
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.dependencies import get_current_user_id, security
from app.schemas import UserUpdate, UserResponse
from app.models import User
from app.utils.supabase_jwt import get_supabase_validator

router = APIRouter()


def sync_supabase_profile(db: Session, user_uuid: UUID, full_name: str) -> None:
    """Keep the optional Supabase profiles table aligned when it exists."""
    try:
        db.execute(
            text(
                """
                INSERT INTO profiles (id, full_name)
                VALUES (:id, :full_name)
                ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
                """
            ),
            {"id": user_uuid, "full_name": full_name},
        )
        db.commit()
    except Exception:
        db.rollback()


def create_user_profile_from_token(
    db: Session,
    user_uuid: UUID,
    credentials: HTTPAuthorizationCredentials,
) -> User:
    """Create a local profile row for a Supabase-authenticated user."""
    payload = get_supabase_validator().validate_token(credentials.credentials)
    email = payload.get("email")
    metadata = payload.get("user_metadata") or {}
    full_name = metadata.get("full_name") or metadata.get("name") or "New User"

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authenticated user does not have an email address",
        )

    user = User(
        id=user_uuid,
        email=email,
        password_hash="supabase-auth",
        full_name=full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    sync_supabase_profile(db, user_uuid, full_name)
    return user


@router.get("/me", response_model=dict, tags=["auth"])
async def get_current_user_info(
    user_id: str = Depends(get_current_user_id),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Get current authenticated user information.
    
    Retrieves user profile from database using the user ID from Supabase JWT token.
    
    Returns:
        Current user profile information
        
    Raises:
        HTTPException 404: If user profile not found
    """
    try:
        # Convert string user_id to UUID
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    # Query user profile from database
    user = db.query(User).filter(User.id == user_uuid).first()
    
    if not user:
        user = create_user_profile_from_token(db, user_uuid, credentials)
    
    return {
        "status": "success",
        "data": UserResponse.from_orm(user),
    }


@router.put("/profile", response_model=dict, tags=["auth"])
async def update_profile(
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Update current user profile.
    
    Allows user to update their profile information (full_name, currency_code, timezone).
    
    Args:
        update_data: Profile update data
        user_id: Current user ID (from Supabase JWT)
        db: Database session
        
    Returns:
        Updated user profile
        
    Raises:
        HTTPException 404: If user profile not found
        HTTPException 400: If invalid data provided
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )
    
    # Query user profile
    user = db.query(User).filter(User.id == user_uuid).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )
    
    # Update only provided fields
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(user)
        if update_data.full_name:
            sync_supabase_profile(db, user_uuid, update_data.full_name)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        )
    
    return {
        "status": "success",
        "data": UserResponse.from_orm(user),
        "message": "Profile updated successfully",
    }
