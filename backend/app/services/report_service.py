"""
Report Service
Generates and manages reports in multiple formats
"""

from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime, date
import logging
import os

from app.models import Report
from app.services.expense_service import ExpenseService
from app.services.transaction_service import TransactionService
from app.services.analytics_service import AnalyticsService
from app.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class ReportService:
    """Report generation and management service."""

    @staticmethod
    def create_report(
        db: Session,
        user_id: UUID,
        report_type: str,
        period_start: date,
        period_end: date,
    ) -> Report:
        """Create a report record in database."""
        report = Report(
            user_id=user_id,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        logger.info(f"Report created: {report_type} - {period_start} to {period_end}")
        return report

    @staticmethod
    def update_report(
        db: Session,
        report_id: UUID,
        total_expenses: float = None,
        total_borrowed: float = None,
        total_lent: float = None,
        file_path: str = None,
    ) -> Report:
        """Update report with generated data."""
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise NotFoundException("Report not found")

        if total_expenses is not None:
            report.total_expenses = total_expenses
        if total_borrowed is not None:
            report.total_borrowed = total_borrowed
        if total_lent is not None:
            report.total_lent = total_lent
        if file_path is not None:
            report.file_path = file_path

        db.commit()
        db.refresh(report)

        return report

    @staticmethod
    def get_user_reports(db: Session, user_id: UUID, limit: int = 20, offset: int = 0) -> tuple[list[Report], int]:
        """Get all reports for a user."""
        query = db.query(Report).filter(Report.user_id == user_id)
        total = query.count()
        reports = query.order_by(Report.generated_at.desc()).offset(offset).limit(limit).all()
        return reports, total

    @staticmethod
    def get_report(db: Session, user_id: UUID, report_id: UUID) -> Report:
        """Get a specific report."""
        report = db.query(Report).filter(
            Report.id == report_id,
            Report.user_id == user_id,
        ).first()

        if not report:
            raise NotFoundException("Report not found")

        return report

    @staticmethod
    def delete_report(db: Session, user_id: UUID, report_id: UUID) -> dict:
        """Delete a report."""
        report = ReportService.get_report(db, user_id, report_id)

        # Delete file if exists
        if report.file_path and os.path.exists(report.file_path):
            try:
                os.remove(report.file_path)
            except Exception as e:
                logger.warning(f"Could not delete file {report.file_path}: {e}")

        db.delete(report)
        db.commit()

        logger.info(f"Report deleted: {report.id}")
        return {"message": "Report deleted successfully"}

    @staticmethod
    def gather_report_data(
        db: Session,
        user_id: UUID,
        period_start: date,
        period_end: date,
    ) -> dict:
        """Gather all data needed for a report."""
        # Get expenses for period
        expenses, _ = ExpenseService.list_expenses(
            db,
            user_id,
            date_from=period_start,
            date_to=period_end,
            limit=10000,
        )

        # Get transactions for period
        transactions, _ = TransactionService.list_transactions(
            db,
            user_id,
            limit=10000,
        )

        # Filter transactions by date
        filtered_transactions = [
            t for t in transactions
            if period_start <= t.given_date <= period_end
        ]

        # Calculate totals
        total_expenses = sum(e.amount for e in expenses)
        total_borrowed = sum(
            t.amount for t in filtered_transactions if t.transaction_type == "BORROWED"
        )
        total_lent = sum(
            t.amount for t in filtered_transactions if t.transaction_type == "LENT"
        )

        # Get breakdowns
        category_breakdown = AnalyticsService.get_category_breakdown(
            db, user_id, period_start.year, period_start.month
        )
        type_breakdown = AnalyticsService.get_expense_type_breakdown(
            db, user_id, period_start.year, period_start.month
        )

        return {
            "expenses": expenses,
            "transactions": filtered_transactions,
            "total_expenses": total_expenses,
            "total_borrowed": total_borrowed,
            "total_lent": total_lent,
            "category_breakdown": category_breakdown,
            "type_breakdown": type_breakdown,
            "period_start": period_start,
            "period_end": period_end,
        }
