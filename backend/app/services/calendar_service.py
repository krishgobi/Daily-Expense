"""
Calendar Service
Generates calendar events for transactions and expenses
"""

from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, date, timedelta
import calendar as calendar_module
import logging

from app.models import Transaction
from app.services.transaction_service import TransactionService

logger = logging.getLogger(__name__)


class CalendarService:
    """Calendar service for event generation."""

    @staticmethod
    def get_month_events(db: Session, user_id: UUID, year: int, month: int) -> dict:
        """Get all events for a month."""
        # Get all pending transactions for the month
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
        ).all()

        events = {}
        overdue = []

        today = date.today()

        for trans in transactions:
            if trans.expected_return_date:
                # Only include events in the requested month
                if trans.expected_return_date.year == year and trans.expected_return_date.month == month:
                    day = trans.expected_return_date.day

                    if day not in events:
                        events[day] = []

                    # Determine if overdue
                    is_overdue = trans.expected_return_date < today
                    overdue_days = (today - trans.expected_return_date).days if is_overdue else 0

                    events[day].append({
                        "id": str(trans.id),
                        "person": trans.person_name,
                        "amount": trans.amount,
                        "type": trans.transaction_type,
                        "purpose": trans.purpose,
                        "date": str(trans.expected_return_date),
                        "is_overdue": is_overdue,
                        "overdue_days": overdue_days,
                    })

                    # Track overdue
                    if is_overdue:
                        overdue.append({
                            "person": trans.person_name,
                            "amount": trans.amount,
                            "type": trans.transaction_type,
                            "overdue_days": overdue_days,
                        })

        return {
            "events": events,
            "overdue": overdue,
            "year": year,
            "month": month,
            "month_name": calendar_module.month_name[month],
        }

    @staticmethod
    def get_upcoming_events(db: Session, user_id: UUID, days_ahead: int = 30) -> dict:
        """Get upcoming events for the next N days."""
        today = date.today()
        future_date = today + timedelta(days=days_ahead)

        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
            Transaction.expected_return_date >= today,
            Transaction.expected_return_date <= future_date,
        ).order_by(Transaction.expected_return_date).all()

        events = []
        for trans in transactions:
            days_until = (trans.expected_return_date - today).days
            events.append({
                "id": str(trans.id),
                "person": trans.person_name,
                "amount": trans.amount,
                "type": trans.transaction_type,
                "date": str(trans.expected_return_date),
                "days_until": days_until,
                "is_today": days_until == 0,
                "is_tomorrow": days_until == 1,
            })

        return {
            "events": events,
            "days_ahead": days_ahead,
            "total_events": len(events),
        }

    @staticmethod
    def get_overdue_events(db: Session, user_id: UUID) -> list[dict]:
        """Get all overdue pending transactions."""
        today = date.today()

        transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
            Transaction.expected_return_date < today,
        ).order_by(Transaction.expected_return_date).all()

        overdue_events = []
        for trans in transactions:
            overdue_days = (today - trans.expected_return_date).days
            overdue_events.append({
                "id": str(trans.id),
                "person": trans.person_name,
                "amount": trans.amount,
                "type": trans.transaction_type,
                "date": str(trans.expected_return_date),
                "overdue_days": overdue_days,
            })

        return overdue_events

    @staticmethod
    def get_calendar_summary(db: Session, user_id: UUID) -> dict:
        """Get summary of calendar events."""
        today = date.today()
        week_end = today + timedelta(days=7)
        month_end = today.replace(day=1) + timedelta(days=32)
        month_end = month_end.replace(day=1) - timedelta(days=1)

        # Upcoming this week
        week_events = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
            Transaction.expected_return_date >= today,
            Transaction.expected_return_date <= week_end,
        ).all()

        # Upcoming this month
        month_events = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
            Transaction.expected_return_date >= today,
            Transaction.expected_return_date <= month_end,
        ).all()

        # Overdue
        overdue = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "PENDING",
            Transaction.expected_return_date < today,
        ).all()

        return {
            "this_week": {
                "count": len(week_events),
                "total": sum(t.amount for t in week_events),
            },
            "this_month": {
                "count": len(month_events),
                "total": sum(t.amount for t in month_events),
            },
            "overdue": {
                "count": len(overdue),
                "total": sum(t.amount for t in overdue),
            },
        }
