"""
Category Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.schemas import CategoryCreate, CategoryResponse
from app.services.category_service import CategoryService
from app.exceptions import AppException

router = APIRouter()


@router.post("", response_model=dict, tags=["categories"])
async def create_category(
    category_data: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new category."""
    try:
        user_uuid = UUID(user_id)
        category = CategoryService.create_category(db, user_uuid, category_data)
        return {
            "status": "success",
            "data": CategoryResponse.from_orm(category),
            "message": "Category created successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict, tags=["categories"])
async def list_categories(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all categories for current user."""
    try:
        user_uuid = UUID(user_id)
        categories = CategoryService.get_user_categories(db, user_uuid)
        return {
            "status": "success",
            "data": [CategoryResponse.from_orm(c) for c in categories],
            "message": "Categories retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{category_id}", response_model=dict, tags=["categories"])
async def get_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific category."""
    try:
        user_uuid = UUID(user_id)
        category = CategoryService.get_category(db, user_uuid, UUID(category_id))
        return {
            "status": "success",
            "data": CategoryResponse.from_orm(category),
            "message": "Category retrieved successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{category_id}", response_model=dict, tags=["categories"])
async def update_category(
    category_id: str,
    category_data: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a category."""
    try:
        user_uuid = UUID(user_id)
        update_dict = category_data.dict(exclude_unset=True)
        category = CategoryService.update_category(db, user_uuid, UUID(category_id), update_dict)
        return {
            "status": "success",
            "data": CategoryResponse.from_orm(category),
            "message": "Category updated successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{category_id}", response_model=dict, tags=["categories"])
async def delete_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a category."""
    try:
        user_uuid = UUID(user_id)
        result = CategoryService.delete_category(db, user_uuid, UUID(category_id))
        return {
            "status": "success",
            "data": result,
            "message": "Category deleted successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
