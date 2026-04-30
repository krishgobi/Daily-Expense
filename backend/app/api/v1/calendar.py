"""
Calendar Routes
Calendar event endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.services.calendar_service import CalendarService

router = APIRouter()


@router.get("/month", tags=["calendar"])
async def get_month_events(
    year: int = Query(..., ge=2024, le=2100, description="Year"),
    month: int = Query(..., ge=1, le=12, description="Month"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get calendar events for a specific month."""
    try:
        user_uuid = UUID(user_id)
        user_uuid = UUID(user_id)
        result = CalendarService.get_month_events(
            db=db,
            user_id=user_uuid,
            year=year,
            month=month,
        )

        return {
            "status": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming", tags=["calendar"])
async def get_upcoming_events(
    days_ahead: int = Query(30, ge=1, le=365, description="Number of days to look ahead"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get upcoming events for the next N days."""
    try:
        user_uuid = UUID(user_id)
        user_uuid = UUID(user_id)
        result = CalendarService.get_upcoming_events(
            db=db,
            user_id=user_uuid,
            days_ahead=days_ahead,
        )

        return {
            "status": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/overdue", tags=["calendar"])
async def get_overdue_events(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all overdue pending transactions."""
    try:
        user_uuid = UUID(user_id)
        user_uuid = UUID(user_id)
        overdue = CalendarService.get_overdue_events(
            db=db,
            user_id=user_uuid,
        )

        return {
            "status": "success",
            "data": {
                "overdue": overdue,
                "total": len(overdue),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", tags=["calendar"])
async def get_calendar_summary(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get summary of calendar events."""
    try:
        user_uuid = UUID(user_id)
        summary = CalendarService.get_calendar_summary(
            db=db,
            user_id=user_uuid,
        )

        return {
            "status": "success",
            "data": summary,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
