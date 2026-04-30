"""
Search Service
Full-text search across all entities
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from uuid import UUID
from datetime import datetime, date
import logging

from app.models import Expense, Transaction, ExpenseCategory

logger = logging.getLogger(__name__)


class SearchService:
    """Search service for finding expenses and transactions."""

    @staticmethod
    def search_expenses(
        db: Session,
        user_id: UUID,
        query: str = None,
        expense_type: str = None,
        category_id: UUID = None,
        date_from: date = None,
        date_to: date = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Expense], int]:
        """Search expenses with filters."""
        query_obj = db.query(Expense).filter(Expense.user_id == user_id)

        if query:
            # Full-text search on purpose, description, location
            search_pattern = f"%{query}%"
            query_obj = query_obj.filter(
                or_(
                    Expense.purpose.ilike(search_pattern),
                    Expense.description.ilike(search_pattern),
                    Expense.location.ilike(search_pattern),
                )
            )

        if expense_type:
            query_obj = query_obj.filter(Expense.type == expense_type)

        if category_id:
            query_obj = query_obj.filter(Expense.category_id == category_id)

        if date_from:
            query_obj = query_obj.filter(Expense.date >= date_from)

        if date_to:
            query_obj = query_obj.filter(Expense.date <= date_to)

        total_count = query_obj.count()
        expenses = query_obj.order_by(Expense.date.desc()).offset(offset).limit(limit).all()

        return expenses, total_count

    @staticmethod
    def search_transactions(
        db: Session,
        user_id: UUID,
        query: str = None,
        transaction_type: str = None,
        status: str = None,
        date_from: date = None,
        date_to: date = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Transaction], int]:
        """Search transactions with filters."""
        query_obj = db.query(Transaction).filter(Transaction.user_id == user_id)

        if query:
            # Search on person name and purpose
            search_pattern = f"%{query}%"
            query_obj = query_obj.filter(
                or_(
                    Transaction.person_name.ilike(search_pattern),
                    Transaction.purpose.ilike(search_pattern),
                )
            )

        if transaction_type:
            query_obj = query_obj.filter(Transaction.transaction_type == transaction_type)

        if status:
            query_obj = query_obj.filter(Transaction.status == status)

        if date_from:
            query_obj = query_obj.filter(Transaction.given_date >= date_from)

        if date_to:
            query_obj = query_obj.filter(Transaction.given_date <= date_to)

        total_count = query_obj.count()
        transactions = query_obj.order_by(Transaction.given_date.desc()).offset(offset).limit(limit).all()

        return transactions, total_count

    @staticmethod
    def global_search(
        db: Session,
        user_id: UUID,
        query: str,
        limit: int = 10,
    ) -> dict:
        """Perform global search across all entities."""
        search_pattern = f"%{query}%"

        # Search expenses
        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            or_(
                Expense.purpose.ilike(search_pattern),
                Expense.description.ilike(search_pattern),
                Expense.location.ilike(search_pattern),
            ),
        ).order_by(Expense.date.desc()).limit(limit).all()

        # Search transactions
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            or_(
                Transaction.person_name.ilike(search_pattern),
                Transaction.purpose.ilike(search_pattern),
            ),
        ).order_by(Transaction.given_date.desc()).limit(limit).all()

        # Search categories
        categories = db.query(ExpenseCategory).filter(
            ExpenseCategory.user_id == user_id,
            ExpenseCategory.name.ilike(search_pattern),
        ).limit(limit).all()

        return {
            "expenses": expenses,
            "transactions": transactions,
            "categories": categories,
            "query": query,
        }

    @staticmethod
    def get_recent_searches(db: Session, user_id: UUID, limit: int = 5) -> list[dict]:
        """Get recent searches (based on recent expenses/transactions)."""
        recent_expenses = db.query(Expense.purpose).filter(
            Expense.user_id == user_id
        ).distinct().order_by(Expense.created_at.desc()).limit(limit).all()

        recent_transactions = db.query(Transaction.person_name).filter(
            Transaction.user_id == user_id
        ).distinct().order_by(Transaction.created_at.desc()).limit(limit).all()

        recent = []
        for exp in recent_expenses:
            recent.append({"text": exp[0], "type": "expense"})
        for trans in recent_transactions:
            recent.append({"text": trans[0], "type": "transaction"})

        return recent[:limit]
