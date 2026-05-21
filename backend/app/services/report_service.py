"""
Report Service
Generates and manages reports in multiple formats
"""

from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime, date
import logging
import os

from sqlalchemy import func
from app.models import Report, Expense, Transaction, ExpenseCategory
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
        from sqlalchemy.orm import joinedload
        # Query directly to avoid service-layer pagination caps; eager-load category
        expenses = (
            db.query(Expense)
            .options(joinedload(Expense.category))
            .filter(
                Expense.user_id == user_id,
                Expense.date >= period_start,
                Expense.date <= period_end,
            )
            .order_by(Expense.date.asc())
            .all()
        )

        transactions = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.given_date >= period_start,
                Transaction.given_date <= period_end,
            )
            .all()
        )

        total_expenses = float(sum(e.amount for e in expenses))
        total_borrowed = float(sum(t.amount for t in transactions if t.transaction_type == "BORROWED"))
        total_lent     = float(sum(t.amount for t in transactions if t.transaction_type == "LENT"))

        # Category breakdown across the full date range
        cat_rows = (
            db.query(
                ExpenseCategory.name,
                ExpenseCategory.icon,
                ExpenseCategory.color,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .join(Expense, ExpenseCategory.id == Expense.category_id)
            .filter(
                Expense.user_id == user_id,
                Expense.date >= period_start,
                Expense.date <= period_end,
            )
            .group_by(ExpenseCategory.id, ExpenseCategory.name, ExpenseCategory.icon, ExpenseCategory.color)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        )
        cat_total = sum(float(r.total) for r in cat_rows if r.total)
        category_breakdown = [
            {
                "name":       r.name,
                "icon":       r.icon or "",
                "color":      r.color or "",
                "amount":     float(r.total) if r.total else 0.0,
                "count":      r.count or 0,
                "percentage": round(float(r.total) / cat_total * 100, 2) if cat_total else 0.0,
            }
            for r in cat_rows if r.total
        ]

        # Payment type breakdown across the full date range
        type_rows = (
            db.query(
                Expense.type,
                func.sum(Expense.amount).label("total"),
                func.count(Expense.id).label("count"),
            )
            .filter(
                Expense.user_id == user_id,
                Expense.date >= period_start,
                Expense.date <= period_end,
            )
            .group_by(Expense.type)
            .all()
        )
        type_breakdown = {"CASH": {"amount": 0.0, "count": 0, "percentage": 0.0},
                          "DIGITAL": {"amount": 0.0, "count": 0, "percentage": 0.0}}
        for r in type_rows:
            key = r.type if r.type in type_breakdown else "CASH"
            type_breakdown[key]["amount"] = float(r.total) if r.total else 0.0
            type_breakdown[key]["count"]  = r.count or 0
        type_total = type_breakdown["CASH"]["amount"] + type_breakdown["DIGITAL"]["amount"]
        if type_total:
            for k in type_breakdown:
                type_breakdown[k]["percentage"] = round(type_breakdown[k]["amount"] / type_total * 100, 2)

        # Build serialisable expense rows (avoids DetachedInstanceError in generators)
        expense_rows = [
            {
                "date":           e.date.strftime("%d %b %Y"),
                "purpose":        e.purpose,
                "category":       e.category.name if e.category else "Uncategorized",
                "type":           e.type,
                "amount":         float(e.amount),
                "payment_method": e.payment_method or "",
                "description":    e.description or "",
            }
            for e in expenses
        ]

        return {
            "expense_rows":       expense_rows,
            "expenses":           expenses,
            "transactions":       transactions,
            "total_expenses":     total_expenses,
            "total_borrowed":     total_borrowed,
            "total_lent":         total_lent,
            "category_breakdown": category_breakdown,
            "type_breakdown":     type_breakdown,
            "period_start":       period_start,
            "period_end":         period_end,
        }
