"""
Search Routes
Full-text search endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date

from app.database.connection import get_db
from app.dependencies import get_current_user_id
from uuid import UUID
from app.services.search_service import SearchService

router = APIRouter()


@router.get("/expenses", tags=["search"])
async def search_expenses(
    q: str = Query(..., min_length=1, description="Search query"),
    expense_type: str = Query(None, description="Filter by expense type (CASH/DIGITAL)"),
    category_id: str = Query(None, description="Filter by category ID"),
    date_from: date = Query(None, description="Start date for filtering"),
    date_to: date = Query(None, description="End date for filtering"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Search expenses with filters."""
    try:
        user_uuid = UUID(user_id)
        from uuid import UUID
        category_id_uuid = UUID(category_id) if category_id else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category ID format")

    try:
        expenses, total_count = SearchService.search_expenses(
            db=db,
            user_id=user_uuid,
            query=q,
            expense_type=expense_type,
            category_id=category_id_uuid,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )

        return {
            "status": "success",
            "data": {
                "expenses": [
                    {
                        "id": str(e.id),
                        "purpose": e.purpose,
                        "description": e.description,
                        "amount": float(e.amount),
                        "type": e.type,
                        "date": str(e.date),
                        "category_id": str(e.category_id) if e.category_id else None,
                        "location": e.location,
                    }
                    for e in expenses
                ],
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "query": q,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions", tags=["search"])
async def search_transactions(
    q: str = Query(..., min_length=1, description="Search query"),
    transaction_type: str = Query(None, description="Filter by transaction type (BORROWED/LENT)"),
    status: str = Query(None, description="Filter by status (PENDING/COMPLETED)"),
    date_from: date = Query(None, description="Start date for filtering"),
    date_to: date = Query(None, description="End date for filtering"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Search transactions with filters."""
    try:
        user_uuid = UUID(user_id)
        transactions, total_count = SearchService.search_transactions(
            db=db,
            user_id=user_uuid,
            query=q,
            transaction_type=transaction_type,
            status=status,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )

        return {
            "status": "success",
            "data": {
                "transactions": [
                    {
                        "id": str(t.id),
                        "person_name": t.person_name,
                        "amount": float(t.amount),
                        "type": t.transaction_type,
                        "status": t.status,
                        "given_date": str(t.given_date),
                        "expected_return_date": str(t.expected_return_date) if t.expected_return_date else None,
                        "purpose": t.purpose,
                    }
                    for t in transactions
                ],
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "query": q,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/global", tags=["search"])
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Perform global search across expenses, transactions, and categories."""
    try:
        user_uuid = UUID(user_id)
        result = SearchService.global_search(
            db=db,
            user_id=user_uuid,
            query=q,
            limit=limit,
        )

        return {
            "status": "success",
            "data": {
                "expenses": [
                    {
                        "id": str(e.id),
                        "purpose": e.purpose,
                        "amount": float(e.amount),
                        "type": e.type,
                        "date": str(e.date),
                    }
                    for e in result["expenses"]
                ],
                "transactions": [
                    {
                        "id": str(t.id),
                        "person_name": t.person_name,
                        "amount": float(t.amount),
                        "type": t.transaction_type,
                        "date": str(t.given_date),
                    }
                    for t in result["transactions"]
                ],
                "categories": [
                    {
                        "id": str(c.id),
                        "name": c.name,
                    }
                    for c in result["categories"]
                ],
                "query": q,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent", tags=["search"])
async def get_recent_searches(
    limit: int = Query(5, ge=1, le=10),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get recent search terms."""
    try:
        user_uuid = UUID(user_id)
        recent = SearchService.get_recent_searches(
            db=db,
            user_id=user_uuid,
            limit=limit,
        )

        return {
            "status": "success",
            "data": {
                "recent": recent,
                "limit": limit,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
