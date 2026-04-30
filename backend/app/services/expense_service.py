"""
Expense Service
Manages expenses (cash and digital)
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from uuid import UUID
from datetime import datetime, date, timedelta
import logging

from app.models import Expense, ExpenseMedia, ExpenseCategory
from app.schemas import CashExpenseCreate, DigitalExpenseCreate, ExpenseUpdate
from app.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class ExpenseService:
    """Expense management service."""

    @staticmethod
    def create_cash_expense(
        db: Session,
        user_id: UUID,
        expense_data: CashExpenseCreate,
        category_id: UUID = None,
    ) -> Expense:
        """Create a cash expense."""
        expense = Expense(
            user_id=user_id,
            category_id=category_id,
            type="CASH",
            purpose=expense_data.purpose,
            amount=expense_data.amount,
            description=expense_data.description,
            date=expense_data.date,
            location=expense_data.location,
        )

        db.add(expense)
        db.commit()
        db.refresh(expense)

        logger.info(f"Cash expense created: {expense.purpose} - {expense.amount}")
        return expense

    @staticmethod
    def create_digital_expense(
        db: Session,
        user_id: UUID,
        expense_data: DigitalExpenseCreate,
        category_id: UUID = None,
    ) -> Expense:
        """Create a digital expense."""
        expense = Expense(
            user_id=user_id,
            category_id=category_id,
            type="DIGITAL",
            purpose=expense_data.purpose,
            amount=expense_data.amount,
            description=expense_data.description,
            date=expense_data.date,
            location=expense_data.location,
            payment_method=expense_data.payment_method,
        )

        db.add(expense)
        db.commit()
        db.refresh(expense)

        logger.info(f"Digital expense created: {expense.purpose} - {expense.amount}")
        return expense

    @staticmethod
    def get_expense(db: Session, user_id: UUID, expense_id: UUID) -> Expense:
        """Get a specific expense."""
        expense = db.query(Expense).filter(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        ).first()

        if not expense:
            raise NotFoundException("Expense not found")

        return expense

    @staticmethod
    def list_expenses(
        db: Session,
        user_id: UUID,
        expense_type: str = None,
        category_id: UUID = None,
        date_from: date = None,
        date_to: date = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Expense], int]:
        """List expenses with filters."""
        query = db.query(Expense).filter(Expense.user_id == user_id)

        if expense_type:
            query = query.filter(Expense.type == expense_type)

        if category_id:
            query = query.filter(Expense.category_id == category_id)

        if date_from:
            query = query.filter(Expense.date >= date_from)

        if date_to:
            query = query.filter(Expense.date <= date_to)

        total_count = query.count()
        expenses = query.order_by(Expense.date.desc()).offset(offset).limit(limit).all()

        return expenses, total_count

    @staticmethod
    def update_expense(
        db: Session,
        user_id: UUID,
        expense_id: UUID,
        update_data: ExpenseUpdate,
    ) -> Expense:
        """Update an expense."""
        expense = ExpenseService.get_expense(db, user_id, expense_id)

        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(expense, key, value)

        expense.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(expense)

        logger.info(f"Expense updated: {expense.purpose}")
        return expense

    @staticmethod
    def delete_expense(db: Session, user_id: UUID, expense_id: UUID) -> dict:
        """Delete an expense."""
        expense = ExpenseService.get_expense(db, user_id, expense_id)

        db.delete(expense)
        db.commit()

        logger.info(f"Expense deleted: {expense.purpose}")
        return {"message": "Expense deleted successfully"}

    @staticmethod
    def get_daily_total(db: Session, user_id: UUID, target_date: date) -> float:
        """Get total expenses for a specific day."""
        result = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.date == target_date,
        ).scalar()

        return float(result) if result else 0.0

    @staticmethod
    def get_weekly_total(db: Session, user_id: UUID, target_date: date = None) -> tuple[float, int]:
        """Get total expenses and count for the week."""
        if target_date is None:
            target_date = datetime.utcnow().date()

        # Start of week (Monday)
        week_start = target_date - timedelta(days=target_date.weekday())
        week_end = week_start + timedelta(days=6)

        result = db.query(
            func.sum(Expense.amount),
            func.count(Expense.id),
        ).filter(
            Expense.user_id == user_id,
            Expense.date >= week_start,
            Expense.date <= week_end,
        ).first()

        total = float(result[0]) if result[0] else 0.0
        count = result[1] if result[1] else 0

        return total, count

    @staticmethod
    def get_monthly_total(db: Session, user_id: UUID, year: int, month: int) -> tuple[float, int]:
        """Get total expenses and count for a month."""
        result = db.query(
            func.sum(Expense.amount),
            func.count(Expense.id),
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).first()

        total = float(result[0]) if result[0] else 0.0
        count = result[1] if result[1] else 0

        return total, count

    @staticmethod
    def get_yearly_total(db: Session, user_id: UUID, year: int) -> tuple[float, int]:
        """Get total expenses and count for a year."""
        result = db.query(
            func.sum(Expense.amount),
            func.count(Expense.id),
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
        ).first()

        total = float(result[0]) if result[0] else 0.0
        count = result[1] if result[1] else 0

        return total, count

    @staticmethod
    def get_category_breakdown(db: Session, user_id: UUID, year: int, month: int) -> list[dict]:
        """Get expense breakdown by category."""
        results = db.query(
            ExpenseCategory.name,
            ExpenseCategory.icon,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).join(
            Expense,
            ExpenseCategory.id == Expense.category_id,
            isouter=True,
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).group_by(ExpenseCategory.id, ExpenseCategory.name, ExpenseCategory.icon).all()

        return [
            {
                "name": row.name or "Uncategorized",
                "icon": row.icon,
                "total": float(row.total) if row.total else 0.0,
                "count": row.count or 0,
            }
            for row in results
        ]

    @staticmethod
    def get_expense_type_breakdown(db: Session, user_id: UUID, year: int, month: int) -> dict:
        """Get breakdown between cash and digital expenses."""
        result = db.query(
            Expense.type,
            func.sum(Expense.amount).label("total"),
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).group_by(Expense.type).all()

        breakdown = {"CASH": 0.0, "DIGITAL": 0.0}
        for row in result:
            breakdown[row.type] = float(row.total) if row.total else 0.0

        return breakdown
