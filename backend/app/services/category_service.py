"""
Category Service
Manages expense categories
"""

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
import logging

from app.models import ExpenseCategory, User
from app.schemas import CategoryCreate
from app.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


class CategoryService:
    """Category management service."""

    @staticmethod
    def create_category(db: Session, user_id: UUID, category_data: CategoryCreate) -> ExpenseCategory:
        """Create a new category."""
        # Check if category name already exists for this user
        existing = db.query(ExpenseCategory).filter(
            ExpenseCategory.user_id == user_id,
            ExpenseCategory.name == category_data.name,
        ).first()

        if existing:
            raise ConflictException(f"Category '{category_data.name}' already exists")

        category = ExpenseCategory(
            user_id=user_id,
            name=category_data.name,
            icon=category_data.icon,
            color=category_data.color,
        )

        db.add(category)
        db.commit()
        db.refresh(category)

        logger.info(f"Category created: {category.name} for user {user_id}")
        return category

    @staticmethod
    def get_user_categories(db: Session, user_id: UUID) -> list[ExpenseCategory]:
        """Get all categories for a user."""
        return db.query(ExpenseCategory).filter(
            ExpenseCategory.user_id == user_id
        ).order_by(ExpenseCategory.created_at).all()

    @staticmethod
    def get_category(db: Session, user_id: UUID, category_id: UUID) -> ExpenseCategory:
        """Get a specific category."""
        category = db.query(ExpenseCategory).filter(
            ExpenseCategory.id == category_id,
            ExpenseCategory.user_id == user_id,
        ).first()

        if not category:
            raise NotFoundException("Category not found")

        return category

    @staticmethod
    def update_category(
        db: Session,
        user_id: UUID,
        category_id: UUID,
        update_data: dict,
    ) -> ExpenseCategory:
        """Update a category."""
        category = CategoryService.get_category(db, user_id, category_id)

        # Check if new name conflicts with existing category
        if "name" in update_data:
            existing = db.query(ExpenseCategory).filter(
                ExpenseCategory.user_id == user_id,
                ExpenseCategory.name == update_data["name"],
                ExpenseCategory.id != category_id,
            ).first()

            if existing:
                raise ConflictException(f"Category '{update_data['name']}' already exists")

        for key, value in update_data.items():
            if value is not None:
                setattr(category, key, value)

        db.commit()
        db.refresh(category)

        logger.info(f"Category updated: {category.name}")
        return category

    @staticmethod
    def delete_category(db: Session, user_id: UUID, category_id: UUID) -> dict:
        """Delete a category."""
        category = CategoryService.get_category(db, user_id, category_id)

        db.delete(category)
        db.commit()

        logger.info(f"Category deleted: {category.name}")
        return {"message": "Category deleted successfully"}

    @staticmethod
    def get_or_create_default_categories(db: Session, user_id: UUID):
        """Create default categories for new user."""
        default_categories = [
            {"name": "Food", "icon": "🍔", "color": "#FF6B6B"},
            {"name": "Transport", "icon": "🚗", "color": "#4ECDC4"},
            {"name": "Entertainment", "icon": "🎬", "color": "#45B7D1"},
            {"name": "Shopping", "icon": "🛍️", "color": "#FFA07A"},
            {"name": "Utilities", "icon": "💡", "color": "#98D8C8"},
            {"name": "Health", "icon": "⚕️", "color": "#F7DC6F"},
            {"name": "Other", "icon": "📝", "color": "#95A5A6"},
        ]

        for cat_data in default_categories:
            existing = db.query(ExpenseCategory).filter(
                ExpenseCategory.user_id == user_id,
                ExpenseCategory.name == cat_data["name"],
            ).first()

            if not existing:
                category = ExpenseCategory(
                    user_id=user_id,
                    **cat_data,
                )
                db.add(category)

        db.commit()
