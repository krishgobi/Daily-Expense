"""
Analytics Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard", response_model=dict, tags=["analytics"])
async def get_dashboard_overview(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get complete dashboard overview with all analytics."""
    try:
        user_uuid = UUID(user_id)
        overview = AnalyticsService.get_dashboard_overview(db, user_uuid)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get spending trend analysis."""
    try:
        user_uuid = UUID(user_id)
        last_months = AnalyticsService.get_last_n_months(db, user_uuid, months)
        spending_trend = AnalyticsService.get_spending_trend(db, user_uuid, months)

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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get category breakdown for a month."""
    try:
        user_uuid = UUID(user_id)
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_category_breakdown(db, user_uuid, year, month)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get daily breakdown for a month."""
    try:
        user_uuid = UUID(user_id)
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_daily_breakdown(db, user_uuid, year, month)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get cash vs digital breakdown for a month."""
    try:
        user_uuid = UUID(user_id)
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_expense_type_breakdown(db, user_uuid, year, month)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get payment method breakdown for digital expenses."""
    try:
        user_uuid = UUID(user_id)
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        breakdown = AnalyticsService.get_payment_method_breakdown(db, user_uuid, year, month)
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
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get top spending categories."""
    try:
        user_uuid = UUID(user_id)
        top_categories = AnalyticsService.get_top_spending_categories(db, user_uuid, limit)
        return {
            "status": "success",
            "data": top_categories,
            "message": "Top categories retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
