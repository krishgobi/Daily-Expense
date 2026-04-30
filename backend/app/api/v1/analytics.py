"""
Analytics Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.services.analytics_service import AnalyticsService
from app.models import User

router = APIRouter()


@router.get("/dashboard", response_model=dict, tags=["analytics"])
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get complete dashboard overview with all analytics."""
    try:
        overview = AnalyticsService.get_dashboard_overview(db, current_user.id)
        return {
            "status": "success",
            "data": overview,
            "message": "Dashboard overview retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends/spending", response_model=dict, tags=["analytics"])
async def get_spending_trend(
    months: int = Query(6, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get spending trend analysis."""
    try:
        last_months = AnalyticsService.get_last_n_months(db, current_user.id, months)
        spending_trend = AnalyticsService.get_spending_trend(db, current_user.id, months)

        return {
            "status": "success",
            "data": {
                "months": last_months,
                "trend": spending_trend,
            },
            "message": "Spending trend retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakdown/category", response_model=dict, tags=["analytics"])
async def get_category_breakdown(
    year: int = Query(None),
    month: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get category breakdown for a month."""
    try:
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_category_breakdown(db, current_user.id, year, month)
        return {
            "status": "success",
            "data": breakdown,
            "message": "Category breakdown retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakdown/daily", response_model=dict, tags=["analytics"])
async def get_daily_breakdown(
    year: int = Query(None),
    month: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get daily breakdown for a month."""
    try:
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_daily_breakdown(db, current_user.id, year, month)
        return {
            "status": "success",
            "data": breakdown,
            "message": "Daily breakdown retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakdown/type", response_model=dict, tags=["analytics"])
async def get_expense_type_breakdown(
    year: int = Query(None),
    month: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get cash vs digital breakdown for a month."""
    try:
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_expense_type_breakdown(db, current_user.id, year, month)
        return {
            "status": "success",
            "data": breakdown,
            "message": "Expense type breakdown retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/breakdown/payment-methods", response_model=dict, tags=["analytics"])
async def get_payment_method_breakdown(
    year: int = Query(None),
    month: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment method breakdown for digital expenses."""
    try:
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_payment_method_breakdown(db, current_user.id, year, month)
        return {
            "status": "success",
            "data": breakdown,
            "message": "Payment method breakdown retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-categories", response_model=dict, tags=["analytics"])
async def get_top_categories(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top spending categories."""
    try:
        top_categories = AnalyticsService.get_top_spending_categories(db, current_user.id, limit)
        return {
            "status": "success",
            "data": top_categories,
            "message": "Top categories retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
