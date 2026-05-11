"""
Transaction Service
Manages borrowed and lent money tracking
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, date, timedelta
import logging

from app.models import Transaction
from app.schemas import TransactionCreate, TransactionUpdate, TransactionCompleteRequest
from app.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class TransactionService:
    """Transaction management service."""

    @staticmethod
    def create_transaction(
        db: Session,
        user_id: UUID,
        transaction_data: TransactionCreate,
    ) -> Transaction:
        """Create a new transaction (borrowed or lent)."""
        transaction = Transaction(
            user_id=user_id,
            transaction_type=transaction_data.transaction_type,
            person_name=transaction_data.person_name,
            purpose=transaction_data.purpose,
            amount=transaction_data.amount,
            given_date=transaction_data.given_date,
            expected_return_date=transaction_data.expected_return_date,
            status="PENDING",
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        logger.info(
            f"Transaction created: {transaction.transaction_type} - "
            f"{transaction.person_name} - {transaction.amount}"
        )
        return transaction

    @staticmethod
    def get_transaction(db: Session, user_id: UUID, transaction_id: UUID) -> Transaction:
        """Get a specific transaction."""
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        ).first()

        if not transaction:
            raise NotFoundException("Transaction not found")

        # Load media for this transaction
        from app.models import TransactionMedia
        transaction.media = db.query(TransactionMedia).filter(
            TransactionMedia.transaction_id == transaction.id
        ).all()

        return transaction

    @staticmethod
    def list_transactions(
        db: Session,
        user_id: UUID,
        transaction_type: str = None,
        status: str = None,
        person_name: str = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Transaction], int]:
        """List transactions with filters."""
        query = db.query(Transaction).filter(Transaction.user_id == user_id)

        if transaction_type:
            query = query.filter(Transaction.transaction_type == transaction_type)

        if status:
            query = query.filter(Transaction.status == status)

        if person_name:
            query = query.filter(
                Transaction.person_name.ilike(f"%{person_name}%")
            )

        total_count = query.count()
        transactions = query.order_by(Transaction.given_date.desc()).offset(offset).limit(limit).all()
        
        # Load media for each transaction
        from app.models import TransactionMedia
        for transaction in transactions:
            transaction.media = db.query(TransactionMedia).filter(
                TransactionMedia.transaction_id == transaction.id
            ).all()

        return transactions, total_count

    @staticmethod
    def update_transaction(
        db: Session,
        user_id: UUID,
        transaction_id: UUID,
        update_data: TransactionUpdate,
    ) -> Transaction:
        """Update a transaction."""
        transaction = TransactionService.get_transaction(db, user_id, transaction_id)

        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(transaction, key, value)

        transaction.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(transaction)

        logger.info(f"Transaction updated: {transaction.person_name}")
        return transaction

    @staticmethod
    def complete_transaction(
        db: Session,
        user_id: UUID,
        transaction_id: UUID,
        actual_return_date: date,
    ) -> Transaction:
        """Mark a transaction as completed."""
        transaction = TransactionService.get_transaction(db, user_id, transaction_id)

        transaction.status = "COMPLETED"
        transaction.actual_return_date = actual_return_date
        transaction.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(transaction)

        logger.info(f"Transaction completed: {transaction.person_name}")
        return transaction

    @staticmethod
    def delete_transaction(db: Session, user_id: UUID, transaction_id: UUID) -> dict:
        """Delete a transaction."""
        transaction = TransactionService.get_transaction(db, user_id, transaction_id)

        db.delete(transaction)
        db.commit()

        logger.info(f"Transaction deleted: {transaction.person_name}")
        return {"message": "Transaction deleted successfully"}

    @staticmethod
    def get_pending_repayments(db: Session, user_id: UUID) -> list[Transaction]:
        """Get all pending money I need to pay (BORROWED)."""
        return db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "BORROWED",
            Transaction.status == "PENDING",
        ).order_by(Transaction.expected_return_date).all()

    @staticmethod
    def get_pending_collections(db: Session, user_id: UUID) -> list[Transaction]:
        """Get all pending money I need to receive (LENT)."""
        return db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "LENT",
            Transaction.status == "PENDING",
        ).order_by(Transaction.expected_return_date).all()

    @staticmethod
    def get_overdue_transactions(db: Session, user_id: UUID) -> tuple[list[Transaction], list[Transaction]]:
        """Get overdue transactions (both borrowed and lent)."""
        today = datetime.utcnow().date()

        overdue_borrowed = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "BORROWED",
            Transaction.status == "PENDING",
            Transaction.expected_return_date < today,
        ).all()

        overdue_lent = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "LENT",
            Transaction.status == "PENDING",
            Transaction.expected_return_date < today,
        ).all()

        return overdue_borrowed, overdue_lent

    @staticmethod
    def get_overdue_days(transaction: Transaction) -> int:
        """Calculate how many days overdue a transaction is."""
        if not transaction.expected_return_date or transaction.status == "COMPLETED":
            return 0

        today = datetime.utcnow().date()
        if today > transaction.expected_return_date:
            return (today - transaction.expected_return_date).days
        return 0

    @staticmethod
    def get_days_until_due(transaction: Transaction) -> int:
        """Calculate days until due date."""
        if not transaction.expected_return_date or transaction.status == "COMPLETED":
            return 0

        today = datetime.utcnow().date()
        if today < transaction.expected_return_date:
            return (transaction.expected_return_date - today).days
        return 0

    @staticmethod
    def get_total_borrowed(db: Session, user_id: UUID, status: str = None) -> float:
        """Get total amount borrowed."""
        query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "BORROWED",
        )

        if status:
            query = query.filter(Transaction.status == status)

        result = query.scalar()
        return float(result) if result else 0.0

    @staticmethod
    def get_total_lent(db: Session, user_id: UUID, status: str = None) -> float:
        """Get total amount lent."""
        query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "LENT",
        )

        if status:
            query = query.filter(Transaction.status == status)

        result = query.scalar()
        return float(result) if result else 0.0

    @staticmethod
    def get_transactions_summary(db: Session, user_id: UUID) -> dict:
        """Get summary of all transactions."""
        total_borrowed = TransactionService.get_total_borrowed(db, user_id)
        total_lent = TransactionService.get_total_lent(db, user_id)
        pending_borrowed = TransactionService.get_total_borrowed(db, user_id, "PENDING")
        pending_lent = TransactionService.get_total_lent(db, user_id, "PENDING")

        overdue_borrowed, overdue_lent = TransactionService.get_overdue_transactions(db, user_id)

        return {
            "total_borrowed": total_borrowed,
            "total_lent": total_lent,
            "pending_borrowed": pending_borrowed,
            "pending_lent": pending_lent,
            "overdue_borrowed_count": len(overdue_borrowed),
            "overdue_lent_count": len(overdue_lent),
            "overdue_borrowed_amount": sum(t.amount for t in overdue_borrowed),
            "overdue_lent_amount": sum(t.amount for t in overdue_lent),
        }
