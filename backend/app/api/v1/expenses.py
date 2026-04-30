"""
Expense Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from datetime import datetime

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from app.schemas import (
    CashExpenseCreate,
    DigitalExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)
from app.services.expense_service import ExpenseService
from app.exceptions import AppException

router = APIRouter()


@router.post("/cash", response_model=dict, tags=["expenses"])
async def create_cash_expense(
    expense_data: CashExpenseCreate,
    category_id: UUID = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a cash expense."""
    try:
        user_uuid = UUID(user_id)
        expense = ExpenseService.create_cash_expense(db, user_uuid, expense_data, category_id)
        return {
            "status": "success",
            "data": ExpenseResponse.from_orm(expense),
            "message": "Cash expense created successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/digital", response_model=dict, tags=["expenses"])
async def create_digital_expense(
    expense_data: DigitalExpenseCreate,
    category_id: UUID = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a digital expense."""
    try:
        user_uuid = UUID(user_id)
        expense = ExpenseService.create_digital_expense(db, user_uuid, expense_data, category_id)
        return {
            "status": "success",
            "data": ExpenseResponse.from_orm(expense),
            "message": "Digital expense created successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict, tags=["expenses"])
async def list_expenses(
    expense_type: str = Query(None),
    category_id: UUID = Query(None),
    date_from: date = Query(None),
    date_to: date = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List expenses with filters."""
    try:
        user_uuid = UUID(user_id)
        expenses, total = ExpenseService.list_expenses(
            db,
            user_uuid,
            expense_type,
            category_id,
            date_from,
            date_to,
            limit,
            offset,
        )
        return {
            "status": "success",
            "data": [ExpenseResponse.from_orm(e) for e in expenses],
            "meta": {
                "total": total,
                "limit": limit,
                "offset": offset,
            },
            "message": "Expenses retrieved successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{expense_id}", response_model=dict, tags=["expenses"])
async def get_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific expense."""
    try:
        user_uuid = UUID(user_id)
        expense = ExpenseService.get_expense(db, user_uuid, UUID(expense_id))
        return {
            "status": "success",
            "data": ExpenseResponse.from_orm(expense),
            "message": "Expense retrieved successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{expense_id}", response_model=dict, tags=["expenses"])
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update an expense."""
    try:
        user_uuid = UUID(user_id)
        expense = ExpenseService.update_expense(db, user_uuid, UUID(expense_id), expense_data)
        return {
            "status": "success",
            "data": ExpenseResponse.from_orm(expense),
            "message": "Expense updated successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{expense_id}", response_model=dict, tags=["expenses"])
async def delete_expense(
    expense_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete an expense."""
    try:
        user_uuid = UUID(user_id)
        result = ExpenseService.delete_expense(db, user_uuid, UUID(expense_id))
        return {
            "status": "success",
            "data": result,
            "message": "Expense deleted successfully",
        }
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/today", response_model=dict, tags=["expenses"])
async def get_today_summary(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get today's expense summary."""
    try:
        user_uuid = UUID(user_id)
        today = datetime.utcnow().date()
        total = ExpenseService.get_daily_total(db, user_uuid, today)
        return {
            "status": "success",
            "data": {"date": today, "total": total},
            "message": "Today's summary retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/week", response_model=dict, tags=["expenses"])
async def get_week_summary(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get this week's expense summary."""
    try:
        user_uuid = UUID(user_id)
        total, count = ExpenseService.get_weekly_total(db, user_uuid)
        return {
            "status": "success",
            "data": {"total": total, "count": count},
            "message": "Week summary retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/month", response_model=dict, tags=["expenses"])
async def get_month_summary(
    year: int = Query(None),
    month: int = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get month's expense summary."""
    try:
        user_uuid = UUID(user_id)
        if year is None or month is None:
            today = datetime.utcnow().date()
            year = today.year
            month = today.month

        total, count = ExpenseService.get_monthly_total(db, user_uuid, year, month)
        return {
            "status": "success",
            "data": {"year": year, "month": month, "total": total, "count": count},
            "message": "Month summary retrieved",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
