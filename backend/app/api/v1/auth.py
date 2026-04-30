"""
Authentication Routes (Supabase-based)
Handles user profile management and current user info
Auth itself is handled entirely by Supabase
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.schemas import UserUpdate, UserResponse
from app.exceptions import AuthException
from app.models import User

router = APIRouter()


@router.get("/me", response_model=dict, tags=["auth"])
async def get_current_user_info(
    user_id: str = Depends(get_current_user_id),
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
        # User not found - they may be logging in for the first time
        # Create a profile for them
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Please contact support.",
        )
    
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

