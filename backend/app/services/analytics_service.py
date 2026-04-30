"""
Analytics Service
Generates analytics data for dashboard
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from uuid import UUID
from datetime import datetime, date, timedelta
import calendar
import logging

from app.models import Expense, Transaction, ExpenseCategory
from app.services.expense_service import ExpenseService

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service for dashboard data."""

    @staticmethod
    def get_last_n_months(db: Session, user_id: UUID, n_months: int = 6) -> list[dict]:
        """Get expense totals for last N months."""
        today = datetime.utcnow().date()
        months_data = []

        for i in range(n_months - 1, -1, -1):
            # Calculate first day of month i months ago
            first_day = today.replace(day=1)
            for _ in range(i):
                first_day = first_day - timedelta(days=1)
                first_day = first_day.replace(day=1)

            # Last day of that month
            last_day = first_day + timedelta(days=32)
            last_day = last_day.replace(day=1) - timedelta(days=1)

            total, count = ExpenseService.get_monthly_total(
                db, user_id, first_day.year, first_day.month
            )

            months_data.append({
                "month": first_day.strftime("%b %Y"),
                "month_short": first_day.strftime("%b"),
                "total": total,
                "count": count,
            })

        return months_data

    @staticmethod
    def get_spending_trend(db: Session, user_id: UUID, n_months: int = 6) -> dict:
        """Analyze spending trend (increasing/decreasing)."""
        months_data = AnalyticsService.get_last_n_months(db, user_id, n_months)

        if len(months_data) < 2:
            return {"trend": "STABLE", "percentage_change": 0.0}

        # Compare last month vs average of previous months
        last_month = months_data[-1]["total"]
        previous_months = [m["total"] for m in months_data[:-1]]

        if not previous_months:
            return {"trend": "STABLE", "percentage_change": 0.0}

        avg_previous = sum(previous_months) / len(previous_months)

        if avg_previous == 0:
            return {"trend": "STABLE", "percentage_change": 0.0}

        percentage_change = ((last_month - avg_previous) / avg_previous) * 100

        if percentage_change > 5:
            trend = "UP"
        elif percentage_change < -5:
            trend = "DOWN"
        else:
            trend = "STABLE"

        return {
            "trend": trend,
            "percentage_change": round(percentage_change, 2),
            "last_month": last_month,
            "previous_average": round(avg_previous, 2),
        }

    @staticmethod
    def get_category_breakdown(db: Session, user_id: UUID, year: int, month: int) -> list[dict]:
        """Get expense breakdown by category for a month."""
        results = db.query(
            ExpenseCategory.name,
            ExpenseCategory.icon,
            ExpenseCategory.color,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).outerjoin(
            Expense,
            and_(
                ExpenseCategory.id == Expense.category_id,
                Expense.user_id == user_id,
                func.extract("year", Expense.date) == year,
                func.extract("month", Expense.date) == month,
            ),
        ).filter(
            ExpenseCategory.user_id == user_id,
        ).group_by(
            ExpenseCategory.id, ExpenseCategory.name, ExpenseCategory.icon, ExpenseCategory.color
        ).all()

        breakdown = []
        for row in results:
            if row.total:  # Only include categories with expenses
                total_float = float(row.total) if row.total else 0.0
                breakdown.append({
                    "name": row.name,
                    "icon": row.icon,
                    "color": row.color,
                    "amount": total_float,
                    "count": row.count or 0,
                    "percentage": 0.0,  # Will be calculated below
                })

        # Calculate percentages
        total_amount = sum(item["amount"] for item in breakdown)
        if total_amount > 0:
            for item in breakdown:
                item["percentage"] = round((item["amount"] / total_amount) * 100, 2)

        # Sort by amount descending
        breakdown.sort(key=lambda x: x["amount"], reverse=True)

        return breakdown

    @staticmethod
    def get_daily_breakdown(db: Session, user_id: UUID, year: int, month: int) -> list[dict]:
        """Get daily expense breakdown for a month."""
        result = db.query(
            Expense.date,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).group_by(Expense.date).order_by(Expense.date).all()

        return [
            {
                "date": str(row.date),
                "day": row.date.strftime("%a"),
                "amount": float(row.total) if row.total else 0.0,
                "count": row.count or 0,
            }
            for row in result
        ]

    @staticmethod
    def get_expense_type_breakdown(db: Session, user_id: UUID, year: int, month: int) -> dict:
        """Get breakdown between cash and digital expenses."""
        result = db.query(
            Expense.type,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).filter(
            Expense.user_id == user_id,
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).group_by(Expense.type).all()

        breakdown = {"CASH": {"amount": 0.0, "count": 0}, "DIGITAL": {"amount": 0.0, "count": 0}}

        for row in result:
            breakdown[row.type]["amount"] = float(row.total) if row.total else 0.0
            breakdown[row.type]["count"] = row.count or 0

        # Calculate percentages
        total = breakdown["CASH"]["amount"] + breakdown["DIGITAL"]["amount"]
        if total > 0:
            breakdown["CASH"]["percentage"] = round((breakdown["CASH"]["amount"] / total) * 100, 2)
            breakdown["DIGITAL"]["percentage"] = round((breakdown["DIGITAL"]["amount"] / total) * 100, 2)
        else:
            breakdown["CASH"]["percentage"] = 0.0
            breakdown["DIGITAL"]["percentage"] = 0.0

        return breakdown

    @staticmethod
    def get_payment_method_breakdown(db: Session, user_id: UUID, year: int, month: int) -> list[dict]:
        """Get breakdown by payment method for digital expenses."""
        result = db.query(
            Expense.payment_method,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).filter(
            Expense.user_id == user_id,
            Expense.type == "DIGITAL",
            func.extract("year", Expense.date) == year,
            func.extract("month", Expense.date) == month,
        ).group_by(Expense.payment_method).order_by(func.sum(Expense.amount).desc()).all()

        breakdown = []
        for row in result:
            if row.payment_method:
                breakdown.append({
                    "method": row.payment_method,
                    "amount": float(row.total) if row.total else 0.0,
                    "count": row.count or 0,
                })

        return breakdown

    @staticmethod
    def get_top_spending_categories(db: Session, user_id: UUID, limit: int = 5) -> list[dict]:
        """Get top spending categories (all time)."""
        result = db.query(
            ExpenseCategory.name,
            ExpenseCategory.icon,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        ).join(
            Expense,
            ExpenseCategory.id == Expense.category_id,
        ).filter(
            Expense.user_id == user_id,
        ).group_by(ExpenseCategory.id, ExpenseCategory.name, ExpenseCategory.icon).order_by(
            func.sum(Expense.amount).desc()
        ).limit(limit).all()

        return [
            {
                "name": row.name,
                "icon": row.icon,
                "total": float(row.total) if row.total else 0.0,
                "count": row.count or 0,
            }
            for row in result
        ]

    @staticmethod
    def get_dashboard_overview(db: Session, user_id: UUID) -> dict:
        """Get complete dashboard overview."""
        today = datetime.utcnow().date()
        year = today.year
        month = today.month

        # Summaries
        today_total = ExpenseService.get_daily_total(db, user_id, today)
        week_total, week_count = ExpenseService.get_weekly_total(db, user_id, today)
        month_total, month_count = ExpenseService.get_monthly_total(db, user_id, year, month)

        # Breakdown data
        category_breakdown = AnalyticsService.get_category_breakdown(db, user_id, year, month)
        daily_breakdown = AnalyticsService.get_daily_breakdown(db, user_id, year, month)
        expense_type_breakdown = AnalyticsService.get_expense_type_breakdown(db, user_id, year, month)
        payment_method_breakdown = AnalyticsService.get_payment_method_breakdown(db, user_id, year, month)

        # Trends
        last_6_months = AnalyticsService.get_last_n_months(db, user_id, 6)
        spending_trend = AnalyticsService.get_spending_trend(db, user_id, 6)

        # Top categories
        top_categories = AnalyticsService.get_top_spending_categories(db, user_id, 5)

        return {
            "summary": {
                "today": today_total,
                "week": week_total,
                "month": month_total,
            },
            "month": f"{calendar.month_name[month]} {year}",
            "breakdown": {
                "categories": category_breakdown,
                "daily": daily_breakdown,
                "type": expense_type_breakdown,
                "payment_methods": payment_method_breakdown,
            },
            "trends": {
                "last_6_months": last_6_months,
                "spending_trend": spending_trend,
            },
            "top_categories": top_categories,
        }
